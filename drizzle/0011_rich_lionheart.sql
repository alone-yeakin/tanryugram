CREATE TABLE `conversationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`peerId` int NOT NULL,
	`isPinned` boolean NOT NULL DEFAULT false,
	`isArchived` boolean NOT NULL DEFAULT false,
	`isMuted` boolean NOT NULL DEFAULT false,
	`themeColor` varchar(32) NOT NULL DEFAULT '#8b5cf6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversationSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `typingStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`peerId` int NOT NULL,
	`groupId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `typingStatus_id` PRIMARY KEY(`id`)
);
