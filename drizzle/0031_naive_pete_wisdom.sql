CREATE TABLE `contentAppeals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appellantId` int NOT NULL,
	`targetType` enum('account','post','video','reel') NOT NULL,
	`targetId` int NOT NULL,
	`reason` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`response` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentAppeals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentReportRateLimits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`windowStartedAt` timestamp NOT NULL,
	`reportCount` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentReportRateLimits_id` PRIMARY KEY(`id`),
	CONSTRAINT `contentReportRateLimits_reporterId_unique` UNIQUE(`reporterId`)
);
--> statement-breakpoint
CREATE TABLE `moderationAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int,
	`action` varchar(64) NOT NULL,
	`targetType` varchar(32) NOT NULL,
	`targetId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderationAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reelSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mediaUrl` text NOT NULL,
	`caption` text,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`durationSeconds` int,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewNote` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reelSubmissions_id` PRIMARY KEY(`id`)
);
