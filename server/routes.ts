import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";

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
    const allowed = ["kycStatus", "kycLink", "kycNotes", "fullName", "email", "phone", "city"];
    const patch: Record<string, any> = {};
    for (const key of allowed) {
      if (key in req.body) patch[key] = req.body[key];
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

  const defaultUser = await storage.getUserByUsername("demo");
  if (!defaultUser) {
    const hashedPassword = await bcrypt.hash("demo1234", 10);
    await storage.createUser({
      username: "demo",
      password: hashedPassword,
      fullName: "Awa Tabe",
      email: "demo@borrowme.cm",
      phone: "+237670000000",
      city: "Douala",
    });
  }
}
