ALTER TABLE "sessions" ADD COLUMN "ip" text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "user_agent" text DEFAULT 'unknown' NOT NULL;