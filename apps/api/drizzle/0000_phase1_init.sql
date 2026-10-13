CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "email_verified" boolean DEFAULT false NOT NULL,
  "image" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "user_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "token" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL,
  CONSTRAINT "session_token_unique" UNIQUE("token"),
  CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamptz,
  "refresh_token_expires_at" timestamptz,
  "scope" text,
  "password" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organizer_id" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "recipient_display_name" text NOT NULL,
  "people_count" integer NOT NULL,
  "starts_on" date NOT NULL,
  "ends_on" date NOT NULL,
  "dietary_preferences" text,
  "assistance_type" text DEFAULT 'meal' NOT NULL,
  "invitation_token" text NOT NULL,
  "pin_hash" text NOT NULL,
  "pin_version" integer DEFAULT 1 NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "events_organizer_id_user_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "user"("id") ON DELETE restrict ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "events_invitation_token_uidx" ON "events" ("invitation_token");
CREATE INDEX IF NOT EXISTS "events_organizer_status_idx" ON "events" ("organizer_id","status");
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events" ("status");

CREATE TABLE IF NOT EXISTS "meal_slots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL,
  "slot_date" date NOT NULL,
  "label" text,
  "assistance_type" text DEFAULT 'meal' NOT NULL,
  "status" text DEFAULT 'available' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "meal_slots_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "meal_slots_event_date_idx" ON "meal_slots" ("event_id","slot_date");

CREATE TABLE IF NOT EXISTS "bookings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slot_id" uuid NOT NULL,
  "event_id" uuid NOT NULL,
  "participant_name" text NOT NULL,
  "participant_email" text NOT NULL,
  "meal_description" text,
  "status" text DEFAULT 'active' NOT NULL,
  "idempotency_key" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "bookings_slot_id_meal_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "meal_slots"("id") ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "bookings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "bookings_one_active_per_slot_uidx" ON "bookings" ("slot_id") WHERE "status" = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_event_idempotency_uidx" ON "bookings" ("event_id","idempotency_key") WHERE "idempotency_key" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "bookings_event_idx" ON "bookings" ("event_id");

CREATE TABLE IF NOT EXISTS "event_access_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL,
  "session_token_hash" text NOT NULL,
  "pin_version" integer NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "revoked_at" timestamptz,
  CONSTRAINT "event_access_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_access_sessions_token_uidx" ON "event_access_sessions" ("session_token_hash");
CREATE INDEX IF NOT EXISTS "event_access_sessions_event_idx" ON "event_access_sessions" ("event_id");

CREATE TABLE IF NOT EXISTS "pin_verification_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid,
  "invitation_token_fingerprint" text NOT NULL,
  "ip_hash" text NOT NULL,
  "succeeded" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "pin_verification_attempts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "pin_attempts_ip_created_idx" ON "pin_verification_attempts" ("ip_hash","created_at");
CREATE INDEX IF NOT EXISTS "pin_attempts_event_created_idx" ON "pin_verification_attempts" ("event_id","created_at");

CREATE TABLE IF NOT EXISTS "booking_cancellation_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamptz,
  "used_at" timestamptz,
  "revoked_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "booking_cancellation_tokens_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "booking_cancellation_tokens_hash_uidx" ON "booking_cancellation_tokens" ("token_hash");
CREATE INDEX IF NOT EXISTS "booking_cancellation_tokens_booking_idx" ON "booking_cancellation_tokens" ("booking_id");

CREATE TABLE IF NOT EXISTS "notification_deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid,
  "event_id" uuid NOT NULL,
  "type" text NOT NULL,
  "recipient_email" text NOT NULL,
  "provider" text NOT NULL,
  "provider_message_id" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "idempotency_key" text NOT NULL,
  "error_message" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "notification_deliveries_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "notification_deliveries_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_deliveries_idempotency_uidx" ON "notification_deliveries" ("idempotency_key");
CREATE INDEX IF NOT EXISTS "notification_deliveries_event_idx" ON "notification_deliveries" ("event_id");
