import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(), // This will store email or phone
  password: text("password").notNull(),
  email: text("email").unique(),
  phone: text("phone").unique(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  recipientId: integer("recipient_id").references(() => users.id), // Null if recipient not registered
  pendingRecipientIdentifier: text("pending_recipient_identifier"), // email or phone for unregistered users
  title: text("title").notNull(),
  amount: numeric("amount").notNull(),
  type: text("type", { enum: ["credit", "debit", "withdrawal", "pending_send"] }).notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  status: text("status", { enum: ["completed", "pending", "refunded", "withdrawn"] }).default("completed").notNull(),
  expiresAt: timestamp("expires_at"),
  bankingInfo: text("banking_info"), // For withdrawals: sort code, account, name
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(),
  balance: numeric("balance").notNull(),
  currency: text("currency").default("GBP").notNull(),
  accountNumber: text("account_number").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, date: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
