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

  app.get(api.transactions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transactions = await storage.getTransactions(req.user.id);
    res.json(transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  });

  app.post(api.transactions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.transactions.create.input.parse(req.body);
      const transaction = await storage.createTransaction(req.user.id, input);
      res.status(201).json(transaction);
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

  // Seed Data for default user if needed
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
      currency: "USD",
      accountNumber: "**** 4582"
    });
    
    await storage.createTransaction(user.id, {
      title: "Apple Store",
      amount: "129.00",
      type: "debit",
      category: "Shopping",
      icon: "shopping-bag"
    });
  }
}
