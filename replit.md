# BorrowMe

A Cameroonian-based lending app. Users sign up, browse loan products
(Quick Cash, Salary Advance, Business Boost, School Fees, Agriculture,
Moto/Vehicle), apply for a loan with their chosen amount and term, and
repay over time via Mobile Money, bank transfer or cash.

## Stack

- React 18 + Vite + Wouter (frontend)
- Express + Passport local auth (backend)
- Drizzle ORM + PostgreSQL
- TanStack Query
- TailwindCSS + shadcn/ui

## Currency

All amounts are in Central African CFA Franc (FCFA / XAF), formatted
via `client/src/lib/format.ts → formatXAF()`.

## Data model (`shared/schema.ts`)

- `users` — username, password (bcrypt), fullName, email, phone, city
- `loan_products` — name, description, category, icon, minAmount,
  maxAmount, interestRate (% per month), minTermMonths, maxTermMonths,
  processingFeePct
- `loans` — userId, productId, principal, interestRate, termMonths,
  monthlyPayment, totalRepayment, amountPaid, purpose, status
  (`pending` | `active` | `repaid` | `rejected`), appliedAt, approvedAt,
  dueDate
- `repayments` — loanId, userId, amount, paidAt, method
  (`mobile_money` | `bank_transfer` | `cash`)

Loan applications are auto-approved on submit (status set to `active`)
so users can immediately see the loan, schedule, and start repaying.

## API

- `GET  /api/loan-products` — list available products
- `GET  /api/loans` — current user's loans
- `POST /api/loans` — apply (body: `{ productId, principal, termMonths, purpose }`)
- `POST /api/loans/:id/repay` — record a repayment
- `GET  /api/repayments` — current user's repayments
- `GET  /api/dashboard/stats` — outstanding, totals, next payment

## Pages

- `/` Dashboard — outstanding balance, next payment, active loan, featured products
- `/loans` Browse loan products + apply dialog (slider for amount/term, live monthly + total breakdown)
- `/my-loans` Active and past loans, repayment dialog
- `/history` Combined feed of disbursements and repayments
- `/profile` User info and sign-out

## Demo account

- Username: `demo`
- Password: `demo1234`

Seeded automatically on first server start in `server/routes.ts → seedDatabase()`.
