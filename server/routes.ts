import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sanitizeString, sanitizeEmail, sanitizePhone, sanitizeUsername } from "./sanitize";
import { sendLoanApplicationEmails, sendAdminMessageToUser, sendKycStatusEmail } from "./email";

function calcMonthlyPayment(
  principal: number,
  monthlyRatePct: number,
  termMonths: number,
): number {
  // Simple interest amortization (common for short-term microloans):
  // total = principal * (1 + rate * months); monthly = total / months
  const total = principal * (1 + (monthlyRatePct / 100) * termMonths);
  return total / termMonths;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  setupAuth(app);

  app.get(api.loanProducts.list.path, async (_req, res) => {
    const products = await storage.listLoanProducts();
    res.json(products);
  });

  app.get(api.loans.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const list = await storage.listLoans(req.user.id);
    res.json(list);
  });

  app.post(api.loans.apply.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const applicant = await storage.getUser(req.user.id);
    if (!applicant || applicant.kycStatus !== "verified") {
      return res.status(403).json({
        message: "KYC verification required before applying for a loan.",
        kycStatus: applicant?.kycStatus ?? "not_submitted",
        kycLink: applicant?.kycLink ?? null,
      });
    }

    try {
      const input = api.loans.apply.input.parse(req.body);
      const product = await storage.getLoanProduct(input.productId);
      if (!product) {
        return res.status(400).json({ message: "Loan product not found" });
      }

      const principal = Number(input.principal);
      const min = Number(product.minAmount);
      const max = Number(product.maxAmount);
      if (principal < min || principal > max) {
        return res.status(400).json({
          message: `Amount must be between ${min.toLocaleString()} and ${max.toLocaleString()} FCFA`,
          field: "principal",
        });
      }
      if (
        input.termMonths < product.minTermMonths ||
        input.termMonths > product.maxTermMonths
      ) {
        return res.status(400).json({
          message: `Term must be between ${product.minTermMonths} and ${product.maxTermMonths} months`,
          field: "termMonths",
        });
      }

      const rate = Number(product.interestRate);
      const monthly = calcMonthlyPayment(principal, rate, input.termMonths);
      const total = monthly * input.termMonths;
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + input.termMonths);

      // Auto-approve so the user immediately sees their loan and schedule.
      const loan = await storage.createLoan({
        userId: req.user.id,
        productId: product.id,
        productName: product.name,
        principal: principal.toFixed(2),
        interestRate: rate.toFixed(2),
        termMonths: input.termMonths,
        monthlyPayment: monthly.toFixed(2),
        totalRepayment: total.toFixed(2),
        amountPaid: "0",
        purpose: input.purpose,
        status: "active",
        approvedAt: new Date(),
        dueDate,
      });

      res.status(201).json(loan);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.post("/api/loans/:id/repay", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const loanId = Number(req.params.id);
    if (Number.isNaN(loanId)) {
      return res.status(400).json({ message: "Invalid loan id" });
    }
    try {
      const input = api.loans.repay.input.parse(req.body);
      const loan = await storage.getLoan(loanId);
      if (!loan || loan.userId !== req.user.id) {
        return res.status(404).json({ message: "Loan not found" });
      }
      if (loan.status !== "active") {
        return res
          .status(400)
          .json({ message: "Loan is not active and cannot be repaid" });
      }

      const outstanding =
        Number(loan.totalRepayment) - Number(loan.amountPaid);
      const amount = Math.min(Number(input.amount), outstanding);
      if (amount <= 0) {
        return res.status(400).json({ message: "Nothing left to repay" });
      }

      const repayment = await storage.createRepayment({
        loanId: loan.id,
        userId: req.user.id,
        amount: amount.toFixed(2),
        method: input.method,
      });

      const newPaid = Number(loan.amountPaid) + amount;
      const status =
        newPaid >= Number(loan.totalRepayment) - 0.01 ? "repaid" : "active";
      await storage.updateLoan(loan.id, {
        amountPaid: newPaid.toFixed(2),
        status,
      });

      res.status(201).json(repayment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  // Pre-KYC loan intent — creates a pending loan and notifies admin + applicant
  app.post("/api/loan-intent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const intentSchema = z.object({
      productId: z.number().int().positive(),
      principal: z.coerce.number().positive().max(100_000_000),
      termMonths: z.coerce.number().int().positive().max(360),
      reason: z.string().min(3, "Please describe why you need this loan").max(500),
    });

    let input: z.infer<typeof intentSchema>;
    try {
      input = intentSchema.parse(req.body);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(400).json({ message: "Invalid request" });
    }

    const existingLoans = await storage.listLoans(req.user.id);
    const hasPending = existingLoans.some((l) => l.status === "pending");
    if (hasPending) {
      return res.status(409).json({ message: "You already have a pending application." });
    }

    const product = await storage.getLoanProduct(input.productId);
    if (!product) return res.status(400).json({ message: "Loan product not found" });

    const principal = input.principal;
    const rate = Number(product.interestRate);
    const monthly = principal * (1 + (rate / 100) * input.termMonths) / input.termMonths;
    const total = monthly * input.termMonths;
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + input.termMonths);

    const loan = await storage.createLoan({
      userId: req.user.id,
      productId: product.id,
      productName: product.name,
      principal: principal.toFixed(2),
      interestRate: rate.toFixed(2),
      termMonths: input.termMonths,
      monthlyPayment: monthly.toFixed(2),
      totalRepayment: total.toFixed(2),
      amountPaid: "0",
      purpose: input.reason,
      status: "pending",
      approvedAt: null,
      dueDate,
    });

    const applicant = await storage.getUser(req.user.id);
    if (applicant?.email && process.env.ADMIN_EMAIL && process.env.RESEND_API_KEY) {
      sendLoanApplicationEmails({
        applicantEmail: applicant.email,
        applicantName: applicant.fullName ?? applicant.username,
        productName: product.name,
        amount: principal,
        termMonths: input.termMonths,
        reason: input.reason,
      }).catch((err) => console.error("[email] loan-intent notification failed:", err));
    }

    res.status(201).json(loan);
  });

  app.get(api.repayments.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const list = await storage.listRepayments(req.user.id);
    res.json(list);
  });

  app.get(api.dashboard.getStats.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userLoans = await storage.listLoans(req.user.id);

    const activeLoans = userLoans.filter((l) => l.status === "active");
    const outstandingBalance = activeLoans.reduce(
      (acc, l) =>
        acc + (Number(l.totalRepayment) - Number(l.amountPaid)),
      0,
    );
    const totalBorrowed = userLoans.reduce(
      (acc, l) => acc + Number(l.principal),
      0,
    );
    const totalRepaid = userLoans.reduce(
      (acc, l) => acc + Number(l.amountPaid),
      0,
    );

    let nextPaymentAmount: string | null = null;
    let nextPaymentDate: string | null = null;
    if (activeLoans.length > 0) {
      const next = activeLoans
        .slice()
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        )[0];
      nextPaymentAmount = Number(next.monthlyPayment).toFixed(2);
      const due = new Date();
      due.setDate(due.getDate() + 30);
      nextPaymentDate = due.toISOString();
    }

    res.json({
      activeLoans: activeLoans.length,
      outstandingBalance: outstandingBalance.toFixed(2),
      totalBorrowed: totalBorrowed.toFixed(2),
      totalRepaid: totalRepaid.toFixed(2),
      nextPaymentAmount,
      nextPaymentDate,
    });
  });

  // ── Admin middleware ──────────────────────────────────────────────────────
  function requireAdmin(req: any, res: any, next: any) {
    if (req.session?.isAdmin) return next();
    return res.status(401).json({ message: "Admin authentication required" });
  }

  // Admin login
  app.post("/api/admin/login", (req, res) => {
    const { username, pin } = req.body as { username: string; pin: string };
    const validUsername = process.env.ADMIN_USERNAME;
    const validPin = process.env.ADMIN_PIN;
    if (!validUsername || !validPin) {
      return res.status(500).json({ message: "Admin credentials not configured" });
    }
    if (username === validUsername && pin === validPin) {
      (req.session as any).isAdmin = true;
      return res.json({ ok: true });
    }
    return res.status(401).json({ message: "Invalid credentials" });
  });

  app.post("/api/admin/logout", (req, res) => {
    (req.session as any).isAdmin = false;
    res.json({ ok: true });
  });

  app.get("/api/admin/check", (req, res) => {
    res.json({ isAdmin: !!(req.session as any)?.isAdmin });
  });

  // Admin stats
  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    const stats = await storage.getPlatformStats();
    res.json(stats);
  });

  // Admin users
  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    const allUsers = await storage.listAllUsers();
    const safe = allUsers.map(({ password: _p, ...u }) => u);
    res.json(safe);
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    const kycStatusValues = ["not_submitted", "pending", "verified", "rejected"] as const;
    const adminUserPatchSchema = z.object({
      kycStatus: z.enum(kycStatusValues).optional(),
      kycLink: z.string().url("KYC link must be a valid URL").max(2048).optional().nullable()
        .transform((v) => (v ? v.trim() : v)),
      kycNotes: z.string().max(2000).optional().nullable()
        .transform((v) => (typeof v === "string" ? sanitizeString(v, 2000) : v)),
      fullName: z.string().min(2).max(100).optional()
        .transform((v) => (v ? sanitizeString(v, 100) : v)),
      email: z.string().email().max(254).optional()
        .transform((v) => (v ? sanitizeEmail(v) : v)),
      phone: z.string().max(20).optional()
        .transform((v) => (v ? sanitizePhone(v) : v)),
      city: z.string().min(2).max(100).optional()
        .transform((v) => (v ? sanitizeString(v, 100) : v)),
    });

    let patch: Record<string, any>;
    try {
      patch = adminUserPatchSchema.parse(req.body);
      // Remove undefined keys
      Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(400).json({ message: "Invalid data" });
    }

    const updated = await storage.updateUser(id, patch);
    const { password: _p, ...safe } = updated;
    res.json(safe);
  });

  // Admin loans
  app.get("/api/admin/loans", requireAdmin, async (_req, res) => {
    const allLoans = await storage.listAllLoans();
    res.json(allLoans);
  });

  app.patch("/api/admin/loans/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    const allowed = ["status"];
    const patch: Record<string, any> = {};
    for (const key of allowed) {
      if (key in req.body) patch[key] = req.body[key];
    }
    const updated = await storage.updateLoan(id, patch);
    res.json(updated);
  });

  // Admin repayments
  app.get("/api/admin/repayments", requireAdmin, async (_req, res) => {
    const all = await storage.listAllRepayments();
    res.json(all);
  });

  // Admin KYC link pool
  app.get("/api/admin/kyc-pool", requireAdmin, async (_req, res) => {
    const links = await storage.listKycPoolLinks();
    res.json(links);
  });

  app.post("/api/admin/kyc-pool", requireAdmin, async (req, res) => {
    const { rawLink } = req.body;
    if (!rawLink || typeof rawLink !== "string") {
      return res.status(400).json({ message: "rawLink is required" });
    }
    try { new URL(rawLink); } catch {
      return res.status(400).json({ message: "Must be a valid URL" });
    }
    const link = await storage.addKycPoolLink(rawLink.trim());
    res.status(201).json(link);
  });

  app.delete("/api/admin/kyc-pool/:id", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });
    await storage.deleteKycPoolLink(id);
    res.json({ ok: true });
  });

  // Admin manually assign a pool link to a user
  app.post("/api/admin/kyc-pool/assign/:userId", requireAdmin, async (req, res) => {
    const userId = Number(req.params.userId);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });
    const link = await storage.assignKycLinkToUser(userId);
    if (!link) return res.status(404).json({ message: "No available KYC links in the pool" });
    res.json({ kycLink: link });
  });

  // Save personal profile details before KYC verification — starts 30-min waiting period
  app.post("/api/kyc/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const schema = z.object({
      firstName: z.string().min(1, "First name is required").max(100).transform((v) => v.trim()),
      lastName: z.string().min(1, "Last name is required").max(100).transform((v) => v.trim()),
      dateOfBirth: z.string().min(1, "Date of birth is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
      idCardNumber: z.string().min(1, "ID card number is required").max(50).transform((v) => v.trim()),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const waitingUntil = new Date(Date.now() + 30 * 60 * 1000);
    const updated = await storage.updateUser(req.user.id, {
      ...parsed.data,
      kycWaitingUntil: waitingUntil,
    });
    res.json(updated);
  });

  // Admin: end the waiting period for a user and send the KYC ready email
  app.post("/api/admin/users/:id/clear-waiting", requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

    const bodySchema = z.object({
      emailMessage: z.string().min(1).max(5000).optional(),
      sendEmail: z.boolean().optional().default(true),
    });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });

    const user = await storage.getUser(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await storage.updateUser(id, { kycWaitingUntil: null });

    if (parsed.data.sendEmail && user.email && process.env.RESEND_API_KEY) {
      const kycLink = user.kycLink ?? "";
      const defaultMsg = `Hello,\n\nYour loan is almost approved.\n\nPlease log in to your account and apply for your loan application.\n\nWe will also need you to confirm your identity. You can easily verify your identity using the link below:\n\n${kycLink}\n\nThank you.`;
      const customMsg = parsed.data.emailMessage ?? defaultMsg;

      sendAdminMessageToUser({
        toEmail: user.email,
        toName: user.fullName ?? user.username,
        subject: "Your loan is almost approved — action required",
        bodyHtml: customMsg,
        kycLink: kycLink || undefined,
      }).catch((err) => console.error("[email] clear-waiting email failed:", err));
    }

    const updated = await storage.getUser(id);
    const { password: _p, ...safe } = updated!;
    res.json(safe);
  });

  // Admin: send a custom email to a specific user
  app.post("/api/admin/send-email", requireAdmin, async (req, res) => {
    const emailSchema = z.object({
      userId: z.number().int().positive(),
      subject: z.string().min(1, "Subject is required").max(200),
      message: z.string().min(1, "Message is required").max(5000),
    });
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const user = await storage.getUser(parsed.data.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.email) return res.status(400).json({ message: "This user has no email address on file" });
    if (!process.env.RESEND_API_KEY) return res.status(500).json({ message: "Email service not configured" });

    try {
      await sendAdminMessageToUser({
        toEmail: user.email,
        toName: user.fullName ?? user.username,
        subject: parsed.data.subject,
        bodyHtml: parsed.data.message,
      });
      res.json({ ok: true });
    } catch (err: any) {
      console.error("[email] admin send-email failed:", err);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Admin: send KYC status notification email to a user
  app.post("/api/admin/send-kyc-email", requireAdmin, async (req, res) => {
    const schema = z.object({
      userId: z.number().int().positive(),
      newStatus: z.enum(["not_submitted", "pending", "verified", "rejected"]),
      message: z.string().min(1, "Message is required").max(5000),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const user = await storage.getUser(parsed.data.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.email) return res.status(400).json({ message: "This user has no email address on file" });
    if (!process.env.RESEND_API_KEY) return res.status(500).json({ message: "Email service not configured" });

    try {
      await sendKycStatusEmail({
        toEmail: user.email,
        toName: user.fullName ?? user.username,
        newStatus: parsed.data.newStatus,
        customMessage: parsed.data.message,
      });
      res.json({ ok: true });
    } catch (err: any) {
      console.error("[email] admin kyc-email failed:", err);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Public — called when user returns from Persona KYC redirect
  app.post("/api/kyc/submitted", async (req, res) => {
    const userId = Number(req.body.userId);
    if (Number.isNaN(userId)) return res.status(400).json({ message: "Invalid userId" });
    await storage.markKycSubmitted(userId);
    res.json({ ok: true });
  });

  await seedDatabase();
  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.listLoanProducts();
  if (existing.length === 0) {
    const products = [
      {
        name: "Quick Cash",
        description:
          "Fast emergency loan, disbursed instantly via Mobile Money.",
        category: "personal",
        icon: "zap",
        minAmount: "10000",
        maxAmount: "150000",
        interestRate: "5.0",
        minTermMonths: 1,
        maxTermMonths: 3,
        processingFeePct: "1.5",
      },
      {
        name: "Salary Advance",
        description:
          "Borrow against your monthly salary, repay on payday.",
        category: "personal",
        icon: "wallet",
        minAmount: "25000",
        maxAmount: "500000",
        interestRate: "3.5",
        minTermMonths: 1,
        maxTermMonths: 6,
        processingFeePct: "1.0",
      },
      {
        name: "Business Boost",
        description:
          "Working capital for small traders and SMEs in Cameroon.",
        category: "business",
        icon: "store",
        minAmount: "100000",
        maxAmount: "2000000",
        interestRate: "4.0",
        minTermMonths: 3,
        maxTermMonths: 18,
        processingFeePct: "2.0",
      },
      {
        name: "School Fees",
        description:
          "Cover tuition for primary, secondary, or university.",
        category: "education",
        icon: "graduation-cap",
        minAmount: "50000",
        maxAmount: "1000000",
        interestRate: "2.5",
        minTermMonths: 3,
        maxTermMonths: 12,
        processingFeePct: "1.0",
      },
      {
        name: "Agriculture Loan",
        description:
          "For farmers needing seeds, fertilizer, or equipment.",
        category: "agriculture",
        icon: "sprout",
        minAmount: "75000",
        maxAmount: "1500000",
        interestRate: "3.0",
        minTermMonths: 6,
        maxTermMonths: 24,
        processingFeePct: "1.5",
      },
      {
        name: "Moto / Vehicle",
        description:
          "Finance a moto-taxi, used car, or commercial vehicle.",
        category: "transport",
        icon: "bike",
        minAmount: "200000",
        maxAmount: "3000000",
        interestRate: "3.5",
        minTermMonths: 6,
        maxTermMonths: 24,
        processingFeePct: "2.0",
      },
    ];
    for (const p of products) {
      await storage.createLoanProduct(p);
    }
  }
} 