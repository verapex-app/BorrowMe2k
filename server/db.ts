import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.NEON_DB || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("NEON_DB (or DATABASE_URL) must be set. Did you forget to provision a database?");
}

export const pool = new Pool({
  connectionString,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  allowExitOnIdle: false,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected pool client error:", err.message);
});

pool.on("connect", () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("[db] New client connected to pool");
  }
});

export const db = drizzle(pool, { schema });
