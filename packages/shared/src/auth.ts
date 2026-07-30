import { z } from "zod";

export const loginBodySchema = z.object({
  username: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/, "Invalid username format"),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(false),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

export const requestResetBodySchema = z.object({
  /** Username or email — response always generic (no enumeration). */
  identifier: z.string().trim().min(1).max(254),
});
export type RequestResetBody = z.infer<typeof requestResetBodySchema>;

export const resetPasswordBodySchema = z.object({
  token: z.string().min(20).max(200),
  newPassword: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
});
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;

export const publicUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  fullName: z.string().nullable().optional(),
  role: z.enum(["ADMIN", "SURVEYOR"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  dinasId: z.number().nullable().optional(),
  profileImage: z.string().nullable().optional(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;
