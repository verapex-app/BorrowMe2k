# Sterling Mobile Banking Application

## Overview

Sterling Mobile is a UK-focused digital banking application built as a full-stack TypeScript project. It provides a mobile-first banking experience with features including account management, transaction tracking, payment processing, and spending analytics. The application follows a monorepo structure with separate client and server directories sharing common schemas and route definitions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS with CSS variables for theming, supporting light/dark modes
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Charts**: Recharts for spending visualizations
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: express-session with connect-pg-simple for PostgreSQL session storage
- **Authentication**: Passport.js with Local Strategy, bcryptjs for password hashing
- **API Design**: Type-safe route definitions in shared/routes.ts with Zod schemas for validation

### Shared Code Pattern
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts`: Drizzle table definitions and Zod validation schemas for users, transactions, and accounts
- `routes.ts`: API route definitions with paths, methods, and response schemas enabling type-safe API calls

### Database Schema
Three main tables:
1. **users**: Authentication and profile data (username, password, fullName, email, phoneNumber, address)
2. **transactions**: Financial transaction records (title, amount, type, category, icon, date)
3. **accounts**: Bank account details (type, balance, currency, accountNumber, sortCode for UK banking)

### Build System
- Development: tsx for running TypeScript directly
- Production: esbuild bundles the server, Vite builds the client
- Database migrations: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via DATABASE_URL environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: PostgreSQL session store for persistent sessions

### Authentication
- **Passport.js**: Authentication middleware with Local Strategy
- **bcryptjs**: Password hashing
- **express-session**: Session management with secure cookies

### UI Framework
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, toast, etc.)
- **shadcn/ui**: Pre-built component library using Radix and Tailwind
- **Lucide React**: Icon library
- **react-icons**: Additional icons (Visa, Mastercard logos)

### Development Tools
- **Vite**: Frontend build tool with HMR
- **Replit plugins**: Runtime error overlay, cartographer, dev banner for Replit environment
- **TypeScript**: Full type safety across the stack

### Fonts
- **Google Fonts**: Inter (sans-serif body text), Space Grotesk (display headings)