import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  amount: numeric("amount").notNull(), // using numeric for currency
  type: text("type", { enum: ["credit", "debit"] }).notNull(),
  category: text("category").notNull(), // e.g., "shopping", "food", "transport"
  icon: text("icon").notNull(), // icon name for frontend to render
  date: timestamp("date").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "Checking", "Savings"
  balance: numeric("balance").notNull(),
  currency: text("currency").default("USD").notNull(),
  accountNumber: text("account_number").notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, date: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true });

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
