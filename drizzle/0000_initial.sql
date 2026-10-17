CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_backups` (
	`user_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`uploaded_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_api_keys` (
	`user_id` text PRIMARY KEY NOT NULL,
	`tmdb_api_key` text,
	`omdb_api_key` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `imported_ratings` (
	`user_id` text NOT NULL,
	`imdb_id` text NOT NULL,
	`tmdb_id` integer,
	`title` text NOT NULL,
	`original_title` text,
	`your_rating` real,
	`imdb_rating` real,
	`imdb_votes` integer,
	`genres` text,
	`directors` text,
	`year` integer,
	`runtime` integer,
	`title_type` text,
	`date_rated` text,
	`url` text,
	PRIMARY KEY(`user_id`, `imdb_id`)
);
--> statement-breakpoint
CREATE TABLE `swipe_actions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`tmdb_id` integer NOT NULL,
	`imdb_id` text,
	`title` text NOT NULL,
	`action` text NOT NULL,
	`match_score` real,
	`payload` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `movie_cache` (
	`tmdb_id` integer PRIMARY KEY NOT NULL,
	`imdb_id` text,
	`payload` text NOT NULL,
	`imdb_rating` real,
	`imdb_votes` text,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `taste_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`genres` text NOT NULL,
	`directors` text NOT NULL,
	`cast` text NOT NULL,
	`decades` text NOT NULL,
	`avg_runtime` real NOT NULL,
	`title_type_bias` text NOT NULL,
	`genre_penalties` text NOT NULL,
	`updated_at` integer NOT NULL
);
