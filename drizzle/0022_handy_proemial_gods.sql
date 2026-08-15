CREATE TABLE `storyReplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storyId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storyReplies_id` PRIMARY KEY(`id`)
);
