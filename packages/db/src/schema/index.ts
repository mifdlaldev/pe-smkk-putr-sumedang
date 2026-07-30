/**
 * D1 / SQLite schema — PE-SMKK
 * Domain aligned with legacy monolit (roles, L1/L2, draft/submit).
 */
import { integer, sqliteTable, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";

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

/** Optional subsection under section (legacy SubSection). */
export const formSubsections = sqliteTable(
  "form_subsections",
  {
    id: text("id").primaryKey(),
    sectionId: text("section_id")
      .notNull()
      .references(() => formSections.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("form_subsections_section_idx").on(t.sectionId)],
);

/**
 * Shared questions for L1/L2 (discriminant via template reportType).
 * Extra meta: keterangan (L1), referensi / statusWajibOpsional (L2).
 */
export const formQuestions = sqliteTable(
  "form_questions",
  {
    id: text("id").primaryKey(),
    sectionId: text("section_id")
      .notNull()
      .references(() => formSections.id, { onDelete: "cascade" }),
    subsectionId: text("subsection_id").references(() => formSubsections.id, {
      onDelete: "set null",
    }),
    text: text("text").notNull(),
    type: text("type").notNull().default("text"),
    required: integer("required", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    optionsJson: text("options_json"),
    keterangan: text("keterangan"),
    referensi: text("referensi"),
    statusWajibOpsional: text("status_wajib_opsional"),
  },
  (t) => [index("form_questions_section_idx").on(t.sectionId)],
);

export const formSubquestions = sqliteTable(
  "form_subquestions",
  {
    id: text("id").primaryKey(),
    questionId: text("question_id")
      .notNull()
      .references(() => formQuestions.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    keterangan: text("keterangan"),
    referensi: text("referensi"),
  },
  (t) => [index("form_subquestions_question_idx").on(t.questionId)],
);

export const projects = sqliteTable(
  "projects",
  {
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
  },
  (t) => [index("projects_owner_idx").on(t.ownerUserId)],
);

/** Values for dynamic project fields (legacy ProjectFieldValue). */
export const projectFieldValues = sqliteTable(
  "project_field_values",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    fieldId: text("field_id")
      .notNull()
      .references(() => projectFields.id, { onDelete: "cascade" }),
    value: text("value"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    uniqueIndex("project_field_values_project_field_uidx").on(
      t.projectId,
      t.fieldId,
    ),
    index("project_field_values_project_idx").on(t.projectId),
  ],
);

export const reports = sqliteTable(
  "reports",
  {
    id: text("id").primaryKey(),
    reportTitle: text("report_title"),
    totalScore: text("total_score"),
    grade: text("grade"),
    status: text("status", { enum: ["draft", "submitted"] })
      .notNull()
      .default("draft"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    formTemplateId: text("form_template_id")
      .notNull()
      .references(() => formTemplates.id),
    /** Optimistic concurrency for draft autosave */
    revision: integer("revision").notNull().default(0),
    submittedAt: text("submitted_at"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    index("reports_user_idx").on(t.userId),
    index("reports_project_idx").on(t.projectId),
  ],
);

/** Laporan 1 answers — domain fields match legacy. */
export const laporan1Answers = sqliteTable(
  "laporan1_answers",
  {
    id: text("id").primaryKey(),
    reportId: text("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    questionId: text("question_id").references(() => formQuestions.id, {
      onDelete: "cascade",
    }),
    subQuestionId: text("sub_question_id").references(
      () => formSubquestions.id,
      { onDelete: "cascade" },
    ),
    adaTidakAda: text("ada_tidak_ada"),
    hasil: text("hasil"),
    sumberDokumen: text("sumber_dokumen"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("laporan1_answers_report_idx").on(t.reportId)],
);

/** Laporan 2 answers — domain fields match legacy. */
export const laporan2Answers = sqliteTable(
  "laporan2_answers",
  {
    id: text("id").primaryKey(),
    reportId: text("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    questionId: text("question_id").references(() => formQuestions.id, {
      onDelete: "cascade",
    }),
    subQuestionId: text("sub_question_id").references(
      () => formSubquestions.id,
      { onDelete: "cascade" },
    ),
    lengkap: text("lengkap"),
    kurangLengkap: text("kurang_lengkap"),
    tidakLengkap: text("tidak_lengkap"),
    hasilObservasi: text("hasil_observasi"),
    dokumentasi: text("dokumentasi"),
    fileName: text("file_name"),
    fileType: text("file_type"),
    fileSize: integer("file_size"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("laporan2_answers_report_idx").on(t.reportId)],
);
