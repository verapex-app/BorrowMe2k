import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { insertWithdrawalSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.get(api.transactions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transactions = await storage.getTransactions(req.user.id);
    res.json(transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  });

  app.post(api.transactions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.transactions.create.input.parse(req.body);
      const accountsList = await storage.getAccounts(req.user.id);
      const primaryAccount = accountsList[0];
      
      const amount = Math.abs(Number(input.amount));
      if (Number(primaryAccount.balance) < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Check if recipient exists
      const recipient = await storage.getUserByCredential(input.title);
      
      if (recipient) {
        // Direct transfer
        await storage.createTransaction(req.user.id, {
          ...input,
          amount: (-amount).toString(),
          status: "completed"
        });
        await storage.createTransaction(recipient.id, {
          title: `From ${req.user.username}`,
          amount: amount.toString(),
          type: "credit",
          category: input.category,
          icon: "arrow-down-left",
          status: "completed"
        });
        await storage.updateAccountBalance(req.user.id, (-amount).toString());
        await storage.updateAccountBalance(recipient.id, amount.toString());
        res.status(201).json({ message: "Transfer successful" });
      } else {
        // Pending transfer to email/phone
        const transaction = await storage.createTransaction(req.user.id, {
          ...input,
          amount: (-amount).toString(),
          status: "pending",
          recipientCredential: input.title
        });
        await storage.updateAccountBalance(req.user.id, (-amount).toString());
        res.status(201).json(transaction);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post("/api/withdrawals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = insertWithdrawalSchema.omit({ userId: true, status: true }).parse(req.body);
      const accountsList = await storage.getAccounts(req.user.id);
      const primaryAccount = accountsList[0];

      if (Number(primaryAccount.balance) < Number(input.amount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const withdrawal = await storage.createWithdrawal(req.user.id, { ...input, status: "pending" });
      await storage.updateAccountBalance(req.user.id, (-Number(input.amount)).toString());
      await storage.createTransaction(req.user.id, {
        title: `Withdrawal to ${input.accountName}`,
        amount: (-Number(input.amount)).toString(),
        type: "debit",
        category: "withdrawal",
        icon: "banknote",
        status: "completed"
      });
      res.status(201).json(withdrawal);
    } catch (err) {
      res.status(400).json({ message: "Invalid withdrawal data" });
    }
  });

  app.get(api.accounts.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const accounts = await storage.getAccounts(req.user.id);
    res.json(accounts);
  });

  app.get(api.dashboard.getStats.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const accountsList = await storage.getAccounts(req.user.id);
    const transactionsList = await storage.getTransactions(req.user.id);
    
    const totalBalance = accountsList.reduce((acc, curr) => acc + Number(curr.balance), 0);
    const monthlySpending = transactionsList
      .filter(t => t.type === 'debit')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    const income = transactionsList
      .filter(t => t.type === 'credit')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    res.json({
      totalBalance: totalBalance.toFixed(2),
      monthlySpending: monthlySpending.toFixed(2),
      income: income.toFixed(2),
    });
  });

  await seedDatabase();
  return httpServer;
}

async function seedDatabase() {
  const defaultUser = await storage.getUserByUsername("admin");
  if (!defaultUser) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const user = await storage.createUser({
      username: "admin",
      password: hashedPassword,
      email: "admin@example.com"
    });

    await storage.createAccount(user.id, {
      type: "Main Checking",
      balance: "12450.00",
      currency: "GBP",
      accountNumber: "**** 4582"
    });
  }
}
