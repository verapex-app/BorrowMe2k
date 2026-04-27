import { z } from "zod";
import {
  applyLoanSchema,
  repaymentSchema,
  loanProducts,
  loans,
  repayments,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  dashboard: {
    getStats: {
      method: "GET" as const,
      path: "/api/dashboard/stats",
      responses: {
        200: z.object({
          activeLoans: z.number(),
          outstandingBalance: z.string(),
          totalBorrowed: z.string(),
          totalRepaid: z.string(),
          nextPaymentAmount: z.string().nullable(),
          nextPaymentDate: z.string().nullable(),
        }),
      },
    },
  },
  loanProducts: {
    list: {
      method: "GET" as const,
      path: "/api/loan-products",
      responses: {
        200: z.array(z.custom<typeof loanProducts.$inferSelect>()),
      },
    },
  },
  loans: {
    list: {
      method: "GET" as const,
      path: "/api/loans",
      responses: { 200: z.array(z.custom<typeof loans.$inferSelect>()) },
    },
    apply: {
      method: "POST" as const,
      path: "/api/loans",
      input: applyLoanSchema,
      responses: {
        201: z.custom<typeof loans.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    repay: {
      method: "POST" as const,
      path: "/api/loans/:id/repay",
      input: repaymentSchema,
      responses: {
        201: z.custom<typeof repayments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  repayments: {
    list: {
      method: "GET" as const,
      path: "/api/repayments",
      responses: { 200: z.array(z.custom<typeof repayments.$inferSelect>()) },
    },
  },
};
