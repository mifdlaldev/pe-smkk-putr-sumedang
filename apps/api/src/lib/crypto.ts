/** Web Crypto helpers for Cloudflare Workers (no Node crypto). */

const textEncoder = new TextEncoder();

export function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = "";
  for (let i = 0; i < arr.length; i++) {
    out += arr[i]!.toString(16).padStart(2, "0");
  }
  return out;
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const data =
    typeof input === "string" ? textEncoder.encode(input) : input;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    data as BufferSource,
  );
  return bytesToHex(digest);
}

/** Cryptographically random URL-safe token (base64url). */
export function randomToken(byteLength = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]!);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomId(): string {
  return crypto.randomUUID();
}

/**
 * Password hashing: PBKDF2-SHA-256 via Web Crypto.
 * Format: pbkdf2$iterations$saltHex$hashHex
 * Chosen for Workers portability (no native argon2 on free Workers).
 */
const PBKDF2_ITERS = 310_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const key = await derivePbkdf2(password, salt, PBKDF2_ITERS);
  return `pbkdf2$${PBKDF2_ITERS}$${bytesToHex(salt)}$${bytesToHex(key)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 100_000) return false;
  const salt = hexToBytes(parts[2]!);
  const expected = parts[3]!;
  const actualKey = await derivePbkdf2(password, salt, iterations);
  const actual = bytesToHex(actualKey);
  return timingSafeEqualHex(actual, expected);
}

async function derivePbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<ArrayBuffer> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as BufferSource,
      iterations,
    },
    baseKey,
    KEY_BITS,
  );
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i)! ^ b.charCodeAt(i)!;
  }
  return diff === 0;
}
