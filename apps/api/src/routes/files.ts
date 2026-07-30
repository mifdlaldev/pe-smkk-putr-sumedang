import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { documents, reports } from "@pe-smkk/db";
import {
  filePurposeSchema,
  isAllowedMime,
  maxBytesForPurpose,
  safeFileName,
} from "@pe-smkk/shared";
import type { AppEnv } from "../types";
import { requireSession } from "../middleware/auth";
import { getDb } from "../lib/session";
import { randomId } from "../lib/crypto";
import { canAccessOwned } from "../lib/access";
import { jsonError } from "../lib/http";

/**
 * Private R2 file API — no public bucket ACL.
 * Keys are always server-built: never accept client objectKey.
 */
export const filesRoutes = new Hono<AppEnv>();

filesRoutes.use("*", requireSession);

function requireDocuments(c: { env: AppEnv["Bindings"] }) {
  const bucket = c.env.DOCUMENTS;
  if (!bucket) {
    return null;
  }
  return bucket;
}

function toMeta(row: typeof documents.$inferSelect) {
  return {
    id: row.id,
    purpose: row.purpose,
    reportId: row.reportId,
    ownerUserId: row.ownerUserId,
    originalName: row.originalName,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt,
  };
}

/**
 * POST /files/upload
 * multipart: file (required), purpose (report_document|avatar), reportId (required for report_document)
 */
filesRoutes.post("/files/upload", async (c) => {
  const bucket = requireDocuments(c);
  if (!bucket) {
    return jsonError(c, 503, "File storage not configured", "R2_UNAVAILABLE");
  }

  const user = c.get("user")!;
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return jsonError(c, 400, "Expected multipart form data", "BAD_REQUEST");
  }

  const purposeRaw = String(form.get("purpose") ?? "");
  const purposeParsed = filePurposeSchema.safeParse(purposeRaw);
  if (!purposeParsed.success) {
    return jsonError(
      c,
      400,
      "Invalid purpose (report_document|avatar)",
      "VALIDATION",
    );
  }
  const purpose = purposeParsed.data;

  const reportIdRaw = form.get("reportId");
  const reportId =
    typeof reportIdRaw === "string" && reportIdRaw.length > 0
      ? reportIdRaw
      : null;

  if (purpose === "report_document" && !reportId) {
    return jsonError(
      c,
      400,
      "reportId required for report_document",
      "VALIDATION",
    );
  }
  if (purpose === "avatar" && reportId) {
    return jsonError(c, 400, "avatar must not include reportId", "VALIDATION");
  }

  const fileEntry = form.get("file");
  if (
    !fileEntry ||
    typeof fileEntry !== "object" ||
    !("arrayBuffer" in fileEntry) ||
    typeof (fileEntry as Blob).arrayBuffer !== "function" ||
    !("size" in fileEntry)
  ) {
    return jsonError(c, 400, "file field required", "VALIDATION");
  }
  const fileBlob = fileEntry as Blob & { name?: string; type: string };

  const contentType = (fileBlob.type || "application/octet-stream").toLowerCase();
  if (!isAllowedMime(contentType)) {
    return jsonError(
      c,
      400,
      "MIME not allowed (jpeg, png, webp, pdf)",
      "MIME_DENIED",
    );
  }

  const maxBytes = maxBytesForPurpose(purpose);
  if (fileBlob.size <= 0 || fileBlob.size > maxBytes) {
    return jsonError(
      c,
      400,
      `File size must be 1..${maxBytes} bytes`,
      "SIZE_LIMIT",
    );
  }

  const db = getDb(c);

  if (purpose === "report_document" && reportId) {
    const rRows = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);
    const report = rRows[0];
    if (!report) {
      return jsonError(c, 404, "Report not found", "NOT_FOUND");
    }
    if (!canAccessOwned(user, report.userId)) {
      return jsonError(c, 403, "Forbidden", "FORBIDDEN");
    }
  }

  // Avatar: only self (admin cannot overwrite others via this endpoint without policy)
  if (purpose === "avatar") {
    // owner is always the authenticated user
  }

  const id = randomId();
  const originalName = safeFileName(fileBlob.name || "upload");
  const objectKey =
    purpose === "avatar"
      ? `users/${user.id}/avatar/${id}-${originalName}`
      : `reports/${reportId}/${id}-${originalName}`;

  const body = await fileBlob.arrayBuffer();
  await bucket.put(objectKey, body, {
    httpMetadata: { contentType },
    customMetadata: {
      ownerUserId: user.id,
      purpose,
      documentId: id,
    },
  });

  // Avatar: replace previous avatar rows for user
  if (purpose === "avatar") {
    const old = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.ownerUserId, user.id),
          eq(documents.purpose, "avatar"),
        ),
      );
    for (const row of old) {
      try {
        await bucket.delete(row.objectKey);
      } catch {
        /* ignore missing */
      }
      await db.delete(documents).where(eq(documents.id, row.id));
    }
  }

  const inserted = await db
    .insert(documents)
    .values({
      id,
      objectKey,
      purpose,
      reportId: purpose === "report_document" ? reportId : null,
      ownerUserId: user.id,
      originalName,
      contentType,
      sizeBytes: fileBlob.size,
    })
    .returning();

  return c.json({ data: { document: toMeta(inserted[0]!) } }, 201);
});

