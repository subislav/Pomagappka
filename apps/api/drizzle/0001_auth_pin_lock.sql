ALTER TABLE "pin_verification_attempts" ADD COLUMN "pin_version" integer;
--> statement-breakpoint
CREATE INDEX "pin_attempts_event_ip_version_idx" ON "pin_verification_attempts" USING btree ("event_id","ip_hash","pin_version");
