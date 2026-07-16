CREATE TABLE `sumula_signatures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`game_id` integer NOT NULL,
	`role` text NOT NULL,
	`data_url` text NOT NULL,
	`signed_by` text DEFAULT '' NOT NULL,
	`signed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_by` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sumula_signatures_game_role` ON `sumula_signatures` (`game_id`,`role`);