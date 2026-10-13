import { and, desc, eq, ne } from "drizzle-orm";
import type { CreateEventBody, UpdateEventBody, } from "@pomagappka/shared";
import type { Env } from "../../config/env.js";
import type { Database } from "../../db/client.js";
import { events } from "../../db/schema/domain.js";
import { AppError } from "../../lib/errors.js";
import { generateFourDigitPin, generateInvitationToken, hashPin, } from "../../lib/crypto.js";
import { toOrganizerEvent, toOrganizerEventListItem, } from "./mappers.js";
import { revokeEventAccessSessions } from "./access-session.js";
export async function listOrganizerEvents(db: Database, organizerId: string) {
    const rows = await db
        .select()
        .from(events)
        .where(and(eq(events.organizerId, organizerId), ne(events.status, "deleted")))
        .orderBy(desc(events.createdAt));
    return rows.map(toOrganizerEventListItem);
}
export async function getOrganizerEvent(db: Database, env: Env, organizerId: string, eventId: string) {
    const row = await findOwnedEvent(db, organizerId, eventId);
    return toOrganizerEvent(row, env.APP_URL);
}
export async function createOrganizerEvent(db: Database, env: Env, organizerId: string, input: CreateEventBody) {
    const pin = generateFourDigitPin();
    const pinHash = await hashPin(pin);
    const invitationToken = generateInvitationToken();
    const [row] = await db
        .insert(events)
        .values({
        organizerId,
        title: input.title,
        description: input.description ?? null,
        recipientDisplayName: input.recipientDisplayName,
        peopleCount: input.peopleCount,
        startsOn: input.startsOn,
        endsOn: input.endsOn,
        dietaryPreferences: input.dietaryPreferences ?? null,
        assistanceType: input.assistanceType ?? "meal",
        invitationToken,
        pinHash,
        pinVersion: 1,
        status: "open",
    })
        .returning();
    if (!row) {
        throw new AppError(500, "CREATE_FAILED", "Nie udało się utworzyć wydarzenia.");
    }
    return {
        event: toOrganizerEvent(row, env.APP_URL),
        pin,
    };
}
export async function updateOrganizerEvent(db: Database, env: Env, organizerId: string, eventId: string, input: UpdateEventBody) {
    const existing = await findOwnedEvent(db, organizerId, eventId);
    if (existing.status === "deleted") {
        throw new AppError(404, "NOT_FOUND", "Nie znaleziono wydarzenia.");
    }
    const startsOn = input.startsOn ?? existing.startsOn;
    const endsOn = input.endsOn ?? existing.endsOn;
    if (endsOn < startsOn) {
        throw new AppError(400, "VALIDATION_ERROR", "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.");
    }
    const [row] = await db
        .update(events)
        .set({
        title: input.title ?? existing.title,
        description: input.description === undefined
            ? existing.description
            : input.description,
        recipientDisplayName: input.recipientDisplayName ?? existing.recipientDisplayName,
        peopleCount: input.peopleCount ?? existing.peopleCount,
        startsOn,
        endsOn,
        dietaryPreferences: input.dietaryPreferences === undefined
            ? existing.dietaryPreferences
            : input.dietaryPreferences,
        updatedAt: new Date(),
    })
        .where(eq(events.id, eventId))
        .returning();
    if (!row) {
        throw new AppError(404, "NOT_FOUND", "Nie znaleziono wydarzenia.");
    }
    return toOrganizerEvent(row, env.APP_URL);
}
export async function closeOrganizerEvent(db: Database, env: Env, organizerId: string, eventId: string) {
    const existing = await findOwnedEvent(db, organizerId, eventId);
    if (existing.status === "deleted") {
        throw new AppError(404, "NOT_FOUND", "Nie znaleziono wydarzenia.");
    }
    const [row] = await db
        .update(events)
        .set({ status: "closed", updatedAt: new Date() })
        .where(eq(events.id, eventId))
        .returning();
    if (!row) {
        throw new AppError(404, "NOT_FOUND", "Nie znaleziono wydarzenia.");
    }
    return toOrganizerEvent(row, env.APP_URL);
}
export async function softDeleteOrganizerEvent(db: Database, organizerId: string, eventId: string) {
    await findOwnedEvent(db, organizerId, eventId);
    await db
        .update(events)
        .set({ status: "deleted", updatedAt: new Date() })
        .where(eq(events.id, eventId));
}
export async function regenerateOrganizerPin(db: Database, organizerId: string, eventId: string) {
    const existing = await findOwnedEvent(db, organizerId, eventId);
    if (existing.status === "deleted") {
        throw new AppError(404, "NOT_FOUND", "Nie znaleziono wydarzenia.");
    }
    const pin = generateFourDigitPin();
    const pinHash = await hashPin(pin);
    const nextVersion = existing.pinVersion + 1;
    const [row] = await db
        .update(events)
        .set({
        pinHash,
        pinVersion: nextVersion,
        updatedAt: new Date(),
    })
        .where(eq(events.id, eventId))
        .returning();
    if (!row) {
        throw new AppError(404, "NOT_FOUND", "Nie znaleziono wydarzenia.");
    }
    await revokeEventAccessSessions(db, eventId);
    return { pin, pinVersion: row.pinVersion };
}
export async function findEventByInvitationToken(db: Database, invitationToken: string) {
    const [row] = await db
        .select()
        .from(events)
        .where(eq(events.invitationToken, invitationToken))
        .limit(1);
    return row ?? null;
}
export async function findOwnedEvent(db: Database, organizerId: string, eventId: string) {
    const [row] = await db
        .select()
        .from(events)
        .where(and(eq(events.id, eventId), eq(events.organizerId, organizerId)))
        .limit(1);
    if (!row || row.status === "deleted") {
        throw new AppError(404, "NOT_FOUND", "Nie znaleziono wydarzenia.");
    }
    return row;
}
