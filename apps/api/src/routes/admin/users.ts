import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { dinas, users } from "@pe-smkk/db";
import { Role, userCreateSchema, userUpdateSchema } from "@pe-smkk/shared";
import type { AppEnv } from "../../types";
import { requireRole, requireSession } from "../../middleware/auth";
import { getDb, revokeAllUserSessions, toPublicUser } from "../../lib/session";
import { hashPassword, randomId } from "../../lib/crypto";
import { jsonError, nowIso, parseJsonBody } from "../../lib/http";

export const usersRoutes = new Hono<AppEnv>();

usersRoutes.use("*", requireSession, requireRole(Role.ADMIN));

function publicFromRow(row: typeof users.$inferSelect) {
  return toPublicUser(row);
}

usersRoutes.get("/admin/users", async (c) => {
  const db = getDb(c);
  const rows = await db.select().from(users).orderBy(asc(users.username));
  return c.json({
    data: { items: rows.map(publicFromRow) },
  });
});

usersRoutes.get("/admin/users/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb(c);
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const row = rows[0];
  if (!row) return jsonError(c, 404, "User not found", "NOT_FOUND");
  return c.json({ data: { user: publicFromRow(row) } });
});

usersRoutes.post("/admin/users", async (c) => {
  const parsed = await parseJsonBody(c, userCreateSchema);
  if ("response" in parsed) return parsed.response;
  const db = getDb(c);
  const d = parsed.data;

  if (d.dinasId != null) {
    const dRows = await db
      .select()
      .from(dinas)
      .where(eq(dinas.id, d.dinasId))
      .limit(1);
    if (!dRows[0]) return jsonError(c, 400, "Invalid dinasId", "BAD_REQUEST");
  }

  const passwordHash = await hashPassword(d.password);
  try {
    const result = await db
      .insert(users)
      .values({
        id: randomId(),
        username: d.username,
        email: d.email,
        fullName: d.fullName ?? null,
        passwordHash,
        role: d.role,
        status: d.status ?? "ACTIVE",
        dinasId: d.dinasId ?? null,
      })
      .returning();
    return c.json({ data: { user: publicFromRow(result[0]!) } }, 201);
  } catch {
    return jsonError(c, 409, "Username or email already exists", "CONFLICT");
  }
});

usersRoutes.patch("/admin/users/:id", async (c) => {
  const id = c.req.param("id");
  const parsed = await parseJsonBody(c, userUpdateSchema);
  if ("response" in parsed) return parsed.response;
  const d = parsed.data;
  if (Object.keys(d).length === 0) {
    return jsonError(c, 400, "No fields to update", "BAD_REQUEST");
  }

  const actor = c.get("user")!;
  // Prevent self lockout: admin cannot demote/deactivate self
  if (actor.id === id) {
    if (d.role && d.role !== "ADMIN") {
      return jsonError(c, 400, "Cannot change own role", "BAD_REQUEST");
    }
    if (d.status && d.status !== "ACTIVE") {
      return jsonError(c, 400, "Cannot deactivate own account", "BAD_REQUEST");
    }
  }

  const db = getDb(c);
  if (d.dinasId != null) {
    const dRows = await db
      .select()
      .from(dinas)
      .where(eq(dinas.id, d.dinasId))
      .limit(1);
    if (!dRows[0]) return jsonError(c, 400, "Invalid dinasId", "BAD_REQUEST");
  }

  const patch: Partial<typeof users.$inferInsert> = {
    updatedAt: nowIso(),
  };
  if (d.email !== undefined) patch.email = d.email;
  if (d.fullName !== undefined) patch.fullName = d.fullName;
  if (d.role !== undefined) patch.role = d.role;
  if (d.status !== undefined) patch.status = d.status;
  if (d.dinasId !== undefined) patch.dinasId = d.dinasId;
  if (d.password) {
    patch.passwordHash = await hashPassword(d.password);
  }

  try {
    const result = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, id))
      .returning();
    if (!result[0]) return jsonError(c, 404, "User not found", "NOT_FOUND");

    // Password or status change → kill sessions
    if (d.password || (d.status && d.status !== "ACTIVE")) {
      await revokeAllUserSessions(c, id);
    }

    return c.json({ data: { user: publicFromRow(result[0]) } });
  } catch {
    return jsonError(c, 409, "Username or email already exists", "CONFLICT");
  }
});

usersRoutes.delete("/admin/users/:id", async (c) => {
  const id = c.req.param("id");
  const actor = c.get("user")!;
  if (actor.id === id) {
    return jsonError(c, 400, "Cannot delete own account", "BAD_REQUEST");
  }
  const db = getDb(c);
  await revokeAllUserSessions(c, id);
  const result = await db.delete(users).where(eq(users.id, id)).returning();
  if (!result[0]) return jsonError(c, 404, "User not found", "NOT_FOUND");
  return c.json({ data: { ok: true } });
});
