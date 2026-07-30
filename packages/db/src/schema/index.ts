/**
 * D1 / SQLite schema — PE-SMKK
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

export const authRateLimits = sqliteTable("auth_rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: text("window_start").notNull(),
});

export const systemSettings = sqliteTable("system_settings", {
  id: text("id").primaryKey(),
  keyName: text("key_name").notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/** Dynamic project form field definitions (per report type). */
export const projectFields = sqliteTable(
  "project_fields",
  {
    id: text("id").primaryKey(),
    label: text("label").notNull(),
    reportType: text("report_type", {
      enum: ["LAPORAN1", "LAPORAN2", "BOTH"],
    }).notNull(),
    fieldType: text("field_type", {
      enum: [
        "TEXT",
        "NUMBER",
        "SELECT",
        "CHECKBOX",
        "RADIO",
        "TEXTAREA",
        "DATE",
        "FILE",
        "ANGKA",
      ],
    })
      .notNull()
      .default("TEXT"),
    required: integer("required", { mode: "boolean" }).notNull().default(false),
    /** JSON array of option strings for SELECT/CHECKBOX/RADIO */
    optionsJson: text("options_json"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("project_fields_report_type_idx").on(t.reportType)],
);

/**
 * Shared form template for Laporan 1 / 2 (one engine, type discriminant).
 * Sections/questions expand in later tasks without L1/L2 route forks.
 */
export const formTemplates = sqliteTable("form_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title"),
  reportType: text("report_type", {
    enum: ["LAPORAN1", "LAPORAN2"],
  }).notNull(),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const formSections = sqliteTable(
  "form_sections",
  {
    id: text("id").primaryKey(),
    formTemplateId: text("form_template_id")
      .notNull()
      .references(() => formTemplates.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("form_sections_template_idx").on(t.formTemplateId)],
);

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
