CREATE TYPE "public"."eventMenuType" AS ENUM('cumpleanos', 'boda', 'aniversario', 'reunion_familiar', 'comida_negocios', 'picnic', 'cena_romantica', 'fiesta', 'otro');--> statement-breakpoint
CREATE TYPE "public"."specialMenuType" AS ENUM('dieta_especial', 'alergia', 'restriccion_religiosa', 'preferencia_cultural', 'condicion_medica', 'otro');--> statement-breakpoint
CREATE TABLE "eventMenus" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"eventType" "eventMenuType" NOT NULL,
	"eventDate" date NOT NULL,
	"guestCount" integer DEFAULT 1,
	"budget" numeric(10, 2),
	"difficulty" "difficulty" DEFAULT 'easy',
	"cuisineType" varchar(64),
	"coverImage" text,
	"menuJson" text,
	"shoppingListJson" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialMenus" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"menuType" "specialMenuType" NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"dailyCalories" integer,
	"persons" integer DEFAULT 1,
	"difficulty" "difficulty" DEFAULT 'easy',
	"coverImage" text,
	"menuJson" text,
	"notes" text,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "eventMenus" ADD CONSTRAINT "eventMenus_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialMenus" ADD CONSTRAINT "specialMenus_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_menus_user_idx" ON "eventMenus" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "event_menus_date_idx" ON "eventMenus" USING btree ("eventDate");--> statement-breakpoint
CREATE INDEX "event_menus_user_created_idx" ON "eventMenus" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "special_menus_user_idx" ON "specialMenus" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "special_menus_user_created_idx" ON "specialMenus" USING btree ("userId","createdAt");