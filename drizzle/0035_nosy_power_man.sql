CREATE TABLE "expert_patient_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"patientUserId" integer NOT NULL,
	"expertPatientId" integer NOT NULL,
	"content" text NOT NULL,
	"noteType" varchar(32) DEFAULT 'general' NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"isPrivate" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "epn_expert_idx" ON "expert_patient_notes" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "epn_patient_idx" ON "expert_patient_notes" USING btree ("patientUserId");--> statement-breakpoint
CREATE INDEX "epn_ep_idx" ON "expert_patient_notes" USING btree ("expertPatientId");