/** GET /files?reportId=… | purpose=avatar */
filesRoutes.get("/files", async (c) => {
  const user = c.get("user")!;
  const db = getDb(c);
  const reportId = c.req.query("reportId");
  const purpose = c.req.query("purpose");

  if (reportId) {
    const rRows = await db
      .select()
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);
    const report = rRows[0];
    if (!report) {
      return jsonError(c, 404, "Report not found", "NOT_FOUND");
    }
    if (!canAccessOwned(user, report.userId)) {
      return jsonError(c, 403, "Forbidden", "FORBIDDEN");
    }
    const rows = await db
      .select()
      .from(documents)
      .where(eq(documents.reportId, reportId))
      .orderBy(desc(documents.createdAt));
    return c.json({ data: { items: rows.map(toMeta) } });
  }

  if (purpose === "avatar") {
    const rows = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.ownerUserId, user.id),
          eq(documents.purpose, "avatar"),
        ),
      )
      .orderBy(desc(documents.createdAt))
      .limit(5);
    return c.json({ data: { items: rows.map(toMeta) } });
  }

  // Admin: recent docs; surveyor: own only
  const rows =
    user.role === "ADMIN"
      ? await db
          .select()
          .from(documents)
          .orderBy(desc(documents.createdAt))
          .limit(100)
      : await db
          .select()
          .from(documents)
          .where(eq(documents.ownerUserId, user.id))
          .orderBy(desc(documents.createdAt))
          .limit(100);

  return c.json({ data: { items: rows.map(toMeta) } });
});

/** GET /files/:id/download — stream from R2 (authz) */
filesRoutes.get("/files/:id/download", async (c) => {
  const bucket = requireDocuments(c);
  if (!bucket) {
    return jsonError(c, 503, "File storage not configured", "R2_UNAVAILABLE");
  }

  const id = c.req.param("id");
  const user = c.get("user")!;
  const db = getDb(c);
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  const doc = rows[0];
  if (!doc) return jsonError(c, 404, "Document not found", "NOT_FOUND");

  if (doc.purpose === "report_document" && doc.reportId) {
    const rRows = await db
      .select()
      .from(reports)
      .where(eq(reports.id, doc.reportId))
      .limit(1);
    const report = rRows[0];
    if (!report || !canAccessOwned(user, report.userId)) {
      return jsonError(c, 403, "Forbidden", "FORBIDDEN");
    }
  } else if (!canAccessOwned(user, doc.ownerUserId)) {
    return jsonError(c, 403, "Forbidden", "FORBIDDEN");
  }

  const obj = await bucket.get(doc.objectKey);
  if (!obj) {
    return jsonError(c, 404, "Object missing in storage", "NOT_FOUND");
  }

  const headers = new Headers();
  headers.set("Content-Type", doc.contentType);
  headers.set(
    "Content-Disposition",
    `attachment; filename="${doc.originalName.replace(/"/g, "")}"`,
  );
  headers.set("Cache-Control", "private, no-store");
  if (obj.size != null) {
    headers.set("Content-Length", String(obj.size));
  }

  return new Response(obj.body, { status: 200, headers });
});

/** DELETE /files/:id — owner or admin; removes R2 + metadata */
filesRoutes.delete("/files/:id", async (c) => {
  const bucket = requireDocuments(c);
  if (!bucket) {
    return jsonError(c, 503, "File storage not configured", "R2_UNAVAILABLE");
  }

  const id = c.req.param("id");
  const user = c.get("user")!;
  const db = getDb(c);
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  const doc = rows[0];
  if (!doc) return jsonError(c, 404, "Document not found", "NOT_FOUND");

  if (!canAccessOwned(user, doc.ownerUserId)) {
    // Also allow report owner if different from uploader (same as report access)
    if (doc.reportId) {
      const rRows = await db
        .select()
        .from(reports)
        .where(eq(reports.id, doc.reportId))
        .limit(1);
      const report = rRows[0];
      if (!report || !canAccessOwned(user, report.userId)) {
        return jsonError(c, 403, "Forbidden", "FORBIDDEN");
      }
    } else {
      return jsonError(c, 403, "Forbidden", "FORBIDDEN");
    }
  }

  try {
    await bucket.delete(doc.objectKey);
  } catch {
    /* still drop metadata */
  }
  await db.delete(documents).where(eq(documents.id, id));
  return c.json({ data: { ok: true } });
});
