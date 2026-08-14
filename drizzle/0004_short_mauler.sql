CREATE TABLE `groupMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(32) NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`creatorId` int NOT NULL,
	`avatarUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isLocked` boolean NOT NULL DEFAULT false,
	`lockPin` varchar(16),
	`isPrivate` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSettings_userId_unique` UNIQUE(`userId`)
);
