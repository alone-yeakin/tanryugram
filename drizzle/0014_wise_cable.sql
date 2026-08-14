ALTER TABLE `groupMessages` MODIFY COLUMN `attachmentType` enum('image','video','audio','file','link') DEFAULT 'image';--> statement-breakpoint
ALTER TABLE `groupMessages` ADD `attachmentMimeType` varchar(160);--> statement-breakpoint
ALTER TABLE `groupMessages` ADD `attachmentSizeBytes` int;--> statement-breakpoint
ALTER TABLE `groupMessages` ADD `attachmentDurationSeconds` int;