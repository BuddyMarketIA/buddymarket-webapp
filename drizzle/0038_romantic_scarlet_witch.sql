ALTER TABLE `user_subscriptions` ADD `iapPlatform` enum('apple','google');--> statement-breakpoint
ALTER TABLE `user_subscriptions` ADD `iapOriginalTransactionId` varchar(256);--> statement-breakpoint
ALTER TABLE `user_subscriptions` ADD `iapTransactionId` varchar(256);--> statement-breakpoint
ALTER TABLE `user_subscriptions` ADD `iapProductId` varchar(128);--> statement-breakpoint
ALTER TABLE `user_subscriptions` ADD `iapEnvironment` enum('sandbox','production');--> statement-breakpoint
ALTER TABLE `user_subscriptions` ADD `iapExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `user_subscriptions` ADD `iapLastVerifiedAt` timestamp;