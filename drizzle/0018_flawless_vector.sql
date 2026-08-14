CREATE TABLE `mediaUploadPolicy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photosEnabled` boolean NOT NULL DEFAULT true,
	`videosEnabled` boolean NOT NULL DEFAULT false,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mediaUploadPolicy_id` PRIMARY KEY(`id`)
);
