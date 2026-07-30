import { describe, expect, it } from "vitest";
import app from "../src/index";

describe("GET /health", () => {
  it("returns ok payload", async () => {
    const res = await app.request("/health", undefined, {
      APP_VERSION: "test",
      APP_ORIGIN: "http://localhost:3000",
      DB: {} as D1Database,
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      service: string;
      version: string;
    };
    expect(json.ok).toBe(true);
    expect(json.service).toBe("pe-smkk-api");
    expect(json.version).toBe("test");
  });
});
