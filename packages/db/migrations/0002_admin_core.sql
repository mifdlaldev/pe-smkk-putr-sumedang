-- P3 admin core tables
CREATE TABLE `system_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key_name` text NOT NULL,
	`value` text,
	`description` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `system_settings_key_name_unique` ON `system_settings` (`key_name`);--> statement-breakpoint
CREATE TABLE `project_fields` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`report_type` text NOT NULL,
	`field_type` text DEFAULT 'TEXT' NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`options_json` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `project_fields_report_type_idx` ON `project_fields` (`report_type`);--> statement-breakpoint
CREATE TABLE `form_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`title` text,
	`report_type` text NOT NULL,
	`created_by_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `form_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`form_template_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`form_template_id`) REFERENCES `form_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `form_sections_template_idx` ON `form_sections` (`form_template_id`);
