/**
 * Local-only admin seed helper.
 *
 *   SEED_ADMIN_PASSWORD='YourPass123' npm run seed:admin -w @pe-smkk/api
 *
 * Prints + applies SQL via wrangler d1 --local. Never deploy as a Worker route.
 */
import { execFileSync } from "node:child_process";
import { hashPassword, randomId } from "../src/lib/crypto";

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@localhost.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "AdminPass123";
  const fullName = process.env.SEED_ADMIN_FULLNAME ?? "System Admin";

  if (password.length < 10) {
    console.error("SEED_ADMIN_PASSWORD must be at least 10 chars");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const id = randomId();
  const now = new Date().toISOString();

  const sql = `INSERT INTO users (id, username, full_name, email, password_hash, role, status, created_at, updated_at) VALUES ('${id}', '${esc(username)}', '${esc(fullName)}', '${esc(email)}', '${passwordHash}', 'ADMIN', 'ACTIVE', '${now}', '${now}') ON CONFLICT(username) DO NOTHING;`;

  console.log("Seed admin");
  console.log("  username:", username);
  console.log("  email:", email);
  console.log("  password: (env SEED_ADMIN_PASSWORD or default AdminPass123)");
  console.log("SQL:", sql);

  execFileSync(
    "npx",
    ["wrangler", "d1", "execute", "pe-smkk-db", "--local", "--command", sql],
    { stdio: "inherit", cwd: process.cwd() },
  );
  console.log("Done. Login at /auth/login");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
