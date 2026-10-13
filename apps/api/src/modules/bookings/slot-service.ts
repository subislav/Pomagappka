import { and, asc, eq, inArray } from "drizzle-orm";
import type { PutSlotsBody } from "@pomagappka/shared";
import type { Database } from "../../db/client.js";
import { bookings, mealSlots } from "../../db/schema/domain.js";
import { AppError } from "../../lib/errors.js";
import { findOwnedEvent } from "../events/event-service.js";
export async function listOrganizerSlots(db: Database, organizerId: string, eventId: string) {
    await findOwnedEvent(db, organizerId, eventId);
    return listSlotsWithBookingFlag(db, eventId, { includeCancelled: true });
}
export async function putOrganizerSlots(db: Database, organizerId: string, eventId: string, input: PutSlotsBody) {
    const event = await findOwnedEvent(db, organizerId, eventId);
    const uniqueDates = [...new Set(input.dates)].sort();
    for (const date of uniqueDates) {
        if (date < event.startsOn || date > event.endsOn) {
            throw new AppError(400, "VALIDATION_ERROR", "Termin musi mieścić się w zakresie dat wydarzenia.");
        }
    }
    const existing = await db
        .select()
        .from(mealSlots)
        .where(eq(mealSlots.eventId, eventId));
    const activeBookings = await db
        .select({ slotId: bookings.slotId })
        .from(bookings)
        .where(and(eq(bookings.eventId, eventId), eq(bookings.status, "active")));
    const bookedSlotIds = new Set(activeBookings.map((b) => b.slotId));
    const desired = new Set(uniqueDates);
    const label = input.label ?? null;
    for (const slot of existing) {
        if (desired.has(slot.slotDate)) {
            if (slot.status === "cancelled") {
                await db
                    .update(mealSlots)
                    .set({ status: "available", label, updatedAt: new Date() })
                    .where(eq(mealSlots.id, slot.id));
            }
            else if (slot.label !== label) {
                await db
                    .update(mealSlots)
                    .set({ label, updatedAt: new Date() })
                    .where(eq(mealSlots.id, slot.id));
            }
            desired.delete(slot.slotDate);
            continue;
        }
        if (bookedSlotIds.has(slot.id)) {
            throw new AppError(409, "SLOT_HAS_BOOKING", "Nie można usunąć terminu z aktywną rezerwacją.");
        }
        if (slot.status !== "cancelled") {
            await db
                .update(mealSlots)
                .set({ status: "cancelled", updatedAt: new Date() })
                .where(eq(mealSlots.id, slot.id));
        }
    }
    for (const date of desired) {
        await db.insert(mealSlots).values({
            eventId,
            slotDate: date,
            label,
            assistanceType: event.assistanceType,
            status: "available",
        });
    }
    return listSlotsWithBookingFlag(db, eventId, { includeCancelled: true });
}
export async function listParticipantSlots(db: Database, eventId: string) {
    const slots = await listSlotsWithBookingFlag(db, eventId, {
        includeCancelled: false,
    });
    return slots.map((slot) => ({
        id: slot.id,
        slotDate: slot.slotDate,
        label: slot.label,
        available: !slot.isBooked,
    }));
}
async function listSlotsWithBookingFlag(db: Database, eventId: string, opts: {
    includeCancelled: boolean;
}) {
    const slots = await db
        .select()
        .from(mealSlots)
        .where(opts.includeCancelled
        ? eq(mealSlots.eventId, eventId)
        : and(eq(mealSlots.eventId, eventId), eq(mealSlots.status, "available")))
        .orderBy(asc(mealSlots.slotDate));
    if (slots.length === 0) {
        return [];
    }
    const active = await db
        .select({ slotId: bookings.slotId })
        .from(bookings)
        .where(and(eq(bookings.eventId, eventId), eq(bookings.status, "active"), inArray(bookings.slotId, slots.map((s) => s.id))));
    const booked = new Set(active.map((b) => b.slotId));
    return slots.map((slot) => ({
        id: slot.id,
        slotDate: slot.slotDate,
        label: slot.label,
        status: slot.status as "available" | "cancelled",
        isBooked: booked.has(slot.id),
    }));
}
