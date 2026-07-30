import { Hono } from "hono";
import type { HealthResponse } from "@pe-smkk/shared";
import type { AppEnv } from "../types";

export const healthRoutes = new Hono<AppEnv>();

healthRoutes.get("/health", (c) => {
  const body: HealthResponse = {
    ok: true,
    service: "pe-smkk-api",
    version: c.env.APP_VERSION ?? "0.0.0",
    time: new Date().toISOString(),
  };
  return c.json(body);
});

healthRoutes.get("/", (c) =>
  c.json({
    service: "pe-smkk-api",
    docs: "GET /health",
  }),
);
