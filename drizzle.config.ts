import { defineConfig } from "drizzle-kit";

if (!process.env.NEON_DB) {
  throw new Error("NEON_DB must be set. Did you forget to provision a database?");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NEON_DB,
  },
});
