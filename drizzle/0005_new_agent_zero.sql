CREATE TABLE `storyViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storyId` int NOT NULL,
	`viewerId` int NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storyViews_id` PRIMARY KEY(`id`)
);
