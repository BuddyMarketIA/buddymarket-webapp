CREATE TYPE "public"."petSpecies" AS ENUM('dog', 'cat', 'rabbit', 'bird', 'hamster', 'guinea_pig', 'fish', 'turtle', 'ferret', 'other');--> statement-breakpoint
CREATE TYPE "public"."petWeightUnit" AS ENUM('kg', 'lb');--> statement-breakpoint
CREATE TABLE "petMenus" (
	"id" serial PRIMARY KEY NOT NULL,
	"petId" integer NOT NULL,
	"userId" integer NOT NULL,
	"weekLabel" varchar(50),
	"menuJson" text NOT NULL,
	"shoppingListJson" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"species" "petSpecies" NOT NULL,
	"breed" varchar(150),
	"weightValue" real NOT NULL,
	"weightUnit" "petWeightUnit" DEFAULT 'kg' NOT NULL,
	"ageYears" integer,
	"ageMonths" integer,
	"gender" varchar(10),
	"neutered" boolean DEFAULT false,
	"healthNotes" text,
	"avatarEmoji" varchar(10),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pm_pet_idx" ON "petMenus" USING btree ("petId");--> statement-breakpoint
CREATE INDEX "pm_user_idx" ON "petMenus" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "pet_user_idx" ON "pets" USING btree ("userId");