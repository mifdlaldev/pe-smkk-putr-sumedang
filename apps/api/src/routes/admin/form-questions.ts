import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";
import {
  formQuestions,
  formSections,
  formSubquestions,
  formSubsections,
  formTemplates,
} from "@pe-smkk/db";
import { Role, formQuestionCreateSchema } from "@pe-smkk/shared";
import { z } from "zod";
import type { AppEnv } from "../../types";
import { requireRole, requireSession } from "../../middleware/auth";
import { getDb } from "../../lib/session";
import { randomId } from "../../lib/crypto";
import { jsonError, parseJsonBody } from "../../lib/http";

/** Admin: manage questions under form sections (shared L1/L2 engine). */
export const formQuestionsRoutes = new Hono<AppEnv>();

formQuestionsRoutes.use("*", requireSession, requireRole(Role.ADMIN));

const subsectionCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  sortOrder: z.number().int().min(0).max(10_000).optional().default(0),
});

const subquestionCreateSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  sortOrder: z.number().int().min(0).max(10_000).optional().default(0),
  keterangan: z.string().max(2000).optional().nullable(),
  referensi: z.string().max(2000).optional().nullable(),
});

formQuestionsRoutes.get(
  "/admin/form-templates/:templateId/tree",
  async (c) => {
    const templateId = c.req.param("templateId");
    const db = getDb(c);
    const t = (
      await db
        .select()
        .from(formTemplates)
        .where(eq(formTemplates.id, templateId))
        .limit(1)
    )[0];
    if (!t) return jsonError(c, 404, "Template not found", "NOT_FOUND");

    const sections = await db
      .select()
      .from(formSections)
      .where(eq(formSections.formTemplateId, templateId))
      .orderBy(asc(formSections.sortOrder));

    const tree = [];
    for (const section of sections) {
      const subs = await db
        .select()
        .from(formSubsections)
        .where(eq(formSubsections.sectionId, section.id))
        .orderBy(asc(formSubsections.sortOrder));
      const questions = await db
        .select()
        .from(formQuestions)
        .where(eq(formQuestions.sectionId, section.id))
        .orderBy(asc(formQuestions.sortOrder));
      const withSubs = [];
      for (const q of questions) {
        const sq = await db
          .select()
          .from(formSubquestions)
          .where(eq(formSubquestions.questionId, q.id))
          .orderBy(asc(formSubquestions.sortOrder));
        withSubs.push({ ...q, subquestions: sq });
      }
      tree.push({ ...section, subsections: subs, questions: withSubs });
    }

    return c.json({ data: { template: t, sections: tree } });
  },
);

formQuestionsRoutes.post(
  "/admin/form-sections/:sectionId/subsections",
  async (c) => {
    const sectionId = c.req.param("sectionId");
    const parsed = await parseJsonBody(c, subsectionCreateSchema);
    if ("response" in parsed) return parsed.response;
    const db = getDb(c);
    const s = (
      await db
        .select()
        .from(formSections)
        .where(eq(formSections.id, sectionId))
        .limit(1)
    )[0];
    if (!s) return jsonError(c, 404, "Section not found", "NOT_FOUND");
    const result = await db
      .insert(formSubsections)
      .values({
        id: randomId(),
        sectionId,
        title: parsed.data.title,
        sortOrder: parsed.data.sortOrder ?? 0,
      })
      .returning();
    return c.json({ data: { subsection: result[0] } }, 201);
  },
);

formQuestionsRoutes.post(
  "/admin/form-sections/:sectionId/questions",
  async (c) => {
    const sectionId = c.req.param("sectionId");
    const parsed = await parseJsonBody(c, formQuestionCreateSchema);
    if ("response" in parsed) return parsed.response;
    const d = parsed.data;
    const db = getDb(c);
    const s = (
      await db
        .select()
        .from(formSections)
        .where(eq(formSections.id, sectionId))
        .limit(1)
    )[0];
    if (!s) return jsonError(c, 404, "Section not found", "NOT_FOUND");

    if (d.subsectionId) {
      const sub = (
        await db
          .select()
          .from(formSubsections)
          .where(
            and(
              eq(formSubsections.id, d.subsectionId),
              eq(formSubsections.sectionId, sectionId),
            ),
          )
          .limit(1)
      )[0];
      if (!sub) {
        return jsonError(c, 400, "Invalid subsectionId", "BAD_REQUEST");
      }
    }

    const result = await db
      .insert(formQuestions)
      .values({
        id: randomId(),
        sectionId,
        subsectionId: d.subsectionId ?? null,
        text: d.text,
        type: d.type ?? "text",
        required: d.required ?? false,
        sortOrder: d.sortOrder ?? 0,
        optionsJson: d.options ? JSON.stringify(d.options) : null,
        keterangan: d.keterangan ?? null,
        referensi: d.referensi ?? null,
        statusWajibOpsional: d.statusWajibOpsional ?? null,
      })
      .returning();
    return c.json({ data: { question: result[0] } }, 201);
  },
);

formQuestionsRoutes.post(
  "/admin/form-questions/:questionId/subquestions",
  async (c) => {
    const questionId = c.req.param("questionId");
    const parsed = await parseJsonBody(c, subquestionCreateSchema);
    if ("response" in parsed) return parsed.response;
    const db = getDb(c);
    const q = (
      await db
        .select()
        .from(formQuestions)
        .where(eq(formQuestions.id, questionId))
        .limit(1)
    )[0];
    if (!q) return jsonError(c, 404, "Question not found", "NOT_FOUND");
    const result = await db
      .insert(formSubquestions)
      .values({
        id: randomId(),
        questionId,
        text: parsed.data.text,
        sortOrder: parsed.data.sortOrder ?? 0,
        keterangan: parsed.data.keterangan ?? null,
        referensi: parsed.data.referensi ?? null,
      })
      .returning();
    return c.json({ data: { subquestion: result[0] } }, 201);
  },
);

formQuestionsRoutes.delete("/admin/form-questions/:questionId", async (c) => {
  const questionId = c.req.param("questionId");
  const db = getDb(c);
  const result = await db
    .delete(formQuestions)
    .where(eq(formQuestions.id, questionId))
    .returning();
  if (!result[0]) return jsonError(c, 404, "Question not found", "NOT_FOUND");
  return c.json({ data: { ok: true } });
});
