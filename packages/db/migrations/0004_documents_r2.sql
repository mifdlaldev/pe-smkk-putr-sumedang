-- P5 slice: R2 document metadata (private objects)
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`purpose` text NOT NULL,
	`report_id` text,
	`owner_user_id` text NOT NULL,
	`original_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_object_key_unique` ON `documents` (`object_key`);
--> statement-breakpoint
CREATE INDEX `documents_owner_idx` ON `documents` (`owner_user_id`);
--> statement-breakpoint
CREATE INDEX `documents_report_idx` ON `documents` (`report_id`);
