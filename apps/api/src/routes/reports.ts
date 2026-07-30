import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import {
  formTemplates,
  laporan1Answers,
  laporan2Answers,
  projects,
  reports,
} from "@pe-smkk/db";
import {
  Role,
  reportCreateSchema,
  reportDraftPatchSchema,
} from "@pe-smkk/shared";
import type { AppEnv } from "../types";
import { requireSession } from "../middleware/auth";
import { getDb } from "../lib/session";
import { randomId } from "../lib/crypto";
import { canAccessOwned } from "../lib/access";
import { jsonError, nowIso, parseJsonBody } from "../lib/http";

export const reportsRoutes = new Hono<AppEnv>();

reportsRoutes.use("*", requireSession);

reportsRoutes.get("/reports", async (c) => {
  const user = c.get("user")!;
  const db = getDb(c);
  const rows =
    user.role === Role.ADMIN
      ? await db.select().from(reports).orderBy(desc(reports.updatedAt))
      : await db
          .select()
          .from(reports)
          .where(eq(reports.userId, user.id))
          .orderBy(desc(reports.updatedAt));
  return c.json({ data: { items: rows } });
});

reportsRoutes.get("/reports/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;
  const db = getDb(c);
  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1);
  const report = rows[0];
  if (!report) return jsonError(c, 404, "Report not found", "NOT_FOUND");
  if (!canAccessOwned(user, report.userId)) {
    return jsonError(c, 403, "Forbidden", "FORBIDDEN");
  }

  const template = (
    await db
      .select()
      .from(formTemplates)
      .where(eq(formTemplates.id, report.formTemplateId))
      .limit(1)
  )[0];

  const l1 = await db
    .select()
    .from(laporan1Answers)
    .where(eq(laporan1Answers.reportId, id));
  const l2 = await db
    .select()
    .from(laporan2Answers)
    .where(eq(laporan2Answers.reportId, id));

  return c.json({
    data: {
      report,
      template,
      answers: template?.reportType === "LAPORAN2" ? l2 : l1,
    },
  });
});

reportsRoutes.post("/reports", async (c) => {
  const user = c.get("user")!;
  const parsed = await parseJsonBody(c, reportCreateSchema);
  if ("response" in parsed) return parsed.response;
  const d = parsed.data;
  const db = getDb(c);

  const tRows = await db
    .select()
    .from(formTemplates)
    .where(eq(formTemplates.id, d.formTemplateId))
    .limit(1);
  const template = tRows[0];
  if (!template) {
    return jsonError(c, 400, "Invalid formTemplateId", "BAD_REQUEST");
  }

  if (d.projectId) {
    const pRows = await db
      .select()
      .from(projects)
      .where(eq(projects.id, d.projectId))
      .limit(1);
    const project = pRows[0];
    if (!project) {
      return jsonError(c, 400, "Invalid projectId", "BAD_REQUEST");
    }
    if (!canAccessOwned(user, project.ownerUserId)) {
      return jsonError(c, 403, "Forbidden project", "FORBIDDEN");
    }
  }

  const result = await db
    .insert(reports)
    .values({
      id: randomId(),
      reportTitle: d.reportTitle ?? template.title ?? template.name,
      formTemplateId: d.formTemplateId,
      projectId: d.projectId ?? null,
      userId: user.id,
      status: "draft",
      revision: 0,
    })
    .returning();

  return c.json({ data: { report: result[0] } }, 201);
});

/**
 * Batch draft save — replaces answers for report (legacy save-answers semantics)
 * with optimistic revision check. Only while status=draft.
 */
