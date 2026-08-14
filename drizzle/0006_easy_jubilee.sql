CREATE TABLE `postMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`mediaUrl` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `postMedia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `postReactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`reactionType` enum('like','love','haha','wow','sad','angry') NOT NULL DEFAULT 'like',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `postReactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `location` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `feeling` varchar(64);