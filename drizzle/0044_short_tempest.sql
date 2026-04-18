CREATE TABLE "expert_knowledge_pdfs" (
	"id" serial PRIMARY KEY NOT NULL,
	"expertId" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"pdfUrl" text NOT NULL,
	"pdfKey" text NOT NULL,
	"pdfFileName" varchar(256),
	"extractedContent" text,
	"tags" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ekp_expert_idx" ON "expert_knowledge_pdfs" USING btree ("expertId");--> statement-breakpoint
CREATE INDEX "ekp_active_idx" ON "expert_knowledge_pdfs" USING btree ("isActive");