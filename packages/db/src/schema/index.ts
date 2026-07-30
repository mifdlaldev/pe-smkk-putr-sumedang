/**
 * D1 / SQLite schema v1 (skeleton).
 * Domain expands in later phases; users + projects stubs for migration path.
 */
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
