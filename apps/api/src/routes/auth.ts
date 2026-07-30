import { Hono } from "hono";
import { eq, or } from "drizzle-orm";
import { users } from "@pe-smkk/db";
import {
  loginBodySchema,
  requestResetBodySchema,
  resetPasswordBodySchema,
  UserStatus,
} from "@pe-smkk/shared";
import type { AppEnv } from "../types";
import {
  hashPassword,
  randomToken,
  sha256Hex,
  verifyPassword,
} from "../lib/crypto";
import {
  RATE_LIMIT,
  SESSION_COOKIE,
  parseCookie,
} from "../lib/cookies";
import { clientIpHash, consumeRateLimit } from "../lib/rate-limit";
import {
  createSession,
  getDb,
  purgeExpiredSessions,
  revokeAllUserSessions,
  revokeSessionByRawToken,
  setClearSessionCookie,
  toPublicUser,
} from "../lib/session";
import { requireSession } from "../middleware/auth";

export const authRoutes = new Hono<AppEnv>();

const genericLoginFail = {
  error: "Invalid username or password",
  code: "INVALID_CREDENTIALS",
} as const;

authRoutes.post("/auth/login", async (c) => {
  const ipHash = await clientIpHash(c);
  const rl = await consumeRateLimit(
    getDb(c),
    "login",
    ipHash,
    RATE_LIMIT.login.max,
    RATE_LIMIT.login.windowMs,
  );
  if (!rl.allowed) {
    c.header("Retry-After", String(rl.retryAfterSec));
    return c.json(
      { error: "Too many attempts. Try again later.", code: "RATE_LIMITED" },
      429,
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body", code: "BAD_REQUEST" }, 400);
  }

  const parsed = loginBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: "Validation failed",
        code: "VALIDATION",
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  const { username, password, rememberMe } = parsed.data;
  const db = getDb(c);

  const found = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const user = found[0];

  const dummyHash =
    "pbkdf2$310000$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000";
  const ok = await verifyPassword(password, user?.passwordHash ?? dummyHash);

  if (!user || !ok) {
    return c.json(genericLoginFail, 401);
  }

  if (user.status === UserStatus.INACTIVE) {
    return c.json(
      { error: "Account is inactive", code: "INACTIVE_ACCOUNT" },
      403,
    );
  }
  if (user.status === UserStatus.SUSPENDED) {
    return c.json(
      { error: "Account is suspended", code: "SUSPENDED_ACCOUNT" },
      403,
    );
  }

  await purgeExpiredSessions(c);
  await createSession(c, user.id, rememberMe ?? false);

  return c.json({
    data: {
      user: toPublicUser(user),
    },
  });
});

authRoutes.post("/auth/logout", requireSession, async (c) => {
  const raw = parseCookie(c.req.header("Cookie"), SESSION_COOKIE);
  await revokeSessionByRawToken(c, raw);
  setClearSessionCookie(c);
  return c.json({ data: { ok: true } });
});

authRoutes.get("/auth/me", requireSession, async (c) => {
  const user = c.get("user");
  return c.json({ data: { user } });
});

/**
 * Request password reset. Always generic success (no user enumeration).
 * Token only returned when EMAIL_DELIVERY=log (local/dev).
 */
authRoutes.post("/auth/request-reset", async (c) => {
  const ipHash = await clientIpHash(c);
  const rl = await consumeRateLimit(
    getDb(c),
    "request-reset",
    ipHash,
    RATE_LIMIT.requestReset.max,
    RATE_LIMIT.requestReset.windowMs,
  );
  if (!rl.allowed) {
    c.header("Retry-After", String(rl.retryAfterSec));
    return c.json(
      { error: "Too many attempts. Try again later.", code: "RATE_LIMITED" },
      429,
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body", code: "BAD_REQUEST" }, 400);
  }

  const parsed = requestResetBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation failed", code: "VALIDATION" }, 400);
  }

  const id = parsed.data.identifier.trim();
  const db = getDb(c);
  const found = await db
    .select()
    .from(users)
    .where(or(eq(users.username, id), eq(users.email, id.toLowerCase())))
    .limit(1);
  const user = found[0];

  const generic = {
    data: {
      message:
        "If an account exists for that identifier, a reset link has been issued.",
    },
  };

  if (user && user.status === UserStatus.ACTIVE) {
    const rawToken = randomToken(32);
    const tokenHash = await sha256Hex(rawToken);
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await db
      .update(users)
      .set({
        resetTokenHash: tokenHash,
        resetTokenExpiry: expiry,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    if ((c.env.EMAIL_DELIVERY ?? "log") === "log") {
      console.log(
        JSON.stringify({
          type: "password_reset_token",
          userId: user.id,
          token: rawToken,
          expiresAt: expiry,
        }),
      );
      return c.json({
        data: {
          ...generic.data,
          devToken: rawToken,
        },
      });
    }
  }

  return c.json(generic);
});

authRoutes.post("/auth/reset-password", async (c) => {
  const ipHash = await clientIpHash(c);
  const rl = await consumeRateLimit(
    getDb(c),
    "reset-password",
    ipHash,
    RATE_LIMIT.resetPassword.max,
    RATE_LIMIT.resetPassword.windowMs,
  );
  if (!rl.allowed) {
    c.header("Retry-After", String(rl.retryAfterSec));
    return c.json(
      { error: "Too many attempts. Try again later.", code: "RATE_LIMITED" },
      429,
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body", code: "BAD_REQUEST" }, 400);
  }

  const parsed = resetPasswordBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: "Validation failed",
        code: "VALIDATION",
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  const tokenHash = await sha256Hex(parsed.data.token);
  const db = getDb(c);
  const now = new Date().toISOString();

  const found = await db
    .select()
    .from(users)
    .where(eq(users.resetTokenHash, tokenHash))
    .limit(1);
  const user = found[0];

  if (
    !user ||
    !user.resetTokenExpiry ||
    user.resetTokenExpiry < now ||
    user.status !== UserStatus.ACTIVE
  ) {
    return c.json(
      { error: "Invalid or expired reset token", code: "INVALID_TOKEN" },
      400,
    );
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db
    .update(users)
    .set({
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiry: null,
      updatedAt: now,
    })
    .where(eq(users.id, user.id));

  await revokeAllUserSessions(c, user.id);
  setClearSessionCookie(c);

  return c.json({
    data: { message: "Password updated. Please sign in again." },
  });
});
