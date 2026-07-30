import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { systemSettings } from "@pe-smkk/db";
import { Role, settingUpsertSchema } from "@pe-smkk/shared";
import type { AppEnv } from "../../types";
import { requireRole, requireSession } from "../../middleware/auth";
import { getDb } from "../../lib/session";
import { randomId } from "../../lib/crypto";
import { jsonError, nowIso, parseJsonBody } from "../../lib/http";

export const settingsRoutes = new Hono<AppEnv>();

settingsRoutes.use("*", requireSession, requireRole(Role.ADMIN));

settingsRoutes.get("/admin/settings", async (c) => {
  const db = getDb(c);
  const rows = await db
    .select()
    .from(systemSettings)
    .orderBy(asc(systemSettings.keyName));
  return c.json({ data: { items: rows } });
});

settingsRoutes.get("/admin/settings/:keyName", async (c) => {
  const keyName = c.req.param("keyName");
  const db = getDb(c);
  const rows = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.keyName, keyName))
    .limit(1);
  const row = rows[0];
  if (!row) return jsonError(c, 404, "Setting not found", "NOT_FOUND");
  return c.json({ data: { setting: row } });
});

settingsRoutes.put("/admin/settings", async (c) => {
  const parsed = await parseJsonBody(c, settingUpsertSchema);
  if ("response" in parsed) return parsed.response;
  const db = getDb(c);
  const { keyName, value, description } = parsed.data;
  const existing = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.keyName, keyName))
    .limit(1);

  if (existing[0]) {
    const result = await db
      .update(systemSettings)
      .set({
        value: value ?? null,
        description:
          description !== undefined
            ? description
            : existing[0].description,
        updatedAt: nowIso(),
      })
      .where(eq(systemSettings.keyName, keyName))
      .returning();
    return c.json({ data: { setting: result[0] } });
  }

  const result = await db
    .insert(systemSettings)
    .values({
      id: randomId(),
      keyName,
      value: value ?? null,
      description: description ?? null,
    })
    .returning();
  return c.json({ data: { setting: result[0] } }, 201);
});

settingsRoutes.delete("/admin/settings/:keyName", async (c) => {
  const keyName = c.req.param("keyName");
  const db = getDb(c);
  const result = await db
    .delete(systemSettings)
    .where(eq(systemSettings.keyName, keyName))
    .returning();
  if (!result[0]) return jsonError(c, 404, "Setting not found", "NOT_FOUND");
  return c.json({ data: { ok: true } });
});
