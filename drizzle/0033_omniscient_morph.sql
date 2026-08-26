CREATE TABLE `reelLikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reelId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reelLikes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reelPromotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reelId` int NOT NULL,
	`ownerId` int NOT NULL,
	`priority` int NOT NULL DEFAULT 1,
	`status` enum('active','paused','ended') NOT NULL DEFAULT 'active',
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reelPromotions_id` PRIMARY KEY(`id`)
);
