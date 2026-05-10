CREATE TABLE "expert_hire_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"patientUserId" integer NOT NULL,
	"expertId" integer NOT NULL,
	"servicePlanId" integer,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"message" text,
	"expertResponse" text,
	"expertPatientId" integer,
	"respondedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_service_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"price" real NOT NULL,
	"billingPeriod" varchar(32) DEFAULT 'monthly' NOT NULL,
	"durationMonths" integer,
	"includes" text,
	"maxConsultations" integer,
	"isActive" boolean DEFAULT true NOT NULL,
	"isPopular" boolean DEFAULT false NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ehr_patient_idx" ON "expert_hire_requests" USING btree ("patientUserId");--> statement-breakpoint
CREATE INDEX "ehr_expert_idx" ON "expert_hire_requests" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "ehr_status_idx" ON "expert_hire_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "esp_expert_idx" ON "expert_service_plans" USING btree ("expertId");