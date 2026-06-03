CREATE TABLE "offline_patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertUserId" integer NOT NULL,
	"buddyUserId" integer,
	"name" varchar(200) NOT NULL,
	"email" varchar(200),
	"phone" varchar(40),
	"birthDate" timestamp,
	"gender" varchar(20),
	"heightCm" integer,
	"initialWeightKg" real,
	"targetWeightKg" real,
	"activityLevel" varchar(50),
	"objective" varchar(100),
	"allergies" text,
	"pathologies" text,
	"medications" text,
	"notes" text,
	"consultationFrequencyWeeks" integer DEFAULT 2,
	"isActive" boolean DEFAULT true NOT NULL,
	"inviteSentAt" timestamp,
	"inviteAcceptedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_plans_sent" (
	"id" serial PRIMARY KEY NOT NULL,
	"patientId" integer NOT NULL,
	"expertUserId" integer NOT NULL,
	"channel" varchar(20) DEFAULT 'email' NOT NULL,
	"subject" varchar(300),
	"menuData" text,
	"weekStartDate" timestamp,
	"weekEndDate" timestamp,
	"sentAt" timestamp DEFAULT now() NOT NULL,
	"deliveredAt" timestamp,
	"openedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "patient_weight_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"patientId" integer NOT NULL,
	"expertUserId" integer NOT NULL,
	"weightKg" real NOT NULL,
	"bodyFatPct" real,
	"muscleMassPct" real,
	"waistCm" real,
	"hipCm" real,
	"notes" text,
	"recordedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "op_expert_idx" ON "offline_patients" USING btree ("expertUserId");--> statement-breakpoint
CREATE INDEX "op_email_idx" ON "offline_patients" USING btree ("email");--> statement-breakpoint
CREATE INDEX "pps_patient_idx" ON "patient_plans_sent" USING btree ("patientId");--> statement-breakpoint
CREATE INDEX "pps_expert_idx" ON "patient_plans_sent" USING btree ("expertUserId");--> statement-breakpoint
CREATE INDEX "pwh_patient_idx" ON "patient_weight_history" USING btree ("patientId");--> statement-breakpoint
CREATE INDEX "pwh_expert_idx" ON "patient_weight_history" USING btree ("expertUserId");