DROP TABLE "collaboration_requests" CASCADE;--> statement-breakpoint
DROP TABLE "maker_badges" CASCADE;--> statement-breakpoint
DROP TABLE "maker_collaborations" CASCADE;--> statement-breakpoint
DROP TABLE "maker_notifications" CASCADE;--> statement-breakpoint
DROP TABLE "maker_referral_codes" CASCADE;--> statement-breakpoint
DROP TABLE "maker_resource_progress" CASCADE;--> statement-breakpoint
DROP TABLE "maker_resources" CASCADE;--> statement-breakpoint
DROP TABLE "maker_stats" CASCADE;--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "nameEs";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "nameEn";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "nameFr";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "nameIt";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "namePt";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "descriptionEs";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "descriptionEn";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "descriptionFr";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "descriptionIt";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "descriptionPt";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "ingredientsJsonEs";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "ingredientsJsonEn";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "ingredientsJsonFr";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "ingredientsJsonIt";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "ingredientsJsonPt";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "instructionsJsonEs";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "instructionsJsonEn";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "instructionsJsonFr";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "instructionsJsonIt";--> statement-breakpoint
ALTER TABLE "recipes" DROP COLUMN "instructionsJsonPt";