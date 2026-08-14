CREATE TABLE `calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`callerId` int NOT NULL,
	`receiverId` int NOT NULL,
	`callType` enum('audio','video') NOT NULL DEFAULT 'audio',
	`status` enum('pending','accepted','declined','missed','ended') NOT NULL DEFAULT 'pending',
	`roomId` varchar(128) NOT NULL,
	`durationSeconds` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	CONSTRAINT `calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messageReactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`emoji` varchar(8) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageReactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `messages` ADD `audioUrl` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `replyToId` int;--> statement-breakpoint
ALTER TABLE `messages` ADD `deletedForEveryone` boolean DEFAULT false NOT NULL;