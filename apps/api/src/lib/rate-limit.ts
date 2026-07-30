import { eq } from "drizzle-orm";
import { authRateLimits, createDb } from "@pe-smkk/db";
import { sha256Hex } from "./crypto";

type Db = ReturnType<typeof createDb>;

export async function clientIpHash(c: {
  req: { header: (name: string) => string | undefined };
}): Promise<string> {
  const raw =
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return sha256Hex(raw);
}

/**
 * Fixed-window rate limit stored in D1.
 * Returns true if allowed; false if over limit.
 */
export async function consumeRateLimit(
  db: Db,
  action: string,
  ipHash: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const key = `${action}:${ipHash}`;
  const now = Date.now();
  const rows = await db
    .select()
    .from(authRateLimits)
    .where(eq(authRateLimits.key, key))
    .limit(1);
  const row = rows[0];

  if (!row) {
    await db.insert(authRateLimits).values({
      key,
      count: 1,
      windowStart: new Date(now).toISOString(),
    });
    return { allowed: true, retryAfterSec: 0 };
  }

  const windowStart = Date.parse(row.windowStart);
  if (!Number.isFinite(windowStart) || now - windowStart >= windowMs) {
    await db
      .update(authRateLimits)
      .set({ count: 1, windowStart: new Date(now).toISOString() })
      .where(eq(authRateLimits.key, key));
    return { allowed: true, retryAfterSec: 0 };
  }

  if (row.count >= max) {
    const retryAfterSec = Math.ceil((windowStart + windowMs - now) / 1000);
    return { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }

  await db
    .update(authRateLimits)
    .set({ count: row.count + 1 })
    .where(eq(authRateLimits.key, key));
  return { allowed: true, retryAfterSec: 0 };
}
