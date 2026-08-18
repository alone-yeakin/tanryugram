CREATE TABLE `groupInviteRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`inviterId` int NOT NULL,
	`inviteeId` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`reviewedBy` int,
	CONSTRAINT `groupInviteRequests_id` PRIMARY KEY(`id`)
);
