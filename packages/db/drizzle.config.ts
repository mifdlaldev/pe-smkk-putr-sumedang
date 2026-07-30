import { defineConfig } from "drizzle-kit";

/** Generates SQL migrations under ./migrations — applied via wrangler d1. */
export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "sqlite",
  strict: true,
  verbose: true,
});
