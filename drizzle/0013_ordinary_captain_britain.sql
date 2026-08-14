CREATE TABLE `groupAuditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`actorId` int NOT NULL,
	`targetUserId` int,
	`type` varchar(64) NOT NULL,
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupAuditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupEventRsvps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('going','maybe','cant_go') NOT NULL DEFAULT 'going',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groupEventRsvps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`creatorId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text,
	`location` varchar(280),
	`imageUrl` text,
	`startsAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupJoinRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `groupJoinRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupPollOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pollId` int NOT NULL,
	`label` varchar(280) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `groupPollOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupPollVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pollId` int NOT NULL,
	`optionId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupPollVotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupPolls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`creatorId` int NOT NULL,
	`question` text NOT NULL,
	`allowsMultiple` boolean NOT NULL DEFAULT false,
	`closesAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupPolls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `groupMessages` ADD `messageType` enum('message','system','poll','event') DEFAULT 'message' NOT NULL;--> statement-breakpoint
ALTER TABLE `groupMessages` ADD `mediaUrl` text;--> statement-breakpoint
ALTER TABLE `groupMessages` ADD `attachmentType` enum('image','file','link') DEFAULT 'image';--> statement-breakpoint
ALTER TABLE `groupMessages` ADD `attachmentName` varchar(255);--> statement-breakpoint
ALTER TABLE `groupMessages` ADD `isPinned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `groups` ADD `description` text;--> statement-breakpoint
ALTER TABLE `groups` ADD `visibility` enum('public','private') DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE `groups` ADD `joinMode` enum('open','approval','invite') DEFAULT 'invite' NOT NULL;--> statement-breakpoint
ALTER TABLE `groups` ADD `postingMode` enum('all','admins') DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE `groups` ADD `pinnedMessageId` int;--> statement-breakpoint
ALTER TABLE `groups` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;