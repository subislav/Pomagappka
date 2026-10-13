import { and, eq } from "drizzle-orm";
import type { AssistanceType } from "@pomagappka/shared";
import type { Database } from "../../db/client.js";
import { user } from "../../db/schema/auth.js";
import { bookings, events, mealSlots, notificationDeliveries, } from "../../db/schema/domain.js";
import type { EmailSender } from "../../email/types.js";
import { bookingReminderEmail, organizerReminderDigestEmail, } from "../../email/templates/booking-emails.js";
export function warsawDatePlusDays(days: number, now = new Date()): string {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Warsaw",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const today = formatter.format(now);
    const [year, month, day] = today.split("-").map(Number);
    const shifted = new Date(Date.UTC(year!, month! - 1, day! + days, 12, 0, 0));
    return formatter.format(shifted);
}
export async function processDeliveryReminders(db: Database, email: EmailSender, now = new Date()): Promise<{
    participantSent: number;
    organizerSent: number;
}> {
    const targetDate = warsawDatePlusDays(1, now);
    const rows = await db
        .select({
        booking: bookings,
        slotDate: mealSlots.slotDate,
        event: events,
        organizerEmail: user.email,
        organizerName: user.name,
    })
        .from(bookings)
        .innerJoin(mealSlots, eq(bookings.slotId, mealSlots.id))
        .innerJoin(events, eq(bookings.eventId, events.id))
        .innerJoin(user, eq(events.organizerId, user.id))
        .where(and(eq(bookings.status, "active"), eq(events.status, "open"), eq(mealSlots.slotDate, targetDate)));
    let participantSent = 0;
    let organizerSent = 0;
    const byEvent = new Map<string, typeof rows>();
    for (const row of rows) {
        const list = byEvent.get(row.event.id) ?? [];
        list.push(row);
        byEvent.set(row.event.id, list);
        const result = await sendParticipantReminder(db, email, row);
        if (result === "sent")
            participantSent += 1;
    }
    for (const group of byEvent.values()) {
        const first = group[0];
        if (!first)
            continue;
        const result = await sendOrganizerDigest(db, email, first, group);
        if (result === "sent")
            organizerSent += 1;
    }
    return { participantSent, organizerSent };
}
async function sendParticipantReminder(db: Database, email: EmailSender, row: {
    booking: typeof bookings.$inferSelect;
    slotDate: string;
    event: typeof events.$inferSelect;
}): Promise<"sent" | "skipped" | "failed"> {
    const idempotencyKey = `booking_reminder:${row.booking.id}`;
    const existing = await findDelivery(db, idempotencyKey);
    if (existing?.status === "sent")
        return "skipped";
    const assistanceType: AssistanceType = row.event.assistanceType === "grocery" ? "grocery" : "meal";
    const content = bookingReminderEmail({
        participantName: row.booking.participantName,
        eventTitle: row.event.title,
        recipientDisplayName: row.event.recipientDisplayName,
        slotDate: row.slotDate,
        mealDescription: row.booking.mealDescription,
        assistanceType,
        dropOffAddress: row.event.dropOffAddress,
        preferredDeliveryTime: row.event.preferredDeliveryTime,
    });
    return dispatch(db, email, {
        idempotencyKey,
        bookingId: row.booking.id,
        eventId: row.event.id,
        type: "booking_reminder",
        recipientEmail: row.booking.participantEmail,
        subject: content.subject,
        html: content.html,
        text: content.text,
        existingId: existing?.id,
    });
}
async function sendOrganizerDigest(db: Database, email: EmailSender, first: {
    slotDate: string;
    event: typeof events.$inferSelect;
    organizerEmail: string;
    organizerName: string;
}, group: Array<{
    booking: typeof bookings.$inferSelect;
}>): Promise<"sent" | "skipped" | "failed"> {
    const idempotencyKey = `organizer_reminder_digest:${first.event.id}:${first.slotDate}`;
    const existing = await findDelivery(db, idempotencyKey);
    if (existing?.status === "sent")
        return "skipped";
    const assistanceType: AssistanceType = first.event.assistanceType === "grocery" ? "grocery" : "meal";
    const content = organizerReminderDigestEmail({
        organizerName: first.organizerName,
        eventTitle: first.event.title,
        slotDate: first.slotDate,
        assistanceType,
        bookings: group.map((item) => ({
            participantName: item.booking.participantName,
            participantEmail: item.booking.participantEmail,
            mealDescription: item.booking.mealDescription,
        })),
    });
    return dispatch(db, email, {
        idempotencyKey,
        bookingId: null,
        eventId: first.event.id,
        type: "organizer_reminder_digest",
        recipientEmail: first.organizerEmail,
        subject: content.subject,
        html: content.html,
        text: content.text,
        existingId: existing?.id,
    });
}
async function dispatch(db: Database, email: EmailSender, opts: {
    idempotencyKey: string;
    bookingId: string | null;
    eventId: string;
    type: string;
    recipientEmail: string;
    subject: string;
    html: string;
    text: string;
    existingId?: string;
}): Promise<"sent" | "failed"> {
    if (!opts.existingId) {
        await db.insert(notificationDeliveries).values({
            bookingId: opts.bookingId,
            eventId: opts.eventId,
            type: opts.type,
            recipientEmail: opts.recipientEmail,
            provider: email.providerName,
            status: "pending",
            idempotencyKey: opts.idempotencyKey,
        });
    }
    try {
        const result = await email.send({
            to: opts.recipientEmail,
            subject: opts.subject,
            html: opts.html,
            text: opts.text,
            idempotencyKey: opts.idempotencyKey,
        });
        await db
            .update(notificationDeliveries)
            .set({
            status: "sent",
            provider: email.providerName,
            providerMessageId: result.providerMessageId ?? null,
            errorMessage: null,
            updatedAt: new Date(),
        })
            .where(eq(notificationDeliveries.idempotencyKey, opts.idempotencyKey));
        return "sent";
    }
    catch (error) {
        const message = error instanceof Error ? error.message.slice(0, 500) : "send_failed";
        await db
            .update(notificationDeliveries)
            .set({
            status: "failed",
            provider: email.providerName,
            errorMessage: message,
            updatedAt: new Date(),
        })
            .where(eq(notificationDeliveries.idempotencyKey, opts.idempotencyKey));
        return "failed";
    }
}
async function findDelivery(db: Database, idempotencyKey: string) {
    const [row] = await db
        .select()
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.idempotencyKey, idempotencyKey))
        .limit(1);
    return row ?? null;
}
