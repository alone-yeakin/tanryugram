CREATE TABLE `badgeApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`requestedBadge` enum('blue','black') NOT NULL,
	`reason` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badgeApplications_id` PRIMARY KEY(`id`)
);

ALTER TABLE `users` ADD `badgeType` enum('none','blue','black') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `displayedFollowersCount` int;