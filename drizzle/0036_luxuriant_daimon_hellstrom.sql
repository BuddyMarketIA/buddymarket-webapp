ALTER TABLE "buddy_experts" ADD COLUMN "googleCalendarConnected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "buddy_experts" ADD COLUMN "googleCalendarAccessToken" text;--> statement-breakpoint
ALTER TABLE "buddy_experts" ADD COLUMN "googleCalendarRefreshToken" text;--> statement-breakpoint
ALTER TABLE "buddy_experts" ADD COLUMN "googleCalendarTokenExpiry" timestamp;--> statement-breakpoint
ALTER TABLE "buddy_experts" ADD COLUMN "googleCalendarEmail" varchar(256);--> statement-breakpoint
ALTER TABLE "expert_appointments" ADD COLUMN "googleMeetUrl" text;