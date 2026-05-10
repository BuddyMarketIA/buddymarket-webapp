ALTER TABLE "vetClinics" ADD COLUMN "city" varchar(64);--> statement-breakpoint
ALTER TABLE "vetClinics" ADD COLUMN "province" varchar(64);--> statement-breakpoint
ALTER TABLE "vetClinics" ADD COLUMN "licenseNumber" varchar(64);--> statement-breakpoint
ALTER TABLE "vetClinics" ADD COLUMN "specialtiesJson" text;--> statement-breakpoint
ALTER TABLE "vetClinics" ADD COLUMN "coverUrl" text;--> statement-breakpoint
ALTER TABLE "vetClinics" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;