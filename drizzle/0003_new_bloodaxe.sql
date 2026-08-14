CREATE TABLE `privateOwnerFollowers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` int NOT NULL,
	`followerName` text NOT NULL,
	`followerHandle` varchar(64) NOT NULL,
	`avatarUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `privateOwnerFollowers_id` PRIMARY KEY(`id`)
);
