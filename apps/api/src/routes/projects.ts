import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import {
  dinas,
  projectFieldValues,
  projectFields,
  projects,
} from "@pe-smkk/db";
import {
  Role,
  projectCreateSchema,
  projectUpdateSchema,
} from "@pe-smkk/shared";
import type { AppEnv } from "../types";
import { requireSession } from "../middleware/auth";
import { getDb } from "../lib/session";
import { randomId } from "../lib/crypto";
import { canAccessOwned } from "../lib/access";
import { jsonError, nowIso, parseJsonBody } from "../lib/http";

export const projectsRoutes = new Hono<AppEnv>();

projectsRoutes.use("*", requireSession);

async function upsertFieldValues(
  db: ReturnType<typeof getDb>,
  projectId: string,
  values: { fieldId: string; value?: string | null }[],
) {
  for (const v of values) {
    const fieldRows = await db
      .select()
      .from(projectFields)
      .where(eq(projectFields.id, v.fieldId))
      .limit(1);
    if (!fieldRows[0]) continue;

    const existing = await db
      .select()
      .from(projectFieldValues)
      .where(
        and(
          eq(projectFieldValues.projectId, projectId),
          eq(projectFieldValues.fieldId, v.fieldId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(projectFieldValues)
        .set({ value: v.value ?? null, updatedAt: nowIso() })
        .where(eq(projectFieldValues.id, existing[0].id));
    } else {
      await db.insert(projectFieldValues).values({
        id: randomId(),
        projectId,
        fieldId: v.fieldId,
        value: v.value ?? null,
      });
    }
  }
}

projectsRoutes.get("/projects", async (c) => {
  const user = c.get("user")!;
  const db = getDb(c);
  const rows =
    user.role === Role.ADMIN
      ? await db.select().from(projects).orderBy(desc(projects.updatedAt))
      : await db
          .select()
          .from(projects)
          .where(eq(projects.ownerUserId, user.id))
          .orderBy(desc(projects.updatedAt));
  return c.json({ data: { items: rows } });
});

projectsRoutes.get("/projects/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;
  const db = getDb(c);
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  const project = rows[0];
  if (!project) return jsonError(c, 404, "Project not found", "NOT_FOUND");
  if (!canAccessOwned(user, project.ownerUserId)) {
    return jsonError(c, 403, "Forbidden", "FORBIDDEN");
  }
  const values = await db
    .select()
    .from(projectFieldValues)
    .where(eq(projectFieldValues.projectId, id));
  return c.json({ data: { project, fieldValues: values } });
});

projectsRoutes.post("/projects", async (c) => {
  const user = c.get("user")!;
  const parsed = await parseJsonBody(c, projectCreateSchema);
  if ("response" in parsed) return parsed.response;
  const d = parsed.data;
  const db = getDb(c);

  let dinasId = d.dinasId ?? null;
  if (user.role === Role.SURVEYOR) {
    dinasId = user.dinasId ?? dinasId;
  }
  if (dinasId != null) {
    const dRows = await db
      .select()
      .from(dinas)
      .where(eq(dinas.id, dinasId))
      .limit(1);
    if (!dRows[0]) return jsonError(c, 400, "Invalid dinasId", "BAD_REQUEST");
  }

  const id = randomId();
  const result = await db
    .insert(projects)
    .values({
      id,
      name: d.name,
      reportType: d.reportType,
      ownerUserId: user.id,
      dinasId,
      status: "draft",
    })
    .returning();

  if (d.fieldValues?.length) {
    await upsertFieldValues(
      db,
      id,
      d.fieldValues.map((v) => ({
        fieldId: v.fieldId,
        value: v.value,
      })),
    );
  }

  const values = await db
    .select()
    .from(projectFieldValues)
    .where(eq(projectFieldValues.projectId, id));

  return c.json({ data: { project: result[0], fieldValues: values } }, 201);
});

projectsRoutes.patch("/projects/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;
  const parsed = await parseJsonBody(c, projectUpdateSchema);
  if ("response" in parsed) return parsed.response;
  const d = parsed.data;
  const db = getDb(c);

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  const project = rows[0];
  if (!project) return jsonError(c, 404, "Project not found", "NOT_FOUND");
  if (!canAccessOwned(user, project.ownerUserId)) {
    return jsonError(c, 403, "Forbidden", "FORBIDDEN");
  }
  if (project.status === "submitted" && user.role !== Role.ADMIN) {
    return jsonError(c, 400, "Project already submitted", "SUBMITTED");
  }
  if (d.expectedUpdatedAt && d.expectedUpdatedAt !== project.updatedAt) {
    return jsonError(c, 409, "Project was modified", "CONFLICT", {
      updatedAt: project.updatedAt,
    });
  }

  const patch: Partial<typeof projects.$inferInsert> = {
    updatedAt: nowIso(),
  };
  if (d.name !== undefined) patch.name = d.name;
  if (d.status !== undefined) patch.status = d.status;
  if (d.dinasId !== undefined) patch.dinasId = d.dinasId;

  const result = await db
    .update(projects)
    .set(patch)
    .where(eq(projects.id, id))
    .returning();

  if (d.fieldValues?.length) {
    await upsertFieldValues(
      db,
      id,
      d.fieldValues.map((v) => ({
        fieldId: v.fieldId,
        value: v.value,
      })),
    );
  }

  const values = await db
    .select()
    .from(projectFieldValues)
    .where(eq(projectFieldValues.projectId, id));

  return c.json({ data: { project: result[0], fieldValues: values } });
});

projectsRoutes.delete("/projects/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;
  const db = getDb(c);
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  const project = rows[0];
  if (!project) return jsonError(c, 404, "Project not found", "NOT_FOUND");
  if (!canAccessOwned(user, project.ownerUserId)) {
    return jsonError(c, 403, "Forbidden", "FORBIDDEN");
  }
  await db.delete(projects).where(eq(projects.id, id));
  return c.json({ data: { ok: true } });
});
