CREATE TABLE `games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`opponent` text NOT NULL,
	`game_date` text NOT NULL,
	`game_time` text DEFAULT '' NOT NULL,
	`location` text NOT NULL,
	`competition` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Confirmado' NOT NULL,
	`rural_score` integer DEFAULT 0 NOT NULL,
	`opponent_score` integer DEFAULT 0 NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
