CREATE TABLE `reelBookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reelId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reelBookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reelComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reelId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reelComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reelViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reelId` int NOT NULL,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reelViews_id` PRIMARY KEY(`id`)
);
