CREATE TABLE `game_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` integer NOT NULL,
	`label` text NOT NULL,
	`points` integer DEFAULT 0 NOT NULL,
	`team` text DEFAULT 'rural' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `games` ADD `youtube_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `period` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `clock_seconds` integer DEFAULT 600 NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `clock_running` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `rural_fouls` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `opponent_fouls` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `rural_timeouts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `opponent_timeouts` integer DEFAULT 0 NOT NULL;