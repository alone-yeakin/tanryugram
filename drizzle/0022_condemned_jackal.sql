CREATE TABLE `emailDeliverySettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailDeliveryEnabled` boolean NOT NULL DEFAULT true,
	`signupVerificationEnabled` boolean NOT NULL DEFAULT false,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailDeliverySettings_id` PRIMARY KEY(`id`)
);
