import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types";
import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { dinasRoutes } from "./routes/admin/dinas";
import { usersRoutes } from "./routes/admin/users";
import { settingsRoutes } from "./routes/admin/settings";
import { projectFieldsRoutes } from "./routes/admin/project-fields";
import { formTemplatesRoutes } from "./routes/admin/form-templates";
import { formQuestionsRoutes } from "./routes/admin/form-questions";
import { projectsRoutes } from "./routes/projects";
import { reportsRoutes } from "./routes/reports";

const app = new Hono<AppEnv>();

/** Security headers on every response. */
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("Referrer-Policy", "no-referrer");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  // API is JSON — discourage caching of authenticated payloads by default
  if (!c.res.headers.has("Cache-Control")) {
    c.res.headers.set("Cache-Control", "no-store");
  }
});

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

/** Origin check for cookie-authenticated mutating requests (CSRF mitigation). */
app.use("*", async (c, next) => {
  const method = c.req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }
  const allowed = c.env.APP_ORIGIN ?? "http://localhost:3000";
  const origin = c.req.header("Origin");
  const referer = c.req.header("Referer");
  // Allow non-browser clients without Origin (curl/tests) only for auth bootstrap
  // when no cookie is present. If Cookie is sent, require Origin/Referer match.
  const cookie = c.req.header("Cookie") ?? "";
  const hasSessionCookie = cookie.includes("pe_smkk_session=");
  if (hasSessionCookie) {
    const okOrigin = origin === allowed;
    const okReferer = !!referer && referer.startsWith(allowed);
    if (!okOrigin && !okReferer) {
      return c.json({ error: "Invalid origin", code: "CSRF" }, 403);
    }
  }
  return next();
});

app.route("/", healthRoutes);
app.route("/", authRoutes);
app.route("/", dinasRoutes);
app.route("/", usersRoutes);
app.route("/", settingsRoutes);
app.route("/", projectFieldsRoutes);
app.route("/", formTemplatesRoutes);
app.route("/", formQuestionsRoutes);
app.route("/", projectsRoutes);
app.route("/", reportsRoutes);

app.notFound((c) =>
  c.json({ error: "Not found", code: "NOT_FOUND" }, 404),
);

app.onError((err, c) => {
  console.error("unhandled", err.message);
  return c.json({ error: "Internal server error", code: "INTERNAL" }, 500);
});

export default app;

export type AppType = typeof app;
