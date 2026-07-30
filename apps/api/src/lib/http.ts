import type { Context } from "hono";
import type { ZodSchema } from "zod";
import type { AppEnv } from "../types";

export function jsonError(
  c: Context<AppEnv>,
  status: 400 | 401 | 403 | 404 | 409 | 500,
  error: string,
  code: string,
  details?: unknown,
) {
  return c.json(
    details !== undefined ? { error, code, details } : { error, code },
    status,
  );
}

export async function parseJsonBody<T>(
  c: Context<AppEnv>,
  schema: ZodSchema<T>,
): Promise<{ data: T } | { response: Response }> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return {
      response: jsonError(c, 400, "Invalid JSON body", "BAD_REQUEST"),
    };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      response: jsonError(
        c,
        400,
        "Validation failed",
        "VALIDATION",
        parsed.error.flatten(),
      ),
    };
  }
  return { data: parsed.data };
}

export function nowIso(): string {
  return new Date().toISOString();
}
