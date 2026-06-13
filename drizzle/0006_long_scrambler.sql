ALTER TABLE "shares" RENAME TO "positions";--> statement-breakpoint
ALTER TABLE "positions" DROP CONSTRAINT "shares_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "positions" DROP CONSTRAINT "shares_market_id_markets_id_fk";
--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;