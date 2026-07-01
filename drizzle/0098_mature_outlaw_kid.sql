CREATE TABLE "ai_chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" text DEFAULT 'Nueva conversación' NOT NULL,
	"messages" text DEFAULT '[]' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ai_chat_user_idx" ON "ai_chat_sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "ai_chat_updated_idx" ON "ai_chat_sessions" USING btree ("userId","updatedAt");