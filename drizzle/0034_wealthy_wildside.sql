CREATE TABLE "expert_menu_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"category" varchar(64) DEFAULT 'dieta_equilibrada' NOT NULL,
	"targetGoal" varchar(64),
	"dailyCalories" integer,
	"durationDays" integer DEFAULT 7 NOT NULL,
	"menuData" text NOT NULL,
	"restrictions" text,
	"allergensFree" text,
	"tags" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"timesAssigned" integer DEFAULT 0 NOT NULL,
	"sourceType" varchar(32) DEFAULT 'manual' NOT NULL,
	"sourcePdfUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdf_menu_imports" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"originalFilename" varchar(256) NOT NULL,
	"pdfUrl" text NOT NULL,
	"status" varchar(32) DEFAULT 'processing' NOT NULL,
	"extractedText" text,
	"parsedMenuData" text,
	"errorMessage" text,
	"templateId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "emt_expert_idx" ON "expert_menu_templates" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "emt_category_idx" ON "expert_menu_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "pmi_expert_idx" ON "pdf_menu_imports" USING btree ("expertId");