import { z } from "zod";

/** Standard API error body for Worker responses. */
export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export type ApiSuccessBody<T> = {
  data: T;
};

export const healthResponseSchema = z.object({
  ok: z.literal(true),
  service: z.string(),
  version: z.string(),
  time: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
