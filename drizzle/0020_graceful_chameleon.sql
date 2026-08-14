ALTER TABLE `users` ADD `badgeLabel` varchar(32) DEFAULT 'User' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `showBadge` boolean DEFAULT true NOT NULL;