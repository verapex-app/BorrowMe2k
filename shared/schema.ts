import { pgTable, text, serial, integer, timestamp, numeric, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  email: text("email").unique(),
  phone: text("phone").unique(),
  city: text("city").default("Douala"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  dateOfBirth: text("date_of_birth"),
  idCardNumber: text("id_card_number"),
  kycWaitingUntil: timestamp("kyc_waiting_until"),
  kycStatus: text("kyc_status", {
    enum: ["not_submitted", "pending", "verified", "rejected"],
  }).notNull().default("not_submitted"),
  kycLink: text("kyc_link"),
  kycNotes: text("kyc_notes"),
});

export const loanProducts = pgTable("loan_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
  minAmount: numeric("min_amount").notNull(),
  maxAmount: numeric("max_amount").notNull(),
  interestRate: numeric("interest_rate").notNull(),
  minTermMonths: integer("min_term_months").notNull(),
  maxTermMonths: integer("max_term_months").notNull(),
  processingFeePct: numeric("processing_fee_pct").notNull().default("1.5"),
});

export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => loanProducts.id).notNull(),
  productName: text("product_name").notNull(),
  principal: numeric("principal").notNull(),
  interestRate: numeric("interest_rate").notNull(),
  termMonths: integer("term_months").notNull(),
  monthlyPayment: numeric("monthly_payment").notNull(),
  totalRepayment: numeric("total_repayment").notNull(),
  amountPaid: numeric("amount_paid").notNull().default("0"),
  purpose: text("purpose").notNull(),
  status: text("status", {
    enum: ["pending", "active", "repaid", "rejected"],
  }).notNull().default("active"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  dueDate: timestamp("due_date").notNull(),
});

export const kycLinkPool = pgTable("kyc_link_pool", {
  id: serial("id").primaryKey(),
  rawLink: text("raw_link").notNull(),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  assignedAt: timestamp("assigned_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const repayments = pgTable("repayments", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").references(() => loans.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: numeric("amount").notNull(),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
  method: text("method").notNull().default("mobile_money"),
});

// ── Reusable field validators ──────────────────────────────────────────────

/** Lowercase-only, alphanumeric + underscore, 3–30 chars */
export const usernameField = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be 30 characters or fewer")
  .regex(
    /^[a-z0-9_]+$/,
    "Username can only contain lowercase letters, numbers and underscores — no spaces",
  )
  .transform((v) => v.toLowerCase().trim());

export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const emailField = z
  .string()
  .email("Enter a valid email address")
  .max(254, "Email address is too long")
  .transform((v) => v.trim().toLowerCase());

export const phoneField = z
  .string()
  .min(8, "Enter a valid phone number")
  .max(20, "Phone number is too long")
  .transform((v) => v.replace(/\s+/g, ""));

export const nameField = z
  .string()
  .min(2, "Enter your full name")
  .max(100, "Name is too long")
  .transform((v) => v.trim());

export const cityField = z
  .string()
  .min(2, "City is required")
  .max(100, "City name is too long")
  .transform((v) => v.trim());

export const purposeField = z
  .string()
  .min(3, "Tell us briefly what the loan is for")
  .max(500, "Purpose is too long — keep it under 500 characters")
  .transform((v) => v.trim());

// ── Schemas ────────────────────────────────────────────────────────────────

export const insertUserSchema = createInsertSchema(users).omit({ id: true });

export const insertLoanProductSchema = createInsertSchema(loanProducts).omit({
  id: true,
});

export const applyLoanSchema = z.object({
  productId: z.number().int().positive("Choose a loan product"),
  principal: z.coerce.number().positive("Amount must be greater than zero").max(100_000_000, "Amount is too large"),
  termMonths: z.coerce.number().int().positive("Term must be at least 1 month").max(360, "Term is too long"),
  purpose: purposeField,
});

export const repaymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .max(100_000_000, "Amount is too large"),
  method: z
    .enum(["mobile_money", "bank_transfer", "cash"])
    .default("mobile_money"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoanProduct = typeof loanProducts.$inferSelect;
export type InsertLoanProduct = z.infer<typeof insertLoanProductSchema>;
export type Loan = typeof loans.$inferSelect;
export type Repayment = typeof repayments.$inferSelect;
export type KycPoolLink = typeof kycLinkPool.$inferSelect;
export type ApplyLoanInput = z.infer<typeof applyLoanSchema>;
export type RepaymentInput = z.infer<typeof repaymentSchema>;
