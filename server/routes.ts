import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Background task for expired transactions
  setInterval(() => storage.processExpiredTransactions(), 60 * 60 * 1000); // Hourly

  app.get(api.transactions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transactions = await storage.getTransactions(req.user.id);
    res.json(transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  });

  app.post(api.transactions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.transactions.create.input.parse(req.body);
      const amount = Math.abs(Number(input.amount));
      const account = await storage.getAccount(req.user.id);

      if (!account || Number(account.balance) < amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      const recipient = await storage.getUserByIdentifier(input.title); // title is identifier here
      
      let transaction;
      if (recipient) {
        // Direct transfer
        transaction = await storage.createTransaction(req.user.id, {
          ...input,
          amount: (-amount).toString(),
          recipientId: recipient.id,
          status: 'completed'
        });
        await storage.updateAccountBalance(req.user.id, (-amount).toString());
        await storage.updateAccountBalance(recipient.id, amount.toString());
      } else {
        // Pending transfer to unregistered user
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 5);
        
        transaction = await storage.createTransaction(req.user.id, {
          ...input,
          amount: (-amount).toString(),
          pendingRecipientIdentifier: input.title,
          status: 'pending',
          expiresAt
        });
        await storage.updateAccountBalance(req.user.id, (-amount).toString());
      }

      res.status(201).json(transaction);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/withdraw", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { amount, sortCode, accountNumber, name } = req.body;
    const amountNum = Math.abs(Number(amount));
    
    const account = await storage.getAccount(req.user.id);
    if (!account || Number(account.balance) < amountNum) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    const transaction = await storage.createTransaction(req.user.id, {
      title: `Withdrawal to ${name}`,
      amount: (-amountNum).toString(),
      type: "withdrawal",
      category: "transfer",
      icon: "bank",
      status: "withdrawn",
      bankingInfo: JSON.stringify({ sortCode, accountNumber, name })
    });

    await storage.updateAccountBalance(req.user.id, (-amountNum).toString());
    res.status(201).json(transaction);
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
      .filter(t => t.type === 'debit' || t.type === 'pending_send' || t.type === 'withdrawal')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    const income = transactionsList
      .filter(t => t.type === 'credit')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);

    res.json({
      totalBalance: totalBalance.toFixed(2),
      monthlySpending: Math.abs(monthlySpending).toFixed(2),
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
      password: hashedPassword
    });

    await storage.createAccount(user.id, {
      type: "Main Checking",
      balance: "12450.00",
      currency: "GBP",
      accountNumber: "**** 4582"
    });
  }
}
