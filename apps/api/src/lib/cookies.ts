export const SESSION_COOKIE = "pe_smkk_session";

/** Default session: 2 hours. */
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
/** Remember-me: 30 days. */
export const SESSION_TTL_REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;

/** Sliding extension if remaining life below this (default sessions). */
export const SESSION_SLIDE_IF_REMAINING_MS = 30 * 60 * 1000;

export const RATE_LIMIT = {
  login: { max: 10, windowMs: 15 * 60 * 1000 },
  requestReset: { max: 5, windowMs: 15 * 60 * 1000 },
  resetPassword: { max: 10, windowMs: 15 * 60 * 1000 },
} as const;

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function isSecureRequest(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function sessionCookieHeader(
  rawToken: string,
  maxAgeSec: number,
  secure: boolean,
): string {
  const parts = [
    `${SESSION_COOKIE}=${rawToken}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookieHeader(secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function parseCookie(
  header: string | undefined,
  name: string,
): string | undefined {
  if (!header) return undefined;
  const parts = header.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return undefined;
}
