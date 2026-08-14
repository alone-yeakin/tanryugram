CREATE TABLE `pushTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pushTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `pushTokens_token_unique` UNIQUE(`token`)
);
