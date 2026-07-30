import type { MiddlewareHandler } from "hono";
import type { Role } from "@pe-smkk/shared";
import type { AppEnv } from "../types";
import { resolveSessionUser } from "../lib/session";

/** Require authenticated ACTIVE user; attach to context. */
export const requireSession: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = await resolveSessionUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }
  c.set("user", user);
  await next();
};

/** Require one of the given roles (after requireSession). */
export function requireRole(
  ...roles: Role[]
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
    }
    if (!roles.includes(user.role as Role)) {
      return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
    }
    await next();
  };
}

/** Optional session — sets user if present, never 401. */
export const optionalSession: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = await resolveSessionUser(c);
  if (user) c.set("user", user);
  await next();
};
