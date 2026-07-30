import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, sha256Hex, randomToken } from "../src/lib/crypto";
import { parseCookie, sessionCookieHeader } from "../src/lib/cookies";

describe("crypto", () => {
  it("hashes and verifies password", async () => {
    const hash = await hashPassword("CorrectHorse9");
    expect(hash.startsWith("pbkdf2$310000$")).toBe(true);
    expect(await verifyPassword("CorrectHorse9", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("sha256 is stable", async () => {
    const a = await sha256Hex("hello");
    const b = await sha256Hex("hello");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("randomToken is long enough", () => {
    const t = randomToken(32);
    expect(t.length).toBeGreaterThan(20);
  });
});

describe("cookies", () => {
  it("parses cookie header", () => {
    expect(parseCookie("a=1; pe_smkk_session=abc; b=2", "pe_smkk_session")).toBe(
      "abc",
    );
  });

  it("builds session cookie", () => {
    const h = sessionCookieHeader("tok", 3600, true);
    expect(h).toContain("HttpOnly");
    expect(h).toContain("Secure");
    expect(h).toContain("SameSite=Lax");
  });
});
