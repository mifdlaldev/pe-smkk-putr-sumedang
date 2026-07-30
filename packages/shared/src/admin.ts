import { z } from "zod";

export const dinasCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
});
export const dinasUpdateSchema = dinasCreateSchema.partial();

export const userCreateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/),
  email: z.string().trim().email().max(254).transform((e) => e.toLowerCase()),
  fullName: z.string().trim().max(200).optional().nullable(),
  password: z
    .string()
    .min(10)
    .max(128)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
  role: z.enum(["ADMIN", "SURVEYOR"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional().default("ACTIVE"),
  dinasId: z.number().int().positive().optional().nullable(),
});

export const userUpdateSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((e) => e.toLowerCase())
    .optional(),
  fullName: z.string().trim().max(200).optional().nullable(),
  role: z.enum(["ADMIN", "SURVEYOR"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  dinasId: z.number().int().positive().optional().nullable(),
  /** Optional password rotate by admin — never returned. */
  password: z
    .string()
    .min(10)
    .max(128)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/)
    .optional(),
});

export const settingUpsertSchema = z.object({
  keyName: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9._-]+$/),
  value: z.string().max(10_000).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

const fieldTypeEnum = z.enum([
  "TEXT",
  "NUMBER",
  "SELECT",
  "CHECKBOX",
  "RADIO",
  "TEXTAREA",
  "DATE",
  "FILE",
  "ANGKA",
]);

export const projectFieldCreateSchema = z.object({
  label: z.string().trim().min(1).max(200),
  reportType: z.enum(["LAPORAN1", "LAPORAN2", "BOTH"]),
  fieldType: fieldTypeEnum.optional().default("TEXT"),
  required: z.boolean().optional().default(false),
  options: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional().default(0),
});
export const projectFieldUpdateSchema = projectFieldCreateSchema.partial();

export const formTemplateCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  title: z.string().trim().max(200).optional().nullable(),
  reportType: z.enum(["LAPORAN1", "LAPORAN2"]),
});
export const formTemplateUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  title: z.string().trim().max(200).optional().nullable(),
});

export const formSectionCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(0).max(10_000).optional().default(0),
});
export const formSectionUpdateSchema = formSectionCreateSchema.partial();
