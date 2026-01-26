import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.transactions.list.path, async (req, res) => {
    const transactions = await storage.getTransactions();
    // Sort by date descending
    res.json(transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  });

  app.post(api.transactions.create.path, async (req, res) => {
    try {
      const input = api.transactions.create.input.parse(req.body);
      const transaction = await storage.createTransaction(input);
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
    const accounts = await storage.getAccounts();
    res.json(accounts);
  });

  app.get(api.dashboard.getStats.path, async (req, res) => {
    const accountsList = await storage.getAccounts();
    const transactionsList = await storage.getTransactions();
    
    // Simple calculation logic
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

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingAccounts = await storage.getAccounts();
  if (existingAccounts.length === 0) {
    // Seed Accounts
    await storage.createAccount({
      type: "Main Checking",
      balance: "12450.00",
      currency: "USD",
      accountNumber: "**** 4582"
    });
    
    // Seed Transactions
    await storage.createTransaction({
      title: "Apple Store",
      amount: "129.00",
      type: "debit",
      category: "Shopping",
      icon: "shopping-bag"
    });
    await storage.createTransaction({
      title: "Uber Trip",
      amount: "24.50",
      type: "debit",
      category: "Transport",
      icon: "car"
    });
    await storage.createTransaction({
      title: "Salary Deposit",
      amount: "4500.00",
      type: "credit",
      category: "Income",
      icon: "dollar-sign"
    });
    await storage.createTransaction({
      title: "Starbucks",
      amount: "5.40",
      type: "debit",
      category: "Food",
      icon: "coffee"
    });
     await storage.createTransaction({
      title: "Netflix Subscription",
      amount: "15.99",
      type: "debit",
      category: "Entertainment",
      icon: "film"
    });
  }
}
