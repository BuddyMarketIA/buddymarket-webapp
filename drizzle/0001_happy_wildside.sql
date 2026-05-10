CREATE TYPE "public"."notificationType" AS ENUM('info', 'success', 'warning', 'error', 'promo', 'system');--> statement-breakpoint
ALTER TABLE "complements" ALTER COLUMN "category" SET DEFAULT 'dieta_equilibrada';--> statement-breakpoint
ALTER TABLE "in_app_notifications" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "in_app_notifications" ALTER COLUMN "type" SET DATA TYPE "public"."notificationType" USING "type"::text::"public"."notificationType";--> statement-breakpoint
ALTER TABLE "in_app_notifications" ALTER COLUMN "type" SET DEFAULT 'info';--> statement-breakpoint
ALTER TABLE "menu_complements" ALTER COLUMN "mealTime" SET DEFAULT 'cualquiera';--> statement-breakpoint
ALTER TABLE "menu_organizers" ALTER COLUMN "difficulty" SET DEFAULT 'easy';