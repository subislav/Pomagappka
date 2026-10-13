import { and, desc, eq } from "drizzle-orm";
import type { CreateEventUpdateBody } from "@pomagappka/shared";
import type { Database } from "../../db/client.js";
import { eventUpdates } from "../../db/schema/domain.js";
import { AppError } from "../../lib/errors.js";
import { findOwnedEvent } from "./event-service.js";
export async function listEventUpdates(db: Database, eventId: string) {
    const rows = await db
        .select()
        .from(eventUpdates)
        .where(eq(eventUpdates.eventId, eventId))
        .orderBy(desc(eventUpdates.createdAt));
    return rows.map((row) => ({
        id: row.id,
        imageUrl: row.imageUrl,
        caption: row.caption,
        createdAt: row.createdAt.toISOString(),
    }));
}
export async function listOrganizerEventUpdates(db: Database, organizerId: string, eventId: string) {
    await findOwnedEvent(db, organizerId, eventId);
    return listEventUpdates(db, eventId);
}
export async function createOrganizerEventUpdate(db: Database, organizerId: string, eventId: string, input: CreateEventUpdateBody) {
    await findOwnedEvent(db, organizerId, eventId);
    const [row] = await db
        .insert(eventUpdates)
        .values({
        eventId,
        imageUrl: input.imageUrl?.trim() ? input.imageUrl.trim() : null,
        caption: input.caption?.trim() ? input.caption.trim() : null,
    })
        .returning();
    if (!row) {
        throw new AppError(500, "CREATE_FAILED", "Nie udało się dodać aktualizacji.");
    }
    return {
        id: row.id,
        imageUrl: row.imageUrl,
        caption: row.caption,
        createdAt: row.createdAt.toISOString(),
    };
}
export async function deleteOrganizerEventUpdate(db: Database, organizerId: string, eventId: string, updateId: string) {
    await findOwnedEvent(db, organizerId, eventId);
    const deleted = await db
        .delete(eventUpdates)
        .where(and(eq(eventUpdates.id, updateId), eq(eventUpdates.eventId, eventId)))
        .returning({ id: eventUpdates.id });
    if (!deleted[0]) {
        throw new AppError(404, "NOT_FOUND", "Nie znaleziono aktualizacji.");
    }
}
