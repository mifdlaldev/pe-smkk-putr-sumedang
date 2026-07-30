/**
 * D1 / SQLite schema — PE-SMKK
 * Auth: users + server-side sessions + rate-limit buckets.
 */
import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const dinas = sqliteTable("dinas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  fullName: text("full_name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["ADMIN", "SURVEYOR"] }).notNull(),
  status: text("status", {
    enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
  })
    .notNull()
    .default("ACTIVE"),
  profileImage: text("profile_image"),
  profileImagePath: text("profile_image_path"),
  /** SHA-256 hex of one-time reset token; never store raw token. */
  resetTokenHash: text("reset_token_hash"),
  resetTokenExpiry: text("reset_token_expiry"),
  dinasId: integer("dinas_id").references(() => dinas.id),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/**
 * Opaque session tokens: browser holds raw id in HttpOnly cookie;
 * DB stores only token_hash (SHA-256).
 */
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: text("expires_at").notNull(),
    rememberMe: integer("remember_me", { mode: "boolean" })
      .notNull()
      .default(false),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    lastSeenAt: text("last_seen_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

/** Sliding window counters for login / reset (keyed by action + ip hash). */
export const authRateLimits = sqliteTable("auth_rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: text("window_start").notNull(),
});

/** Real project entity (legacy only had free-form projectId strings). */
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  reportType: text("report_type", {
    enum: ["LAPORAN1", "LAPORAN2", "BOTH"],
  }).notNull(),
  status: text("status", { enum: ["draft", "submitted"] })
    .notNull()
    .default("draft"),
  ownerUserId: text("owner_user_id")
    .notNull()
    .references(() => users.id),
  dinasId: integer("dinas_id").references(() => dinas.id),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
