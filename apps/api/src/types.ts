import type { SessionUser } from "./lib/session";

/** Cloudflare Worker bindings for PE-SMKK API. */
export type AppBindings = {
  DB: D1Database;
  APP_VERSION: string;
  /** CORS allowlist origin (web app). */
  APP_ORIGIN?: string;
  SESSION_SECRET?: string;
  /**
   * Password-reset delivery mode.
   * - `log` (default local): token may appear in logs / devToken field
   * - `none`: never echo token (production until email wired)
   */
  EMAIL_DELIVERY?: "log" | "none";
  /** Optional R2 — enable in wrangler when bucket exists. */
  DOCUMENTS?: R2Bucket;
};

export type AppVariables = {
  user?: SessionUser;
};

export type AppEnv = {
  Bindings: AppBindings;
  Variables: AppVariables;
};
