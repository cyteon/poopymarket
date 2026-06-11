CREATE TABLE "markets" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"creator_id" integer NOT NULL,
	"b" integer DEFAULT 1000 NOT NULL,
	"q_yes" integer DEFAULT 0 NOT NULL,
	"q_no" integer DEFAULT 0 NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolution" text,
	"closes_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "balance" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "markets" ADD CONSTRAINT "markets_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;