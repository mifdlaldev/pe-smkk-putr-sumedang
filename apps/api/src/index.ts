import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types";
import { healthRoutes } from "./routes/health";

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  const origin = c.env.APP_ORIGIN ?? "http://localhost:3000";
  const middleware = cors({
    origin,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 600,
  });
  return middleware(c, next);
});

app.route("/", healthRoutes);

app.notFound((c) =>
  c.json({ error: "Not found", code: "NOT_FOUND" }, 404),
);

app.onError((err, c) => {
  console.error("unhandled", err.message);
  return c.json({ error: "Internal server error", code: "INTERNAL" }, 500);
});

export default app;

export type AppType = typeof app;
