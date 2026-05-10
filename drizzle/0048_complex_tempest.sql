CREATE TABLE "llm_latency_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"procedure" varchar(100) DEFAULT 'unknown' NOT NULL,
	"latencyMs" integer NOT NULL,
	"success" boolean DEFAULT true NOT NULL,
	"finishReason" varchar(50),
	"totalTokens" integer,
	"errorMessage" text,
	"recordedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "lll_recorded_idx" ON "llm_latency_logs" USING btree ("recordedAt");--> statement-breakpoint
CREATE INDEX "lll_procedure_idx" ON "llm_latency_logs" USING btree ("procedure");