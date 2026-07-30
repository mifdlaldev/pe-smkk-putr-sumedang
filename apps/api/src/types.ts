/** Cloudflare Worker bindings for PE-SMKK API. */
export type AppBindings = {
  DB: D1Database;
  APP_VERSION: string;
  /** CORS allowlist origin (web app). */
  APP_ORIGIN?: string;
  SESSION_SECRET?: string;
  /** Optional R2 — enable in wrangler when bucket exists. */
  DOCUMENTS?: R2Bucket;
};

export type AppVariables = {
  // request-scoped (session etc.) filled in later phases
};

export type AppEnv = {
  Bindings: AppBindings;
  Variables: AppVariables;
};
