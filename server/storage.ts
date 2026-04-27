import {
  users,
  loanProducts,
  loans,
  repayments,
  type User,
  type InsertUser,
  type LoanProduct,
  type InsertLoanProduct,
  type Loan,
  type Repayment,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByCredential(credential: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  listLoanProducts(): Promise<LoanProduct[]>;
  getLoanProduct(id: number): Promise<LoanProduct | undefined>;
  createLoanProduct(product: InsertLoanProduct): Promise<LoanProduct>;

  listLoans(userId: number): Promise<Loan[]>;
  getLoan(id: number): Promise<Loan | undefined>;
  createLoan(loan: Omit<Loan, "id" | "appliedAt">): Promise<Loan>;
  updateLoan(id: number, patch: Partial<Loan>): Promise<Loan>;

  listRepayments(userId: number): Promise<Repayment[]>;
  listRepaymentsByLoan(loanId: number): Promise<Repayment[]>;
  createRepayment(
    repayment: Omit<Repayment, "id" | "paidAt">,
  ): Promise<Repayment>;

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
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByCredential(credential: string): Promise<User | undefined> {
    const byUsername = await this.getUserByUsername(credential);
    if (byUsername) return byUsername;
    const [byEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, credential));
    if (byEmail) return byEmail;
    const [byPhone] = await db
      .select()
      .from(users)
      .where(eq(users.phone, credential));
    return byPhone;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async listLoanProducts(): Promise<LoanProduct[]> {
    return await db
      .select()
      .from(loanProducts)
      .orderBy(asc(loanProducts.id));
  }

  async getLoanProduct(id: number): Promise<LoanProduct | undefined> {
    const [product] = await db
      .select()
      .from(loanProducts)
      .where(eq(loanProducts.id, id));
    return product;
  }

  async createLoanProduct(
    product: InsertLoanProduct,
  ): Promise<LoanProduct> {
    const [created] = await db
      .insert(loanProducts)
      .values(product)
      .returning();
    return created;
  }

  async listLoans(userId: number): Promise<Loan[]> {
    return await db
      .select()
      .from(loans)
      .where(eq(loans.userId, userId))
      .orderBy(desc(loans.appliedAt));
  }

  async getLoan(id: number): Promise<Loan | undefined> {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    return loan;
  }

  async createLoan(
    loan: Omit<Loan, "id" | "appliedAt">,
  ): Promise<Loan> {
    const [created] = await db.insert(loans).values(loan).returning();
    return created;
  }

  async updateLoan(id: number, patch: Partial<Loan>): Promise<Loan> {
    const [updated] = await db
      .update(loans)
      .set(patch)
      .where(eq(loans.id, id))
      .returning();
    return updated;
  }

  async listRepayments(userId: number): Promise<Repayment[]> {
    return await db
      .select()
      .from(repayments)
      .where(eq(repayments.userId, userId))
      .orderBy(desc(repayments.paidAt));
  }

  async listRepaymentsByLoan(loanId: number): Promise<Repayment[]> {
    return await db
      .select()
      .from(repayments)
      .where(eq(repayments.loanId, loanId))
      .orderBy(desc(repayments.paidAt));
  }

  async createRepayment(
    repayment: Omit<Repayment, "id" | "paidAt">,
  ): Promise<Repayment> {
    const [created] = await db
      .insert(repayments)
      .values(repayment)
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
