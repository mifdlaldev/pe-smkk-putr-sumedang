import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import { formSections, formTemplates } from "@pe-smkk/db";
import {
  Role,
  formSectionCreateSchema,
  formSectionUpdateSchema,
  formTemplateCreateSchema,
  formTemplateUpdateSchema,
} from "@pe-smkk/shared";
import type { AppEnv } from "../../types";
import { requireRole, requireSession } from "../../middleware/auth";
import { getDb } from "../../lib/session";
import { randomId } from "../../lib/crypto";
import { jsonError, nowIso, parseJsonBody } from "../../lib/http";

/**
 * Shared form template engine (L1/L2 via reportType).
 * Questions/subquestions land later; this is the skeleton to stop L1/L2 forks.
 */
export const formTemplatesRoutes = new Hono<AppEnv>();

formTemplatesRoutes.use("*", requireSession, requireRole(Role.ADMIN));

formTemplatesRoutes.get("/admin/form-templates", async (c) => {
  const reportType = c.req.query("reportType");
  const db = getDb(c);
  const rows =
    reportType === "LAPORAN1" || reportType === "LAPORAN2"
      ? await db
          .select()
          .from(formTemplates)
          .where(eq(formTemplates.reportType, reportType))
          .orderBy(asc(formTemplates.name))
      : await db.select().from(formTemplates).orderBy(asc(formTemplates.name));
  return c.json({ data: { items: rows } });
});

formTemplatesRoutes.post("/admin/form-templates", async (c) => {
  const parsed = await parseJsonBody(c, formTemplateCreateSchema);
  if ("response" in parsed) return parsed.response;
  const actor = c.get("user")!;
  const db = getDb(c);
  const result = await db
    .insert(formTemplates)
    .values({
      id: randomId(),
      name: parsed.data.name,
      title: parsed.data.title ?? null,
      reportType: parsed.data.reportType,
      createdById: actor.id,
    })
    .returning();
  return c.json({ data: { template: result[0] } }, 201);
});

formTemplatesRoutes.get("/admin/form-templates/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb(c);
  const tRows = await db
    .select()
    .from(formTemplates)
    .where(eq(formTemplates.id, id))
    .limit(1);
  const template = tRows[0];
  if (!template) return jsonError(c, 404, "Template not found", "NOT_FOUND");
  const sections = await db
    .select()
    .from(formSections)
    .where(eq(formSections.formTemplateId, id))
    .orderBy(asc(formSections.sortOrder));
  return c.json({ data: { template, sections } });
});

formTemplatesRoutes.patch("/admin/form-templates/:id", async (c) => {
  const id = c.req.param("id");
  const parsed = await parseJsonBody(c, formTemplateUpdateSchema);
  if ("response" in parsed) return parsed.response;
  if (Object.keys(parsed.data).length === 0) {
    return jsonError(c, 400, "No fields to update", "BAD_REQUEST");
  }
  const db = getDb(c);
  const result = await db
    .update(formTemplates)
    .set({ ...parsed.data, updatedAt: nowIso() })
    .where(eq(formTemplates.id, id))
    .returning();
  if (!result[0]) return jsonError(c, 404, "Template not found", "NOT_FOUND");
  return c.json({ data: { template: result[0] } });
});

formTemplatesRoutes.delete("/admin/form-templates/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb(c);
  const result = await db
    .delete(formTemplates)
    .where(eq(formTemplates.id, id))
    .returning();
  if (!result[0]) return jsonError(c, 404, "Template not found", "NOT_FOUND");
  return c.json({ data: { ok: true } });
});

formTemplatesRoutes.post("/admin/form-templates/:id/sections", async (c) => {
  const templateId = c.req.param("id");
  const parsed = await parseJsonBody(c, formSectionCreateSchema);
  if ("response" in parsed) return parsed.response;
  const db = getDb(c);
  const t = await db
    .select()
    .from(formTemplates)
    .where(eq(formTemplates.id, templateId))
    .limit(1);
  if (!t[0]) return jsonError(c, 404, "Template not found", "NOT_FOUND");

  const result = await db
    .insert(formSections)
    .values({
      id: randomId(),
      formTemplateId: templateId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
    })
    .returning();
  return c.json({ data: { section: result[0] } }, 201);
});

formTemplatesRoutes.patch(
  "/admin/form-templates/:id/sections/:sectionId",
  async (c) => {
    const templateId = c.req.param("id");
    const sectionId = c.req.param("sectionId");
    const parsed = await parseJsonBody(c, formSectionUpdateSchema);
    if ("response" in parsed) return parsed.response;
    if (Object.keys(parsed.data).length === 0) {
      return jsonError(c, 400, "No fields to update", "BAD_REQUEST");
    }
    const db = getDb(c);
    const result = await db
      .update(formSections)
      .set(parsed.data)
      .where(
        and(
          eq(formSections.id, sectionId),
          eq(formSections.formTemplateId, templateId),
        ),
      )
      .returning();
    if (!result[0]) return jsonError(c, 404, "Section not found", "NOT_FOUND");
    return c.json({ data: { section: result[0] } });
  },
);

formTemplatesRoutes.delete(
  "/admin/form-templates/:id/sections/:sectionId",
  async (c) => {
    const templateId = c.req.param("id");
    const sectionId = c.req.param("sectionId");
    const db = getDb(c);
    const result = await db
      .delete(formSections)
      .where(
        and(
          eq(formSections.id, sectionId),
          eq(formSections.formTemplateId, templateId),
        ),
      )
      .returning();
    if (!result[0]) return jsonError(c, 404, "Section not found", "NOT_FOUND");
    return c.json({ data: { ok: true } });
  },
);
