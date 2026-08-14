CREATE TABLE `messageHidden` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`hiddenAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messageHidden_id` PRIMARY KEY(`id`)
);
