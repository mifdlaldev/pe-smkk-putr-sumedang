import { and, eq, gt, lt } from "drizzle-orm";
import { createDb, sessions, users } from "@pe-smkk/db";
import type { PublicUser } from "@pe-smkk/shared";
import { UserStatus } from "@pe-smkk/shared";
import type { Context } from "hono";
import type { AppEnv } from "../types";
import {
  SESSION_COOKIE,
  SESSION_SLIDE_IF_REMAINING_MS,
  SESSION_TTL_MS,
  SESSION_TTL_REMEMBER_MS,
  clearSessionCookieHeader,
  isSecureRequest,
  parseCookie,
  sessionCookieHeader,
} from "./cookies";
import { randomId, randomToken, sha256Hex } from "./crypto";

export type SessionUser = PublicUser & {
  sessionId: string;
};

export function toPublicUser(row: {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  role: "ADMIN" | "SURVEYOR";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  dinasId: number | null;
  profileImage: string | null;
}): PublicUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    status: row.status,
    dinasId: row.dinasId,
    profileImage: row.profileImage,
  };
}

export function getDb(c: Context<AppEnv>) {
  return createDb(c.env.DB);
}

export async function createSession(
  c: Context<AppEnv>,
  userId: string,
  rememberMe: boolean,
): Promise<string> {
  const db = getDb(c);
  const rawToken = randomToken(32);
  const tokenHash = await sha256Hex(rawToken);
  const ttl = rememberMe ? SESSION_TTL_REMEMBER_MS : SESSION_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl).toISOString();
  const ua = c.req.header("user-agent")?.slice(0, 256) ?? null;
  const ip =
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";
  const ipHash = ip ? await sha256Hex(ip) : null;

  await db.insert(sessions).values({
    id: randomId(),
    userId,
    tokenHash,
    expiresAt,
    rememberMe,
    userAgent: ua,
    ipHash,
  });

  const secure = isSecureRequest(c.req.url);
  const maxAge = Math.floor(ttl / 1000);
  c.header("Set-Cookie", sessionCookieHeader(rawToken, maxAge, secure), {
    append: true,
  });
  return rawToken;
}

export async function revokeSessionByRawToken(
  c: Context<AppEnv>,
  rawToken: string | undefined,
): Promise<void> {
  if (!rawToken) return;
  const db = getDb(c);
  const tokenHash = await sha256Hex(rawToken);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export async function revokeAllUserSessions(
  c: Context<AppEnv>,
  userId: string,
): Promise<void> {
  const db = getDb(c);
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export function setClearSessionCookie(c: Context<AppEnv>): void {
  const secure = isSecureRequest(c.req.url);
  c.header("Set-Cookie", clearSessionCookieHeader(secure), { append: true });
}

/**
 * Resolve session from cookie. Revokes invalid/expired/non-ACTIVE sessions.
 */
export async function resolveSessionUser(
  c: Context<AppEnv>,
): Promise<SessionUser | null> {
  const raw = parseCookie(c.req.header("Cookie"), SESSION_COOKIE);
  if (!raw) return null;

  const db = getDb(c);
  const tokenHash = await sha256Hex(raw);
  const nowIso = new Date().toISOString();

  const sessionRows = await db
    .select()
    .from(sessions)
    .where(
      and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, nowIso)),
    )
    .limit(1);
  const session = sessionRows[0];

  if (!session) {
    setClearSessionCookie(c);
    return null;
  }

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  const user = userRows[0];

  if (!user || user.status !== UserStatus.ACTIVE) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    setClearSessionCookie(c);
    return null;
  }

  const expiresMs = Date.parse(session.expiresAt);
  const remaining = expiresMs - Date.now();
  if (!session.rememberMe && remaining < SESSION_SLIDE_IF_REMAINING_MS) {
    const newExp = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await db
      .update(sessions)
      .set({
        expiresAt: newExp,
        lastSeenAt: nowIso,
      })
      .where(eq(sessions.id, session.id));
    const secure = isSecureRequest(c.req.url);
    c.header(
      "Set-Cookie",
      sessionCookieHeader(raw, Math.floor(SESSION_TTL_MS / 1000), secure),
      { append: true },
    );
  } else {
    await db
      .update(sessions)
      .set({ lastSeenAt: nowIso })
      .where(eq(sessions.id, session.id));
  }

  return {
    ...toPublicUser(user),
    sessionId: session.id,
  };
}

export async function purgeExpiredSessions(c: Context<AppEnv>): Promise<void> {
  const db = getDb(c);
  await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, new Date().toISOString()));
}
