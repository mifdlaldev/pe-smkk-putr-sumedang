import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { dinas } from "@pe-smkk/db";
import { Role, dinasCreateSchema, dinasUpdateSchema } from "@pe-smkk/shared";
import type { AppEnv } from "../../types";
import { requireRole, requireSession } from "../../middleware/auth";
import { getDb } from "../../lib/session";
import { jsonError, nowIso, parseJsonBody } from "../../lib/http";

export const dinasRoutes = new Hono<AppEnv>();

dinasRoutes.use("*", requireSession, requireRole(Role.ADMIN));

dinasRoutes.get("/admin/dinas", async (c) => {
  const db = getDb(c);
  const rows = await db.select().from(dinas).orderBy(asc(dinas.name));
  return c.json({ data: { items: rows } });
});

dinasRoutes.get("/admin/dinas/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return jsonError(c, 400, "Invalid id", "BAD_REQUEST");
  }
  const db = getDb(c);
  const rows = await db.select().from(dinas).where(eq(dinas.id, id)).limit(1);
  const row = rows[0];
  if (!row) return jsonError(c, 404, "Dinas not found", "NOT_FOUND");
  return c.json({ data: { dinas: row } });
});

dinasRoutes.post("/admin/dinas", async (c) => {
  const parsed = await parseJsonBody(c, dinasCreateSchema);
  if ("response" in parsed) return parsed.response;
  const db = getDb(c);
  try {
    const result = await db
      .insert(dinas)
      .values({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
      })
      .returning();
    return c.json({ data: { dinas: result[0] } }, 201);
  } catch {
    return jsonError(c, 409, "Dinas name already exists", "CONFLICT");
  }
});

dinasRoutes.patch("/admin/dinas/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return jsonError(c, 400, "Invalid id", "BAD_REQUEST");
  }
  const parsed = await parseJsonBody(c, dinasUpdateSchema);
  if ("response" in parsed) return parsed.response;
  if (Object.keys(parsed.data).length === 0) {
    return jsonError(c, 400, "No fields to update", "BAD_REQUEST");
  }
  const db = getDb(c);
  try {
    const result = await db
      .update(dinas)
      .set({
        ...parsed.data,
        updatedAt: nowIso(),
      })
      .where(eq(dinas.id, id))
      .returning();
    if (!result[0]) return jsonError(c, 404, "Dinas not found", "NOT_FOUND");
    return c.json({ data: { dinas: result[0] } });
  } catch {
    return jsonError(c, 409, "Dinas name already exists", "CONFLICT");
  }
});

dinasRoutes.delete("/admin/dinas/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id < 1) {
    return jsonError(c, 400, "Invalid id", "BAD_REQUEST");
  }
  const db = getDb(c);
  const result = await db.delete(dinas).where(eq(dinas.id, id)).returning();
  if (!result[0]) return jsonError(c, 404, "Dinas not found", "NOT_FOUND");
  return c.json({ data: { ok: true } });
});
