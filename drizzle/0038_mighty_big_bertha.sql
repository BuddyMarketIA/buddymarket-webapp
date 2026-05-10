CREATE TABLE "food_substitutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"originalFood" varchar(256) NOT NULL,
	"originalAmount" varchar(64),
	"substitutes" text NOT NULL,
	"category" varchar(64) DEFAULT 'general',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"category" varchar(64) DEFAULT 'general',
	"targetCalories" integer,
	"weekData" text NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"patientUserId" integer NOT NULL,
	"expertPatientId" integer NOT NULL,
	"appointmentId" integer,
	"sessionDate" date NOT NULL,
	"summary" text NOT NULL,
	"agreements" text,
	"nextObjectives" text,
	"nextAppointmentDate" date,
	"patientWeight" real,
	"patientMood" integer,
	"adherenceScore" integer,
	"privateNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "fs_expert_idx" ON "food_substitutions" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "fs_food_idx" ON "food_substitutions" USING btree ("originalFood");--> statement-breakpoint
CREATE INDEX "mt_expert_idx" ON "menu_templates" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "mt_category_idx" ON "menu_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "sn_expert_idx" ON "session_notes" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "sn_patient_idx" ON "session_notes" USING btree ("patientUserId");--> statement-breakpoint
CREATE INDEX "sn_ep_idx" ON "session_notes" USING btree ("expertPatientId");--> statement-breakpoint
CREATE INDEX "sn_date_idx" ON "session_notes" USING btree ("sessionDate");