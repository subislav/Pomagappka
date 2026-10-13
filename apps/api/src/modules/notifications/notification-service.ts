import { eq } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { events, notificationDeliveries } from "../../db/schema/domain.js";
import type { EmailSender } from "../../email/types.js";
import { bookingCancellationEmail, bookingConfirmationEmail, } from "../../email/templates/booking-emails.js";
export type BookingNotifyInput = {
    bookingId: string;
    eventId: string;
    participantName: string;
    participantEmail: string;
    slotDate: string;
    mealDescription: string | null;
    cancelUrl: string;
};
export type CancelNotifyInput = {
    bookingId: string;
    eventId: string;
    participantName: string;
    participantEmail: string;
    slotDate: string;
};
export async function sendBookingConfirmationEmail(db: Database, email: EmailSender, input: BookingNotifyInput): Promise<"sent" | "skipped" | "failed"> {
    const idempotencyKey = `booking_confirmation:${input.bookingId}`;
    const existing = await findDelivery(db, idempotencyKey);
    if (existing?.status === "sent") {
        return "skipped";
    }
    const event = await getEvent(db, input.eventId);
    const content = bookingConfirmationEmail({
        participantName: input.participantName,
        eventTitle: event.title,
        recipientDisplayName: event.recipientDisplayName,
        slotDate: input.slotDate,
        mealDescription: input.mealDescription,
        cancelUrl: input.cancelUrl,
        assistanceType: event.assistanceType === "grocery" ? "grocery" : "meal",
    });
    return dispatch(db, email, {
        idempotencyKey,
        bookingId: input.bookingId,
        eventId: input.eventId,
        type: "booking_confirmation",
        recipientEmail: input.participantEmail,
        subject: content.subject,
        html: content.html,
        text: content.text,
        existingId: existing?.id,
    });
}
export async function sendBookingCancellationEmail(db: Database, email: EmailSender, input: CancelNotifyInput): Promise<"sent" | "skipped" | "failed"> {
    const idempotencyKey = `booking_cancellation:${input.bookingId}`;
    const existing = await findDelivery(db, idempotencyKey);
    if (existing?.status === "sent") {
        return "skipped";
    }
    const event = await getEvent(db, input.eventId);
    const content = bookingCancellationEmail({
        participantName: input.participantName,
        eventTitle: event.title,
        slotDate: input.slotDate,
    });
    return dispatch(db, email, {
        idempotencyKey,
        bookingId: input.bookingId,
        eventId: input.eventId,
        type: "booking_cancellation",
        recipientEmail: input.participantEmail,
        subject: content.subject,
        html: content.html,
        text: content.text,
        existingId: existing?.id,
    });
}
async function dispatch(db: Database, email: EmailSender, opts: {
    idempotencyKey: string;
    bookingId: string;
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
async function getEvent(db: Database, eventId: string) {
    const [row] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);
    if (!row) {
        throw new Error(`Event ${eventId} missing for notification`);
    }
    return row;
}
