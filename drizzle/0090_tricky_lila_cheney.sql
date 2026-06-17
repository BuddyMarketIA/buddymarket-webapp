CREATE TABLE "offline_patient_privacy" (
	"id" serial PRIMARY KEY NOT NULL,
	"offlinePatientId" integer NOT NULL,
	"expertUserId" integer NOT NULL,
	"showWeight" boolean DEFAULT true NOT NULL,
	"showBodyFat" boolean DEFAULT true NOT NULL,
	"showMeasurements" boolean DEFAULT true NOT NULL,
	"showPathologies" boolean DEFAULT false NOT NULL,
	"showMedications" boolean DEFAULT false NOT NULL,
	"showExpertNotes" boolean DEFAULT false NOT NULL,
	"showSessionNotes" boolean DEFAULT false NOT NULL,
	"showInternalAssessment" boolean DEFAULT false NOT NULL,
	"showAssignedMenus" boolean DEFAULT true NOT NULL,
	"showPlanHistory" boolean DEFAULT true NOT NULL,
	"showAppointmentHistory" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expert_patients" ADD COLUMN "inviteExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "offline_patients" ADD COLUMN "inviteToken" varchar(64);--> statement-breakpoint
ALTER TABLE "offline_patients" ADD COLUMN "inviteExpiresAt" timestamp;--> statement-breakpoint
CREATE INDEX "opp_patient_idx" ON "offline_patient_privacy" USING btree ("offlinePatientId");--> statement-breakpoint
CREATE INDEX "opp_expert_idx" ON "offline_patient_privacy" USING btree ("expertUserId");--> statement-breakpoint
CREATE UNIQUE INDEX "opp_unique_patient" ON "offline_patient_privacy" USING btree ("offlinePatientId");--> statement-breakpoint
CREATE INDEX "op_token_idx" ON "offline_patients" USING btree ("inviteToken");