import { users, transactions, accounts, type User, type InsertUser, type Transaction, type InsertTransaction, type Account, type InsertAccount } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, lt, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(userId: number, transaction: Omit<InsertTransaction, "userId">): Promise<Transaction>;
  updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction>;
  
  getAccounts(userId: number): Promise<Account[]>;
  getAccount(userId: number): Promise<Account | undefined>;
  updateAccountBalance(userId: number, amount: string): Promise<void>;
  createAccount(userId: number, account: Omit<InsertAccount, "userId">): Promise<Account>;

  processExpiredTransactions(): Promise<void>;
  claimPendingTransactions(user: User): Promise<void>;

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

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      or(
        eq(users.username, identifier),
        eq(users.email, identifier),
        eq(users.phone, identifier)
      )
    );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      email: insertUser.username.includes('@') ? insertUser.username : null,
      phone: !insertUser.username.includes('@') ? insertUser.username : null,
    }).returning();
    return user;
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(
      or(
        eq(transactions.userId, userId),
        eq(transactions.recipientId, userId)
      )
    ).orderBy(transactions.date);
  }

  async createTransaction(userId: number, insertTransaction: Omit<InsertTransaction, "userId">): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values({ ...insertTransaction, userId })
      .returning();
    return transaction;
  }

  async updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return transaction;
  }

  async getAccounts(userId: number): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.userId, userId));
  }

  async getAccount(userId: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.userId, userId));
    return account;
  }

  async updateAccountBalance(userId: number, amount: string): Promise<void> {
    await db.update(accounts)
      .set({ balance: sql`${accounts.balance} + ${amount}` })
      .where(eq(accounts.userId, userId));
  }

  async createAccount(userId: number, insertAccount: Omit<InsertAccount, "userId">): Promise<Account> {
    const [account] = await db
      .insert(accounts)
      .values({ ...insertAccount, userId })
      .returning();
    return account;
  }

  async processExpiredTransactions(): Promise<void> {
    const expired = await db.select().from(transactions).where(
      and(
        eq(transactions.status, 'pending'),
        lt(transactions.expiresAt, new Date())
      )
    );

    for (const tx of expired) {
      await db.transaction(async (trx) => {
        await trx.update(transactions).set({ status: 'refunded' }).where(eq(transactions.id, tx.id));
        await trx.update(accounts)
          .set({ balance: sql`${accounts.balance} + ${Math.abs(Number(tx.amount))}` })
          .where(eq(accounts.userId, tx.userId));
      });
    }
  }

  async claimPendingTransactions(user: User): Promise<void> {
    const pending = await db.select().from(transactions).where(
      and(
        eq(transactions.status, 'pending'),
        or(
          eq(transactions.pendingRecipientIdentifier, user.email || ''),
          eq(transactions.pendingRecipientIdentifier, user.phone || '')
        )
      )
    );

    for (const tx of pending) {
      await db.transaction(async (trx) => {
        await trx.update(transactions).set({ 
          status: 'completed',
          recipientId: user.id,
          pendingRecipientIdentifier: null 
        }).where(eq(transactions.id, tx.id));
        
        await trx.update(accounts)
          .set({ balance: sql`${accounts.balance} + ${Math.abs(Number(tx.amount))}` })
          .where(eq(accounts.userId, user.id));
      });
    }
  }
}

export const storage = new DatabaseStorage();
