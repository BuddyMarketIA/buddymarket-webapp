ALTER TABLE "buddy_experts" ADD COLUMN "chargesEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "buddy_experts" ADD COLUMN "payoutsEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "buddy_makers" ADD COLUMN "chargesEnabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "buddy_makers" ADD COLUMN "payoutsEnabled" boolean DEFAULT false NOT NULL;