reportsRoutes.patch("/reports/:id/draft", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;
  const parsed = await parseJsonBody(c, reportDraftPatchSchema);
  if ("response" in parsed) return parsed.response;
  const d = parsed.data;
  const db = getDb(c);

  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1);
  const report = rows[0];
  if (!report) return jsonError(c, 404, "Report not found", "NOT_FOUND");
  if (!canAccessOwned(user, report.userId)) {
    return jsonError(c, 403, "Forbidden", "FORBIDDEN");
  }
  if (report.status === "submitted") {
    return jsonError(c, 400, "Report already submitted", "SUBMITTED");
  }
  if (
    d.expectedRevision !== undefined &&
    d.expectedRevision !== report.revision
  ) {
    return jsonError(c, 409, "Report revision conflict", "CONFLICT", {
      revision: report.revision,
      updatedAt: report.updatedAt,
    });
  }

  const template = (
    await db
      .select()
      .from(formTemplates)
      .where(eq(formTemplates.id, report.formTemplateId))
      .limit(1)
  )[0];
  if (!template) {
    return jsonError(c, 500, "Template missing", "INTERNAL");
  }

  if (d.answers) {
    if (template.reportType === "LAPORAN1") {
      await db
        .delete(laporan1Answers)
        .where(eq(laporan1Answers.reportId, id));
      for (const a of d.answers) {
        const item = a as {
          questionId?: string | null;
          subQuestionId?: string | null;
          adaTidakAda?: string | null;
          hasil?: string | null;
          sumberDokumen?: string | null;
        };
        await db.insert(laporan1Answers).values({
          id: randomId(),
          reportId: id,
          questionId: item.questionId ?? null,
          subQuestionId: item.subQuestionId ?? null,
          adaTidakAda: item.adaTidakAda ?? null,
          hasil: item.hasil ?? null,
          sumberDokumen: item.sumberDokumen ?? null,
        });
      }
    } else {
      await db
        .delete(laporan2Answers)
        .where(eq(laporan2Answers.reportId, id));
      for (const a of d.answers) {
        const item = a as {
          questionId?: string | null;
          subQuestionId?: string | null;
          lengkap?: string | null;
          kurangLengkap?: string | null;
          tidakLengkap?: string | null;
          hasilObservasi?: string | null;
          dokumentasi?: string | null;
          fileName?: string | null;
          fileType?: string | null;
          fileSize?: number | null;
        };
        await db.insert(laporan2Answers).values({
          id: randomId(),
          reportId: id,
          questionId: item.questionId ?? null,
          subQuestionId: item.subQuestionId ?? null,
          lengkap: item.lengkap ?? null,
          kurangLengkap: item.kurangLengkap ?? null,
          tidakLengkap: item.tidakLengkap ?? null,
          hasilObservasi: item.hasilObservasi ?? null,
          dokumentasi: item.dokumentasi ?? null,
          fileName: item.fileName ?? null,
          fileType: item.fileType ?? null,
          fileSize: item.fileSize ?? null,
        });
      }
    }
  }

  const patch: Partial<typeof reports.$inferInsert> = {
    revision: report.revision + 1,
    updatedAt: nowIso(),
  };
  if (d.reportTitle !== undefined) patch.reportTitle = d.reportTitle;

  const updated = await db
    .update(reports)
    .set(patch)
    .where(eq(reports.id, id))
    .returning();

  return c.json({ data: { report: updated[0] } });
});

reportsRoutes.post("/reports/:id/submit", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;
  const db = getDb(c);
  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1);
  const report = rows[0];
  if (!report) return jsonError(c, 404, "Report not found", "NOT_FOUND");
  if (!canAccessOwned(user, report.userId)) {
    return jsonError(c, 403, "Forbidden", "FORBIDDEN");
  }
  if (report.status === "submitted") {
    return jsonError(c, 400, "Report already submitted", "SUBMITTED");
  }

  const updated = await db
    .update(reports)
    .set({
      status: "submitted",
      submittedAt: nowIso(),
      updatedAt: nowIso(),
      revision: report.revision + 1,
    })
    .where(eq(reports.id, id))
    .returning();

  return c.json({ data: { report: updated[0] } });
});

reportsRoutes.delete("/reports/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;
  const db = getDb(c);
  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1);
  const report = rows[0];
  if (!report) return jsonError(c, 404, "Report not found", "NOT_FOUND");
  if (!canAccessOwned(user, report.userId)) {
    return jsonError(c, 403, "Forbidden", "FORBIDDEN");
  }
  if (report.status === "submitted" && user.role !== Role.ADMIN) {
    return jsonError(c, 400, "Cannot delete submitted report", "SUBMITTED");
  }
  await db.delete(reports).where(eq(reports.id, id));
  return c.json({ data: { ok: true } });
});
