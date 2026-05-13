import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sendOtpEmail, verifyOtp } from "./otp";
import { createResetToken, consumeResetToken, sendResetEmail } from "./reset";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "borrowme-app-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: app.get("env") === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

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
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
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
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(409).json({ message: "This username is already taken." });
      }

      if (req.body.email) {
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          return res.status(409).json({ message: "This email is already registered. Please log in instead." });
        }
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = await storage.createUser({
        ...req.body,
        email: req.body.email ? req.body.email.toLowerCase() : req.body.email,
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
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.status(503).json({ message: "Email service is not configured" });
    }
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }
    try {
      const token = createResetToken(user.id);
      const proto = req.headers["x-forwarded-proto"] ?? req.protocol;
      const host = req.headers["x-forwarded-host"] ?? req.get("host");
      const resetUrl = `${proto}://${host}/reset-password?token=${token}`;
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
