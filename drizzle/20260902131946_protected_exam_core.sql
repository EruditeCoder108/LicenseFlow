CREATE TABLE `exam_answers` (
	`attempt_id` text NOT NULL,
	`position` integer NOT NULL,
	`question_id` text NOT NULL,
	`selected` integer NOT NULL,
	`is_correct` integer NOT NULL,
	`timed_out` integer NOT NULL,
	`received_at` integer NOT NULL,
	PRIMARY KEY(`attempt_id`, `position`),
	FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exam_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_hash` text NOT NULL,
	`application_id` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`retake_of` text,
	`status` text NOT NULL,
	`revision` integer NOT NULL,
	`lease_client` text,
	`lease_until` integer,
	`state_json` text NOT NULL,
	`mutation_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`owner_hash`) REFERENCES `exam_sessions`(`token_hash`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exam_one_open_attempt_idx` ON `exam_attempts` (`owner_hash`) WHERE "exam_attempts"."status" != 'completed';--> statement-breakpoint
CREATE UNIQUE INDEX `exam_attempt_number_idx` ON `exam_attempts` (`owner_hash`,`application_id`,`attempt_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `exam_one_retake_idx` ON `exam_attempts` (`owner_hash`,`retake_of`);--> statement-breakpoint
CREATE TABLE `exam_commands` (
	`attempt_id` text NOT NULL,
	`request_id` text NOT NULL,
	`signature` text NOT NULL,
	`received_at` integer NOT NULL,
	PRIMARY KEY(`attempt_id`, `request_id`),
	FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exam_events` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt_id` text NOT NULL,
	`kind` text NOT NULL,
	`at` integer NOT NULL,
	`detail` text NOT NULL,
	FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `exam_events_attempt_idx` ON `exam_events` (`attempt_id`,`at`);--> statement-breakpoint
CREATE TABLE `exam_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `exam_sessions_expiry_idx` ON `exam_sessions` (`expires_at`);