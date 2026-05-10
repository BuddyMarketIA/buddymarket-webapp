CREATE TABLE "bloodTests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"fileUrl" text,
	"testDate" timestamp,
	"labName" text,
	"extractedValuesJson" text,
	"analysisJson" text,
	"recommendationsJson" text,
	"menuAdjustmentsJson" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fridgeScans" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"imageUrl" text NOT NULL,
	"detectedIngredientsJson" text,
	"editedIngredientsJson" text,
	"suggestedMenuJson" text,
	"savedAsMenuId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bt_user_idx" ON "bloodTests" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "fs_user_idx" ON "fridgeScans" USING btree ("userId");