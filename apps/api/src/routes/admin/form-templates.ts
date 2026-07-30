import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
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
 * List/get: any authenticated user (surveyor needs pick template).
 * Mutations: ADMIN only.
 */
export const formTemplatesRoutes = new Hono<AppEnv>();

formTemplatesRoutes.use("*", requireSession);

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

formTemplatesRoutes.post(
  "/admin/form-templates",
  requireRole(Role.ADMIN),
  async (c) => {
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
  },
);

formTemplatesRoutes.patch(
  "/admin/form-templates/:id",
  requireRole(Role.ADMIN),
  async (c) => {
    const id = c.req.param("id");
    const parsed = await parseJsonBody(c, formTemplateUpdateSchema);
    if ("response" in parsed) return parsed.response;
    const db = getDb(c);
    const patch: Partial<typeof formTemplates.$inferInsert> = {
      updatedAt: nowIso(),
    };
    if (parsed.data.name !== undefined) patch.name = parsed.data.name;
    if (parsed.data.title !== undefined) patch.title = parsed.data.title;
    if (parsed.data.reportType !== undefined) {
      patch.reportType = parsed.data.reportType;
    }
    const result = await db
      .update(formTemplates)
      .set(patch)
      .where(eq(formTemplates.id, id))
      .returning();
    if (!result[0]) return jsonError(c, 404, "Template not found", "NOT_FOUND");
    return c.json({ data: { template: result[0] } });
  },
);

formTemplatesRoutes.delete(
  "/admin/form-templates/:id",
  requireRole(Role.ADMIN),
  async (c) => {
    const id = c.req.param("id");
    const db = getDb(c);
    const result = await db
      .delete(formTemplates)
      .where(eq(formTemplates.id, id))
      .returning();
    if (!result[0]) return jsonError(c, 404, "Template not found", "NOT_FOUND");
    return c.json({ data: { ok: true } });
  },
);

formTemplatesRoutes.post(
  "/admin/form-templates/:id/sections",
  requireRole(Role.ADMIN),
  async (c) => {
    const id = c.req.param("id");
    const parsed = await parseJsonBody(c, formSectionCreateSchema);
    if ("response" in parsed) return parsed.response;
    const db = getDb(c);
    const t = (
      await db
        .select()
        .from(formTemplates)
        .where(eq(formTemplates.id, id))
        .limit(1)
    )[0];
    if (!t) return jsonError(c, 404, "Template not found", "NOT_FOUND");
    const result = await db
      .insert(formSections)
      .values({
        id: randomId(),
        formTemplateId: id,
        title: parsed.data.title,
        sortOrder: parsed.data.sortOrder ?? 0,
      })
      .returning();
    return c.json({ data: { section: result[0] } }, 201);
  },
);

formTemplatesRoutes.patch(
  "/admin/form-sections/:sectionId",
  requireRole(Role.ADMIN),
  async (c) => {
    const sectionId = c.req.param("sectionId");
    const parsed = await parseJsonBody(c, formSectionUpdateSchema);
    if ("response" in parsed) return parsed.response;
    const db = getDb(c);
    const patch: Partial<typeof formSections.$inferInsert> = {};
    if (parsed.data.title !== undefined) patch.title = parsed.data.title;
    if (parsed.data.sortOrder !== undefined) {
      patch.sortOrder = parsed.data.sortOrder;
    }
    const result = await db
      .update(formSections)
      .set(patch)
      .where(eq(formSections.id, sectionId))
      .returning();
    if (!result[0]) return jsonError(c, 404, "Section not found", "NOT_FOUND");
    return c.json({ data: { section: result[0] } });
  },
);

formTemplatesRoutes.delete(
  "/admin/form-sections/:sectionId",
  requireRole(Role.ADMIN),
  async (c) => {
    const sectionId = c.req.param("sectionId");
    const db = getDb(c);
    const result = await db
      .delete(formSections)
      .where(eq(formSections.id, sectionId))
      .returning();
    if (!result[0]) return jsonError(c, 404, "Section not found", "NOT_FOUND");
    return c.json({ data: { ok: true } });
  },
);
