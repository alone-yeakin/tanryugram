CREATE TABLE `contentReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`targetType` enum('account','post','video','reel') NOT NULL,
	`targetId` int NOT NULL,
	`reason` enum('pornography','child_abuse','dangerous','harassment','spam','other') NOT NULL,
	`details` text,
	`status` enum('auto_hidden','pending','reviewed','dismissed') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userMediaPermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postsEnabled` boolean NOT NULL DEFAULT true,
	`photosEnabled` boolean NOT NULL DEFAULT true,
	`videosEnabled` boolean NOT NULL DEFAULT false,
	`reelsEnabled` boolean NOT NULL DEFAULT false,
	`storiesEnabled` boolean NOT NULL DEFAULT true,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userMediaPermissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `userMediaPermissions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `isHidden` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `contentHidden` boolean DEFAULT false NOT NULL;