ALTER TABLE `user_subscriptions` ADD `manualPlan` enum('free','basic','premium','pro_max') DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `user_subscriptions` ADD `manualPlanNote` varchar(255);