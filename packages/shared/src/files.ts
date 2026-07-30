import { z } from "zod";

export const filePurposeSchema = z.enum(["report_document", "avatar"]);
export type FilePurpose = z.infer<typeof filePurposeSchema>;

/** Max bytes — field network + free R2 budget. */
export const FILE_LIMITS = {
  avatar: 5 * 1024 * 1024,
  report_document: 15 * 1024 * 1024,
} as const;

export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type AllowedMime = (typeof ALLOWED_MIME)[number];

export function isAllowedMime(mime: string): mime is AllowedMime {
  return (ALLOWED_MIME as readonly string[]).includes(mime);
}

export function maxBytesForPurpose(purpose: FilePurpose): number {
  return purpose === "avatar" ? FILE_LIMITS.avatar : FILE_LIMITS.report_document;
}

/**
 * Sanitize original filename for storage suffix only.
 * Full object key is always server-built.
 */
export function safeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "file";
  const cleaned = base
    .replace(/[^\w.\-()+ ]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120);
  return cleaned.length > 0 ? cleaned : "file";
}

export const documentMetaSchema = z.object({
  id: z.string(),
  purpose: filePurposeSchema,
  reportId: z.string().nullable(),
  ownerUserId: z.string(),
  originalName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  createdAt: z.string(),
  /** Never expose raw objectKey to clients in list responses if not needed — optional. */
  objectKey: z.string().optional(),
});
