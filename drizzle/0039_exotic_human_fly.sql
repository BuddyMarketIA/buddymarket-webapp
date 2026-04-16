CREATE TABLE "patient_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertPatientId" integer NOT NULL,
	"packageId" integer NOT NULL,
	"sessionsUsed" integer DEFAULT 0 NOT NULL,
	"sessionsTotal" integer NOT NULL,
	"stripePaymentId" varchar(256),
	"purchasedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "session_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"sessionsCount" integer NOT NULL,
	"price" real NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "patient_pkg_patient_idx" ON "patient_packages" USING btree ("expertPatientId");--> statement-breakpoint
CREATE INDEX "sp_expert_idx" ON "session_packages" USING btree ("expertId");