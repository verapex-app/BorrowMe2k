import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User as SelectUser, usernameField, passwordField, emailField, phoneField, nameField, cityField } from "@shared/schema";
import { sendOtpEmail, verifyOtp } from "./otp";
import { createResetToken, consumeResetToken, sendResetEmail } from "./reset";
import { sanitizeString, sanitizeEmail, sanitizeUsername, sanitizePhone } from "./sanitize";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const isProd = process.env.NODE_ENV === "production";

  if (!process.env.SESSION_SECRET && isProd) {
    throw new Error("SESSION_SECRET must be set in production");
  }

  if (isProd) {
    app.set("trust proxy", 1);
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "borrowme-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: "bm.sid",
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByCredential(username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!process.env.RESEND_API_KEY) {
      return res.status(503).json({ message: "Email service is not configured" });
    }
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "This email is already registered. Please log in instead." });
    }
    try {
      await sendOtpEmail(email);
      res.json({ message: "OTP sent" });
    } catch (err: any) {
      res.status(500).json({ message: err.message ?? "Failed to send OTP email. Check your email address." });
    }
  });

  app.post("/api/verify-otp", (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }
    const valid = verifyOtp(email, code);
    if (!valid) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }
    res.json({ message: "Email verified" });
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate and sanitize all registration fields up-front
      const registerSchema = z.object({
        username: usernameField,
        password: passwordField,
        fullName: nameField,
        email: emailField,
        phone: phoneField,
        city: cityField.optional().default("Douala"),
      });

      let parsed: z.infer<typeof registerSchema>;
      try {
        parsed = registerSchema.parse({
          username: sanitizeUsername(req.body.username),
          password: req.body.password,
          fullName: sanitizeString(req.body.fullName, 100),
          email: sanitizeEmail(req.body.email),
          phone: sanitizePhone(req.body.phone),
          city: sanitizeString(req.body.city ?? "Douala", 100),
        });
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          return res.status(400).json({ message: err.errors[0].message });
        }
        return res.status(400).json({ message: "Invalid registration data" });
      }

      const existingUser = await storage.getUserByUsername(parsed.username);
      if (existingUser) {
        return res.status(409).json({ message: "This username is already taken." });
      }

      const existingEmail = await storage.getUserByEmail(parsed.email);
      if (existingEmail) {
        return res.status(409).json({ message: "This email is already registered. Please log in instead." });
      }

      const hashedPassword = await bcrypt.hash(parsed.password, 10);
      const user = await storage.createUser({
        ...parsed,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err: any) {
      if (err.code === "23505") {
        if (err.constraint?.includes("email")) {
          return res.status(409).json({ message: "This email is already registered. Please log in instead." });
        }
        if (err.constraint?.includes("username")) {
          return res.status(409).json({ message: "This username is already taken." });
        }
        return res.status(409).json({ message: "Account already exists with these details." });
      }
      next(err);
    }
  });

  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!process.env.RESEND_API_KEY) {
      return res.status(503).json({ message: "Email service is not configured" });
    }
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }
    try {
      const token = createResetToken(user.id);
      const baseUrl = process.env.APP_URL?.replace(/\/$/, "") ||
        (() => {
          const proto = req.headers["x-forwarded-proto"] ?? req.protocol;
          const host = req.headers["x-forwarded-host"] ?? req.get("host");
          return `${proto}://${host}`;
        })();
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;
      await sendResetEmail(email, resetUrl);
      res.json({ message: "Reset link sent" });
    } catch (err: any) {
      res.status(500).json({ message: err.message ?? "Failed to send reset email" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }
    const userId = consumeResetToken(token);
    if (!userId) {
      return res.status(400).json({ message: "This reset link is invalid or has expired" });
    }
    const hashed = await bcrypt.hash(password, 10);
    await storage.updateUserPassword(userId, hashed);
    res.json({ message: "Password updated" });
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).send(info?.message || "Login failed");
      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
