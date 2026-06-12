ALTER TABLE "markets" ADD COLUMN "rules" text NOT NULL;--> statement-breakpoint
ALTER TABLE "markets" DROP COLUMN "closes_at";