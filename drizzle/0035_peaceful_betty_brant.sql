CREATE TABLE `dailyReelAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reelId` int NOT NULL,
	`date` timestamp NOT NULL,
	`views` int NOT NULL DEFAULT 0,
	`likes` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyReelAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reelCommentLikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reelCommentLikes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reelComments` ADD `parentId` int;