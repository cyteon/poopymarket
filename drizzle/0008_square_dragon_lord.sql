ALTER TABLE "positions" ALTER COLUMN "yes_shares" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "positions" ALTER COLUMN "no_shares" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "prob_after" SET DATA TYPE double precision;