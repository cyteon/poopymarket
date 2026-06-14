ALTER TABLE "positions" ADD COLUMN "yes_spent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "positions" ADD COLUMN "no_spent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "positions" DROP COLUMN "total_spent";