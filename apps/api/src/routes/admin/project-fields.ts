import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { projectFields } from "@pe-smkk/db";
import {
  Role,
  projectFieldCreateSchema,
  projectFieldUpdateSchema,
} from "@pe-smkk/shared";
import type { AppEnv } from "../../types";
import { requireRole, requireSession } from "../../middleware/auth";
import { getDb } from "../../lib/session";
import { randomId } from "../../lib/crypto";
import { jsonError, nowIso, parseJsonBody } from "../../lib/http";

export const projectFieldsRoutes = new Hono<AppEnv>();

projectFieldsRoutes.use("*", requireSession, requireRole(Role.ADMIN));

function serialize(row: typeof projectFields.$inferSelect) {
  let options: string[] | null = null;
  if (row.optionsJson) {
    try {
      options = JSON.parse(row.optionsJson) as string[];
    } catch {
      options = null;
    }
  }
  return {
    id: row.id,
    label: row.label,
    reportType: row.reportType,
    fieldType: row.fieldType,
    required: row.required,
    options,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

projectFieldsRoutes.get("/admin/project-fields", async (c) => {
  const reportType = c.req.query("reportType");
  const db = getDb(c);
  const rows =
    reportType === "LAPORAN1" ||
    reportType === "LAPORAN2" ||
    reportType === "BOTH"
      ? await db
          .select()
          .from(projectFields)
          .where(eq(projectFields.reportType, reportType))
          .orderBy(asc(projectFields.sortOrder), asc(projectFields.label))
      : await db
          .select()
          .from(projectFields)
          .orderBy(asc(projectFields.sortOrder), asc(projectFields.label));
  return c.json({ data: { items: rows.map(serialize) } });
});

projectFieldsRoutes.post("/admin/project-fields", async (c) => {
  const parsed = await parseJsonBody(c, projectFieldCreateSchema);
  if ("response" in parsed) return parsed.response;
  const d = parsed.data;
  const db = getDb(c);
  const result = await db
    .insert(projectFields)
    .values({
      id: randomId(),
      label: d.label,
      reportType: d.reportType,
      fieldType: d.fieldType ?? "TEXT",
      required: d.required ?? false,
      optionsJson: d.options ? JSON.stringify(d.options) : null,
      sortOrder: d.sortOrder ?? 0,
    })
    .returning();
  return c.json({ data: { field: serialize(result[0]!) } }, 201);
});

projectFieldsRoutes.patch("/admin/project-fields/:id", async (c) => {
  const id = c.req.param("id");
  const parsed = await parseJsonBody(c, projectFieldUpdateSchema);
  if ("response" in parsed) return parsed.response;
  const d = parsed.data;
  if (Object.keys(d).length === 0) {
    return jsonError(c, 400, "No fields to update", "BAD_REQUEST");
  }
  const db = getDb(c);
  const patch: Partial<typeof projectFields.$inferInsert> = {
    updatedAt: nowIso(),
  };
  if (d.label !== undefined) patch.label = d.label;
  if (d.reportType !== undefined) patch.reportType = d.reportType;
  if (d.fieldType !== undefined) patch.fieldType = d.fieldType;
  if (d.required !== undefined) patch.required = d.required;
  if (d.sortOrder !== undefined) patch.sortOrder = d.sortOrder;
  if (d.options !== undefined) {
    patch.optionsJson = d.options ? JSON.stringify(d.options) : null;
  }

  const result = await db
    .update(projectFields)
    .set(patch)
    .where(eq(projectFields.id, id))
    .returning();
  if (!result[0]) return jsonError(c, 404, "Field not found", "NOT_FOUND");
  return c.json({ data: { field: serialize(result[0]) } });
});

projectFieldsRoutes.delete("/admin/project-fields/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb(c);
  const result = await db
    .delete(projectFields)
    .where(eq(projectFields.id, id))
    .returning();
  if (!result[0]) return jsonError(c, 404, "Field not found", "NOT_FOUND");
  return c.json({ data: { ok: true } });
});
