ALTER TABLE "events" ADD COLUMN "drop_off_address" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "recipient_phone" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "preferred_delivery_time" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "special_instructions" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "favorite_meals" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "least_favorite_meals" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "allergies" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "photo_caption" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "grocery_list" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "grocery_categories" jsonb;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "budget_hint" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "store_preference" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "dietary_or_allergy_notes" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "delivery_or_pickup_notes" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "booked_on_behalf" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE TABLE "event_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"image_url" text,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_updates" ADD CONSTRAINT "event_updates_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_updates_event_created_idx" ON "event_updates" USING btree ("event_id","created_at");
