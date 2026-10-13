import { sql } from "drizzle-orm";
import { boolean, date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, } from "drizzle-orm/pg-core";
import { user } from "./auth.js";
export const events = pgTable("events", {
    id: uuid("id").defaultRandom().primaryKey(),
    organizerId: text("organizer_id")
        .notNull()
        .references(() => user.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description"),
    recipientDisplayName: text("recipient_display_name").notNull(),
    peopleCount: integer("people_count").notNull(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    dietaryPreferences: text("dietary_preferences"),
    dropOffAddress: text("drop_off_address"),
    recipientPhone: text("recipient_phone"),
    preferredDeliveryTime: text("preferred_delivery_time"),
    specialInstructions: text("special_instructions"),
    favoriteMeals: text("favorite_meals"),
    leastFavoriteMeals: text("least_favorite_meals"),
    allergies: text("allergies"),
    photoUrl: text("photo_url"),
    photoCaption: text("photo_caption"),
    groceryList: text("grocery_list"),
    groceryCategories: jsonb("grocery_categories").$type<string[] | null>(),
    budgetHint: text("budget_hint"),
    storePreference: text("store_preference"),
    dietaryOrAllergyNotes: text("dietary_or_allergy_notes"),
    deliveryOrPickupNotes: text("delivery_or_pickup_notes"),
    assistanceType: text("assistance_type").notNull().default("meal"),
    invitationToken: text("invitation_token").notNull(),
    pinHash: text("pin_hash").notNull(),
    pinVersion: integer("pin_version").notNull().default(1),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [
    uniqueIndex("events_invitation_token_uidx").on(table.invitationToken),
    index("events_organizer_status_idx").on(table.organizerId, table.status),
    index("events_status_idx").on(table.status),
]);
export const mealSlots = pgTable("meal_slots", {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
        .notNull()
        .references(() => events.id, { onDelete: "cascade" }),
    slotDate: date("slot_date").notNull(),
    label: text("label"),
    assistanceType: text("assistance_type").notNull().default("meal"),
    status: text("status").notNull().default("available"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [
    index("meal_slots_event_date_idx").on(table.eventId, table.slotDate),
]);
export const bookings = pgTable("bookings", {
    id: uuid("id").defaultRandom().primaryKey(),
    slotId: uuid("slot_id")
        .notNull()
        .references(() => mealSlots.id, { onDelete: "restrict" }),
    eventId: uuid("event_id")
        .notNull()
        .references(() => events.id, { onDelete: "cascade" }),
    participantName: text("participant_name").notNull(),
    participantEmail: text("participant_email").notNull(),
    mealDescription: text("meal_description"),
    bookedOnBehalf: boolean("booked_on_behalf").notNull().default(false),
    status: text("status").notNull().default("active"),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [
    uniqueIndex("bookings_one_active_per_slot_uidx")
        .on(table.slotId)
        .where(sql `${table.status} = 'active'`),
    uniqueIndex("bookings_event_idempotency_uidx")
        .on(table.eventId, table.idempotencyKey)
        .where(sql `${table.idempotencyKey} IS NOT NULL`),
    index("bookings_event_idx").on(table.eventId),
]);
export const eventUpdates = pgTable("event_updates", {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
        .notNull()
        .references(() => events.id, { onDelete: "cascade" }),
    imageUrl: text("image_url"),
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [
    index("event_updates_event_created_idx").on(table.eventId, table.createdAt),
]);
export const eventAccessSessions = pgTable("event_access_sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
        .notNull()
        .references(() => events.id, { onDelete: "cascade" }),
    sessionTokenHash: text("session_token_hash").notNull(),
    pinVersion: integer("pin_version").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, (table) => [
    uniqueIndex("event_access_sessions_token_uidx").on(table.sessionTokenHash),
    index("event_access_sessions_event_idx").on(table.eventId),
]);
export const pinVerificationAttempts = pgTable("pin_verification_attempts", {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").references(() => events.id, {
        onDelete: "cascade",
    }),
    pinVersion: integer("pin_version"),
    invitationTokenFingerprint: text("invitation_token_fingerprint").notNull(),
    ipHash: text("ip_hash").notNull(),
    succeeded: boolean("succeeded").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [
    index("pin_attempts_ip_created_idx").on(table.ipHash, table.createdAt),
    index("pin_attempts_event_created_idx").on(table.eventId, table.createdAt),
    index("pin_attempts_event_ip_version_idx").on(table.eventId, table.ipHash, table.pinVersion),
]);
export const bookingCancellationTokens = pgTable("booking_cancellation_tokens", {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
        .notNull()
        .references(() => bookings.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    usedAt: timestamp("used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [
    uniqueIndex("booking_cancellation_tokens_hash_uidx").on(table.tokenHash),
    index("booking_cancellation_tokens_booking_idx").on(table.bookingId),
]);
export const notificationDeliveries = pgTable("notification_deliveries", {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id").references(() => bookings.id, {
        onDelete: "set null",
    }),
    eventId: uuid("event_id")
        .notNull()
        .references(() => events.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    recipientEmail: text("recipient_email").notNull(),
    provider: text("provider").notNull(),
    providerMessageId: text("provider_message_id"),
    status: text("status").notNull().default("pending"),
    idempotencyKey: text("idempotency_key").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
}, (table) => [
    uniqueIndex("notification_deliveries_idempotency_uidx").on(table.idempotencyKey),
    index("notification_deliveries_event_idx").on(table.eventId),
]);
