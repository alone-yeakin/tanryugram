CREATE TABLE `badgeApplicationAudit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`actorId` int NOT NULL,
	`action` varchar(32) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badgeApplicationAudit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `badgeMarketplaceSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`badgeType` enum('blue','black','gold','vip','founder','legend') NOT NULL,
	`isPaid` boolean NOT NULL DEFAULT false,
	`price` decimal(10,2) NOT NULL DEFAULT '0.00',
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `badgeMarketplaceSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `badgeMarketplaceSettings_badgeType_unique` UNIQUE(`badgeType`)
);
--> statement-breakpoint
CREATE TABLE `platformPaymentSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paypalEmail` varchar(320),
	`bkashNumber` varchar(32),
	`nagadNumber` varchar(32),
	`instructions` text,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformPaymentSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventTheme` varchar(32),
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storyReplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storyId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storyReplies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userBadges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeType` enum('blue','black','gold','vip','founder','legend') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userBadges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `badgeApplications` MODIFY COLUMN `requestedBadge` enum('blue','black','gold','vip','founder','legend') NOT NULL;--> statement-breakpoint
ALTER TABLE `calls` MODIFY COLUMN `roomId` varchar(128);--> statement-breakpoint
ALTER TABLE `followRequests` MODIFY COLUMN `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `groupEventRsvps` MODIFY COLUMN `status` enum('going','maybe','declined') NOT NULL;--> statement-breakpoint
ALTER TABLE `groupEvents` MODIFY COLUMN `location` varchar(255);--> statement-breakpoint
ALTER TABLE `groupMessages` MODIFY COLUMN `attachmentType` enum('image','video','file','audio','link');--> statement-breakpoint
ALTER TABLE `groupMessages` MODIFY COLUMN `attachmentMimeType` varchar(128);--> statement-breakpoint
ALTER TABLE `userSettings` MODIFY COLUMN `gender` enum('woman','man','non_binary','prefer_not_to_say');--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `badgeType` enum('none','blue','black','gold','vip','founder','legend') NOT NULL DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `followRequests` ADD `followerId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `followRequests` ADD `followingId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `groupAuditEvents` ADD `action` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `groupAuditEvents` ADD `details` text;--> statement-breakpoint
ALTER TABLE `groupEventRsvps` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `groupEvents` ADD `title` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `groupEvents` ADD `endsAt` timestamp;--> statement-breakpoint
ALTER TABLE `groupMessages` ADD `attachmentUrl` text;--> statement-breakpoint
ALTER TABLE `groupPollOptions` ADD `optionText` text NOT NULL;--> statement-breakpoint
ALTER TABLE `groupPolls` ADD `isMultipleChoice` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `groupPolls` ADD `expiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `messageReactions` ADD `reaction` varchar(16) NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentUrl` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `attachmentType` enum('image','video','file','audio','link');--> statement-breakpoint
ALTER TABLE `privateOwnerFollowers` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `privateOwnerFollowers` ADD `followerCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `privateOwnerFollowers` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `storyViews` ADD `userId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `storyViews` ADD `createdAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `showFollowersList` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `showFollowingList` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `eventTheme` varchar(32);--> statement-breakpoint
ALTER TABLE `userSettings` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` ADD `secondaryBadgeType` enum('none','black','gold','vip','founder','legend') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `themeColor` varchar(7) DEFAULT '#7c3aed' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `profileBannerUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `customTextColor` varchar(7);--> statement-breakpoint
ALTER TABLE `users` ADD `profileEffect` varchar(32);--> statement-breakpoint
ALTER TABLE `privateOwnerFollowers` ADD CONSTRAINT `privateOwnerFollowers_userId_unique` UNIQUE(`userId`);--> statement-breakpoint
ALTER TABLE `followRequests` DROP COLUMN `requesterId`;--> statement-breakpoint
ALTER TABLE `followRequests` DROP COLUMN `targetUserId`;--> statement-breakpoint
ALTER TABLE `followRequests` DROP COLUMN `updatedAt`;--> statement-breakpoint
ALTER TABLE `groupAuditEvents` DROP COLUMN `targetUserId`;--> statement-breakpoint
ALTER TABLE `groupAuditEvents` DROP COLUMN `type`;--> statement-breakpoint
ALTER TABLE `groupAuditEvents` DROP COLUMN `detail`;--> statement-breakpoint
ALTER TABLE `groupEventRsvps` DROP COLUMN `updatedAt`;--> statement-breakpoint
ALTER TABLE `groupEvents` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `groupEvents` DROP COLUMN `imageUrl`;--> statement-breakpoint
ALTER TABLE `groupInviteRequests` DROP COLUMN `reviewedAt`;--> statement-breakpoint
ALTER TABLE `groupInviteRequests` DROP COLUMN `reviewedBy`;--> statement-breakpoint
ALTER TABLE `groupJoinRequests` DROP COLUMN `reviewedAt`;--> statement-breakpoint
ALTER TABLE `groupMessages` DROP COLUMN `mediaUrl`;--> statement-breakpoint
ALTER TABLE `groupPollOptions` DROP COLUMN `label`;--> statement-breakpoint
ALTER TABLE `groupPollOptions` DROP COLUMN `sortOrder`;--> statement-breakpoint
ALTER TABLE `groupPolls` DROP COLUMN `allowsMultiple`;--> statement-breakpoint
ALTER TABLE `groupPolls` DROP COLUMN `closesAt`;--> statement-breakpoint
ALTER TABLE `messageReactions` DROP COLUMN `emoji`;--> statement-breakpoint
ALTER TABLE `messageReactions` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `audioUrl`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `deletedForEveryone`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `deliveryStatus`;--> statement-breakpoint
ALTER TABLE `privateOwnerFollowers` DROP COLUMN `ownerUserId`;--> statement-breakpoint
ALTER TABLE `privateOwnerFollowers` DROP COLUMN `followerName`;--> statement-breakpoint
ALTER TABLE `privateOwnerFollowers` DROP COLUMN `followerHandle`;--> statement-breakpoint
ALTER TABLE `privateOwnerFollowers` DROP COLUMN `avatarUrl`;--> statement-breakpoint
ALTER TABLE `privateOwnerFollowers` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `storyViews` DROP COLUMN `viewerId`;--> statement-breakpoint
ALTER TABLE `storyViews` DROP COLUMN `viewedAt`;--> statement-breakpoint
ALTER TABLE `userSettings` DROP COLUMN `isLocked`;--> statement-breakpoint
ALTER TABLE `userSettings` DROP COLUMN `lockPin`;--> statement-breakpoint
ALTER TABLE `userSettings` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `showFollowersList`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `showFollowingList`;