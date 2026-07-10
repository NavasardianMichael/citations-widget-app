CREATE TABLE `citations` (
	`id` text PRIMARY KEY NOT NULL,
	`text` text NOT NULL,
	`author` text,
	`source_ref` text,
	`source_type` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`submitted_by_user_id` text,
	`share_profile` integer DEFAULT false NOT NULL,
	`moderator_note` text,
	`reviewed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`submitted_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `saved_citations` (
	`user_id` text NOT NULL,
	`citation_id` text NOT NULL,
	`saved_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`user_id`, `citation_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`citation_id`) REFERENCES `citations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text,
	`last_name` text,
	`social_url` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `widget_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`source_selection` text DEFAULT 'mixed' NOT NULL,
	`refresh_rate_hours` integer DEFAULT 24 NOT NULL,
	`font_style` text DEFAULT 'source_serif_4' NOT NULL,
	`show_attribution` integer DEFAULT true NOT NULL,
	`current_citation_id` text,
	`current_citation_set_at` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`current_citation_id`) REFERENCES `citations`(`id`) ON UPDATE no action ON DELETE set null
);
