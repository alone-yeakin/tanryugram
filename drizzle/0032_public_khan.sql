ALTER TABLE `notifications` MODIFY COLUMN `type` enum('like','comment','follow','message','tip','subscribe','reel_approved','reel_rejected','appeal_approved','appeal_rejected') NOT NULL;--> statement-breakpoint
ALTER TABLE `reelSubmissions` ADD `processedMediaUrl` text;--> statement-breakpoint
ALTER TABLE `reelSubmissions` ADD `thumbnailUrl` text;--> statement-breakpoint
ALTER TABLE `reelSubmissions` ADD `processingStatus` enum('pending','ready','failed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `reelSubmissions` ADD `processingError` text;