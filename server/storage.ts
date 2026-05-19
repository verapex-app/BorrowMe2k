import {
  users,
  loanProducts,
  loans,
  repayments,
  kycLinkPool,
  type User,
  type InsertUser,
  type LoanProduct,
  type InsertLoanProduct,
  type Loan,
  type Repayment,
  type KycPoolLink,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, asc, isNull } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByCredential(credential: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<void>;

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

  // Admin methods
  listAllUsers(): Promise<User[]>;
  updateUser(id: number, patch: Partial<User>): Promise<User>;
  listAllLoans(): Promise<(Loan & { applicantName: string; applicantPhone: string })[]>;
  listAllRepayments(): Promise<Repayment[]>;

  deleteUser(id: number): Promise<void>;

  // KYC link pool
  addKycPoolLink(rawLink: string): Promise<KycPoolLink>;
  listKycPoolLinks(): Promise<(KycPoolLink & { assignedUsername: string | null })[]>;
  deleteKycPoolLink(id: number): Promise<void>;
  assignKycLinkToUser(userId: number): Promise<string | null>;
  markKycSubmitted(userId: number): Promise<void>;

  getPlatformStats(): Promise<{
    totalUsers: number;
    totalLoans: number;
    activeLoans: number;
    totalDisbursed: number;
    totalRepaid: number;
    pendingKyc: number;
    verifiedKyc: number;
  }>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const MemStore = MemoryStore(session);
    this.sessionStore = new MemStore({
      checkPeriod: 86400000,
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));
  }

  async getUserByCredential(credential: string): Promise<User | undefined> {
    const trimmed = credential.trim();

    const byUsername = await this.getUserByUsername(trimmed);
    if (byUsername) return byUsername;

    const [byEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, trimmed.toLowerCase()));
    if (byEmail) return byEmail;

    const phoneNorm = trimmed.replace(/\s+/g, "");
    const [byPhone] = await db
      .select()
      .from(users)
      .where(eq(users.phone, phoneNorm));
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

  async listAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.id));
  }

  async updateUser(id: number, patch: Partial<User>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async listAllLoans(): Promise<(Loan & { applicantName: string; applicantPhone: string })[]> {
    const rows = await db
      .select({
        loan: loans,
        applicantName: users.fullName,
        applicantPhone: users.phone,
      })
      .from(loans)
      .leftJoin(users, eq(loans.userId, users.id))
      .orderBy(desc(loans.appliedAt));
    return rows.map((r) => ({
      ...r.loan,
      applicantName: r.applicantName ?? "Unknown",
      applicantPhone: r.applicantPhone ?? "",
    }));
  }

  async listAllRepayments(): Promise<Repayment[]> {
    return await db.select().from(repayments).orderBy(desc(repayments.paidAt));
  }

  async deleteUser(id: number): Promise<void> {
    // 1. Release any pool KYC link assigned to this user back to the pool
    await db
      .update(kycLinkPool)
      .set({ assignedUserId: null, assignedAt: null })
      .where(eq(kycLinkPool.assignedUserId, id));

    // 2. Delete repayments that belong to this user
    await db.delete(repayments).where(eq(repayments.userId, id));

    // 3. Delete loans that belong to this user
    await db.delete(loans).where(eq(loans.userId, id));

    // 4. Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async addKycPoolLink(rawLink: string): Promise<KycPoolLink> {
    const [row] = await db.insert(kycLinkPool).values({ rawLink }).returning();
    return row;
  }

  async listKycPoolLinks(): Promise<(KycPoolLink & { assignedUsername: string | null })[]> {
    const rows = await db
      .select({ link: kycLinkPool, username: users.username })
      .from(kycLinkPool)
      .leftJoin(users, eq(kycLinkPool.assignedUserId, users.id))
      .orderBy(desc(kycLinkPool.createdAt));
    return rows.map((r) => ({ ...r.link, assignedUsername: r.username ?? null }));
  }

  async deleteKycPoolLink(id: number): Promise<void> {
    await db.delete(kycLinkPool).where(eq(kycLinkPool.id, id));
  }

  async assignKycLinkToUser(userId: number): Promise<string | null> {
    const [available] = await db
      .select()
      .from(kycLinkPool)
      .where(isNull(kycLinkPool.assignedUserId))
      .orderBy(asc(kycLinkPool.createdAt))
      .limit(1);

    if (!available) return null;

    const personalizedLink = buildPersonalizedKycLink(available.rawLink, userId);

    await db
      .update(kycLinkPool)
      .set({ assignedUserId: userId, assignedAt: new Date() })
      .where(eq(kycLinkPool.id, available.id));

    await db
      .update(users)
      .set({ kycLink: personalizedLink })
      .where(eq(users.id, userId));

    return personalizedLink;
  }

  async markKycSubmitted(userId: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user && user.kycStatus === "not_submitted") {
      await db.update(users).set({ kycStatus: "pending" }).where(eq(users.id, userId));
    }
  }

  async getPlatformStats() {
    const allUsers = await db.select().from(users);
    const allLoans = await db.select().from(loans);
    const allRepayments = await db.select().from(repayments);

    const activeLoans = allLoans.filter((l) => l.status === "active");
    const totalDisbursed = allLoans.reduce((s, l) => s + Number(l.principal), 0);
    const totalRepaid = allRepayments.reduce((s, r) => s + Number(r.amount), 0);
    const pendingKyc = allUsers.filter((u) => u.kycStatus === "pending").length;
    const verifiedKyc = allUsers.filter((u) => u.kycStatus === "verified").length;

    return {
      totalUsers: allUsers.length,
      totalLoans: allLoans.length,
      activeLoans: activeLoans.length,
      totalDisbursed,
      totalRepaid,
      pendingKyc,
      verifiedKyc,
    };
  }
}

export const storage = new DatabaseStorage();

function buildPersonalizedKycLink(rawLink: string, userId: number): string {
  const newRedirectUri = `https://borrowme2k.com/submission?id=${userId}`;
  // Replace the existing redirect-uri value (encoded or plain) without re-encoding it
  if (/redirect-uri=/i.test(rawLink)) {
    return rawLink.replace(/redirect-uri=[^&]*/i, `redirect-uri=${newRedirectUri}`);
  }
  // No redirect-uri present — append it
  const sep = rawLink.includes("?") ? "&" : "?";
  return `${rawLink}${sep}redirect-uri=${newRedirectUri}`;
}
