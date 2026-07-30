-- P4: projects values, form questions, reports, L1/L2 answers
CREATE TABLE `form_subsections` (
	`id` text PRIMARY KEY NOT NULL,
	`section_id` text NOT NULL,
	`title` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `form_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `form_subsections_section_idx` ON `form_subsections` (`section_id`);--> statement-breakpoint
CREATE TABLE `form_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`section_id` text NOT NULL,
	`subsection_id` text,
	`text` text NOT NULL,
	`type` text DEFAULT 'text' NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`options_json` text,
	`keterangan` text,
	`referensi` text,
	`status_wajib_opsional` text,
	FOREIGN KEY (`section_id`) REFERENCES `form_sections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subsection_id`) REFERENCES `form_subsections`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `form_questions_section_idx` ON `form_questions` (`section_id`);--> statement-breakpoint
CREATE TABLE `form_subquestions` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`text` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`keterangan` text,
	`referensi` text,
	FOREIGN KEY (`question_id`) REFERENCES `form_questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `form_subquestions_question_idx` ON `form_subquestions` (`question_id`);--> statement-breakpoint
CREATE TABLE `project_field_values` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`field_id` text NOT NULL,
	`value` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_id`) REFERENCES `project_fields`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_field_values_project_field_uidx` ON `project_field_values` (`project_id`,`field_id`);--> statement-breakpoint
CREATE INDEX `project_field_values_project_idx` ON `project_field_values` (`project_id`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`report_title` text,
	`total_score` text,
	`grade` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text,
	`form_template_id` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`submitted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`form_template_id`) REFERENCES `form_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `reports_user_idx` ON `reports` (`user_id`);--> statement-breakpoint
CREATE INDEX `reports_project_idx` ON `reports` (`project_id`);--> statement-breakpoint
CREATE INDEX `projects_owner_idx` ON `projects` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `laporan1_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`question_id` text,
	`sub_question_id` text,
	`ada_tidak_ada` text,
	`hasil` text,
	`sumber_dokumen` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `form_questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sub_question_id`) REFERENCES `form_subquestions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `laporan1_answers_report_idx` ON `laporan1_answers` (`report_id`);--> statement-breakpoint
CREATE TABLE `laporan2_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`question_id` text,
	`sub_question_id` text,
	`lengkap` text,
	`kurang_lengkap` text,
	`tidak_lengkap` text,
	`hasil_observasi` text,
	`dokumentasi` text,
	`file_name` text,
	`file_type` text,
	`file_size` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `form_questions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sub_question_id`) REFERENCES `form_subquestions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `laporan2_answers_report_idx` ON `laporan2_answers` (`report_id`);
