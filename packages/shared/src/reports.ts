import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  reportType: z.enum(["LAPORAN1", "LAPORAN2", "BOTH"]),
  dinasId: z.number().int().positive().optional().nullable(),
  /** fieldId -> value */
  fieldValues: z
    .array(
      z.object({
        fieldId: z.string().min(1),
        value: z.string().max(5000).optional().nullable(),
      }),
    )
    .max(100)
    .optional(),
});

export const projectUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  status: z.enum(["draft", "submitted"]).optional(),
  dinasId: z.number().int().positive().optional().nullable(),
  fieldValues: z
    .array(
      z.object({
        fieldId: z.string().min(1),
        value: z.string().max(5000).optional().nullable(),
      }),
    )
    .max(100)
    .optional(),
  expectedUpdatedAt: z.string().optional(),
});

export const reportCreateSchema = z.object({
  formTemplateId: z.string().min(1),
  projectId: z.string().min(1).optional().nullable(),
  reportTitle: z.string().trim().max(300).optional().nullable(),
});

export const laporan1AnswerItemSchema = z.object({
  questionId: z.string().optional().nullable(),
  subQuestionId: z.string().optional().nullable(),
  adaTidakAda: z.string().max(50).optional().nullable(),
  hasil: z.string().max(5000).optional().nullable(),
  sumberDokumen: z.string().max(2000).optional().nullable(),
});

export const laporan2AnswerItemSchema = z.object({
  questionId: z.string().optional().nullable(),
  subQuestionId: z.string().optional().nullable(),
  lengkap: z.string().max(50).optional().nullable(),
  kurangLengkap: z.string().max(50).optional().nullable(),
  tidakLengkap: z.string().max(50).optional().nullable(),
  hasilObservasi: z.string().max(5000).optional().nullable(),
  dokumentasi: z.string().max(2000).optional().nullable(),
  fileName: z.string().max(500).optional().nullable(),
  fileType: z.string().max(100).optional().nullable(),
  fileSize: z.number().int().nonnegative().optional().nullable(),
});

export const reportDraftPatchSchema = z.object({
  reportTitle: z.string().trim().max(300).optional().nullable(),
  /** Client revision for optimistic concurrency */
  expectedRevision: z.number().int().nonnegative().optional(),
  answers: z
    .array(z.union([laporan1AnswerItemSchema, laporan2AnswerItemSchema]))
    .max(500)
    .optional(),
});

export const formQuestionCreateSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  type: z.string().trim().min(1).max(50).optional().default("text"),
  required: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).max(10_000).optional().default(0),
  subsectionId: z.string().optional().nullable(),
  options: z.array(z.string().max(200)).max(50).optional(),
  keterangan: z.string().max(2000).optional().nullable(),
  referensi: z.string().max(2000).optional().nullable(),
  statusWajibOpsional: z.string().max(50).optional().nullable(),
});
