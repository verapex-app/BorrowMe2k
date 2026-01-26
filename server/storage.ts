import { users, transactions, accounts, type User, type InsertUser, type Transaction, type InsertTransaction, type Account, type InsertAccount } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(userId: number, transaction: Omit<InsertTransaction, "userId">): Promise<Transaction>;
  
  getAccounts(userId: number): Promise<Account[]>;
  createAccount(userId: number, account: Omit<InsertAccount, "userId">): Promise<Account>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(transactions.date);
  }

  async createTransaction(userId: number, insertTransaction: Omit<InsertTransaction, "userId">): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({ ...insertTransaction, userId })
      .returning();
    return transaction;
  }

  async getAccounts(userId: number): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.userId, userId));
  }

  async createAccount(userId: number, insertAccount: Omit<InsertAccount, "userId">): Promise<Account> {
    const [account] = await db
      .insert(accounts)
      .values({ ...insertAccount, userId })
      .returning();
    return account;
  }
}

export const storage = new DatabaseStorage();
