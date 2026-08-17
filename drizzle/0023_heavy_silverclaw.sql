CREATE TABLE `recoverySupportMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`senderType` enum('guest','owner') NOT NULL DEFAULT 'guest',
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recoverySupportMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recoverySupportRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guestTokenHash` varchar(128) NOT NULL,
	`accountEmail` varchar(320),
	`guestLabel` varchar(80),
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`lastMessageAt` timestamp,
	CONSTRAINT `recoverySupportRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `recoverySupportRequests_guestTokenHash_unique` UNIQUE(`guestTokenHash`)
);
--> statement-breakpoint
CREATE TABLE `recoverySupportSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guestRecoveryEnabled` boolean NOT NULL DEFAULT false,
	`whatsappSupportEnabled` boolean NOT NULL DEFAULT false,
	`whatsappSupportNumber` varchar(32) NOT NULL DEFAULT '+8801404841981',
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recoverySupportSettings_id` PRIMARY KEY(`id`)
);
