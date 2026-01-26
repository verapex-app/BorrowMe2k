import { users, transactions, accounts, withdrawals, type User, type InsertUser, type Transaction, type InsertTransaction, type Account, type InsertAccount, type Withdrawal, type InsertWithdrawal } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByCredential(credential: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(userId: number, transaction: Omit<InsertTransaction, "userId">): Promise<Transaction>;
  
  getAccounts(userId: number): Promise<Account[]>;
  createAccount(userId: number, account: Omit<InsertAccount, "userId">): Promise<Account>;
  updateAccountBalance(userId: number, amount: string): Promise<void>;

  createWithdrawal(userId: number, withdrawal: Omit<InsertWithdrawal, "userId">): Promise<Withdrawal>;
  
  claimPendingTransfers(user: User): Promise<void>;
  processExpiredTransfers(): Promise<void>;

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

  async getUserByCredential(credential: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      or(
        eq(users.username, credential),
        eq(users.email, credential),
        eq(users.phone, credential)
      )
    );
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

  async updateAccountBalance(userId: number, amount: string): Promise<void> {
    await db.update(accounts)
      .set({ balance: sql`${accounts.balance} + ${amount}` })
      .where(eq(accounts.userId, userId));
  }

  async createWithdrawal(userId: number, insertWithdrawal: Omit<InsertWithdrawal, "userId">): Promise<Withdrawal> {
    const [withdrawal] = await db
      .insert(withdrawals)
      .values({ ...insertWithdrawal, userId })
      .returning();
    return withdrawal;
  }

  async claimPendingTransfers(user: User): Promise<void> {
    const pending = await db.select().from(transactions).where(
      and(
        eq(transactions.status, "pending"),
        or(
          eq(transactions.recipientCredential, user.username),
          user.email ? eq(transactions.recipientCredential, user.email) : undefined,
          user.phone ? eq(transactions.recipientCredential, user.phone) : undefined
        )
      )
    );

    for (const t of pending) {
      await db.transaction(async (tx) => {
        await tx.update(transactions).set({ status: "completed" }).where(eq(transactions.id, t.id));
        await tx.insert(transactions).values({
          userId: user.id,
          title: `Received from User ${t.userId}`,
          amount: Math.abs(Number(t.amount)).toString(),
          type: "credit",
          category: "transfer",
          icon: "arrow-down-left",
          status: "completed"
        });
        await tx.update(accounts).set({ balance: sql`${accounts.balance} + ${Math.abs(Number(t.amount)).toString()}` }).where(eq(accounts.userId, user.id));
      });
    }
  }

  async processExpiredTransfers(): Promise<void> {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const expired = await db.select().from(transactions).where(
      and(
        eq(transactions.status, "pending"),
        sql`${transactions.date} < ${fiveDaysAgo}`
      )
    );

    for (const t of expired) {
      await db.transaction(async (tx) => {
        await tx.update(transactions).set({ status: "refunded" }).where(eq(transactions.id, t.id));
        await tx.insert(transactions).values({
          userId: t.userId,
          title: `Refund: Expired Transfer to ${t.recipientCredential}`,
          amount: Math.abs(Number(t.amount)).toString(),
          type: "credit",
          category: "transfer",
          icon: "rotate-ccw",
          status: "completed"
        });
        await tx.update(accounts).set({ balance: sql`${accounts.balance} + ${Math.abs(Number(t.amount)).toString()}` }).where(eq(accounts.userId, t.userId));
      });
    }
  }
}

export const storage = new DatabaseStorage();
