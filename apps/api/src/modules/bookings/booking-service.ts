import { and, desc, eq, isNull } from "drizzle-orm";
import type { CreateBookingBody } from "@pomagappka/shared";
import type { Env } from "../../config/env.js";
import type { Database } from "../../db/client.js";
import { bookingCancellationTokens, bookings, mealSlots, } from "../../db/schema/domain.js";
import type { EmailSender } from "../../email/types.js";
import { generateSessionToken, hashToken, } from "../../lib/crypto.js";
import { AppError } from "../../lib/errors.js";
import { findOwnedEvent } from "../events/event-service.js";
import { sendBookingCancellationEmail, sendBookingConfirmationEmail, } from "../notifications/notification-service.js";
function isUniqueViolation(error: unknown): boolean {
    let current: unknown = error;
    for (let i = 0; i < 5 && current; i += 1) {
        if (typeof current !== "object" || current === null)
            break;
        const record = current as {
            code?: string | number;
            cause?: unknown;
            message?: string;
        };
        if (String(record.code) === "23505")
            return true;
        if (typeof record.message === "string" &&
            /duplicate key|unique constraint/i.test(record.message)) {
            return true;
        }
        current = record.cause;
    }
    return false;
}
export async function listOrganizerBookings(db: Database, organizerId: string, eventId: string) {
    await findOwnedEvent(db, organizerId, eventId);
    return listBookingsForEvent(db, eventId);
}
export async function createBooking(db: Database, env: Env, email: EmailSender, opts: {
    eventId: string;
    input: CreateBookingBody;
    bookedOnBehalf?: boolean;
}) {
    const bookedOnBehalf = opts.bookedOnBehalf === true;
    if (opts.input.idempotencyKey) {
        const existing = await db
            .select()
            .from(bookings)
            .where(and(eq(bookings.eventId, opts.eventId), eq(bookings.idempotencyKey, opts.input.idempotencyKey)))
            .limit(1);
        if (existing[0]) {
            const slot = await getSlot(db, existing[0].slotId);
            const cancel = await ensureCancelToken(db, existing[0].id);
            const mapped = mapBooking(existing[0], slot.slotDate);
            const cancelUrl = buildCancelUrl(env.APP_URL, cancel.rawToken);
            await sendBookingConfirmationEmail(db, email, {
                bookingId: mapped.id,
                eventId: mapped.eventId,
                participantName: mapped.participantName,
                participantEmail: mapped.participantEmail,
                slotDate: mapped.slotDate,
                mealDescription: mapped.mealDescription,
                cancelUrl,
            });
            return {
                booking: mapped,
                cancelToken: cancel.rawToken,
                cancelUrl,
                reused: true as const,
            };
        }
    }
    const [slot] = await db
        .select()
        .from(mealSlots)
        .where(and(eq(mealSlots.id, opts.input.slotId), eq(mealSlots.eventId, opts.eventId)))
        .limit(1);
    if (!slot || slot.status !== "available") {
        throw new AppError(404, "SLOT_NOT_FOUND", "Nie znaleziono terminu.");
    }
    let inserted;
    try {
        inserted = await db.transaction(async (tx) => {
            const [booking] = await tx
                .insert(bookings)
                .values({
                slotId: slot.id,
                eventId: opts.eventId,
                participantName: opts.input.participantName,
                participantEmail: opts.input.participantEmail,
                mealDescription: opts.input.mealDescription ?? null,
                bookedOnBehalf,
                status: "active",
                idempotencyKey: opts.input.idempotencyKey ?? null,
            })
                .returning();
            if (!booking) {
                throw new AppError(500, "CREATE_FAILED", "Nie udało się utworzyć rezerwacji.");
            }
            const rawToken = generateSessionToken();
            await tx.insert(bookingCancellationTokens).values({
                bookingId: booking.id,
                tokenHash: hashToken(rawToken),
            });
            return { booking, rawToken };
        });
    }
    catch (error) {
        if (isUniqueViolation(error)) {
            if (opts.input.idempotencyKey) {
                const [existing] = await db
                    .select()
                    .from(bookings)
                    .where(and(eq(bookings.eventId, opts.eventId), eq(bookings.idempotencyKey, opts.input.idempotencyKey)))
                    .limit(1);
                if (existing) {
                    const existingSlot = await getSlot(db, existing.slotId);
                    const cancel = await ensureCancelToken(db, existing.id);
                    const mapped = mapBooking(existing, existingSlot.slotDate);
                    const cancelUrl = buildCancelUrl(env.APP_URL, cancel.rawToken);
                    await sendBookingConfirmationEmail(db, email, {
                        bookingId: mapped.id,
                        eventId: mapped.eventId,
                        participantName: mapped.participantName,
                        participantEmail: mapped.participantEmail,
                        slotDate: mapped.slotDate,
                        mealDescription: mapped.mealDescription,
                        cancelUrl,
                    });
                    return {
                        booking: mapped,
                        cancelToken: cancel.rawToken,
                        cancelUrl,
                        reused: true as const,
                    };
                }
            }
            throw new AppError(409, "SLOT_TAKEN", "Ten termin jest już zajęty.");
        }
        throw error;
    }
    const mapped = mapBooking(inserted.booking, slot.slotDate);
    const cancelUrl = buildCancelUrl(env.APP_URL, inserted.rawToken);
    await sendBookingConfirmationEmail(db, email, {
        bookingId: mapped.id,
        eventId: mapped.eventId,
        participantName: mapped.participantName,
        participantEmail: mapped.participantEmail,
        slotDate: mapped.slotDate,
        mealDescription: mapped.mealDescription,
        cancelUrl,
    });
    return {
        booking: mapped,
        cancelToken: inserted.rawToken,
        cancelUrl,
        reused: false as const,
    };
}
export async function cancelBookingByToken(db: Database, email: EmailSender, rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const [tokenRow] = await db
        .select()
        .from(bookingCancellationTokens)
        .where(eq(bookingCancellationTokens.tokenHash, tokenHash))
        .limit(1);
    if (!tokenRow || tokenRow.revokedAt || tokenRow.usedAt) {
        throw new AppError(404, "INVALID_CANCEL_TOKEN", "Link anulowania jest nieprawidłowy lub został już użyty.");
    }
    if (tokenRow.expiresAt && tokenRow.expiresAt.getTime() <= Date.now()) {
        throw new AppError(404, "INVALID_CANCEL_TOKEN", "Link anulowania jest nieprawidłowy lub został już użyty.");
    }
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, tokenRow.bookingId))
        .limit(1);
    if (!booking) {
        throw new AppError(404, "INVALID_CANCEL_TOKEN", "Link anulowania jest nieprawidłowy lub został już użyty.");
    }
    if (booking.status === "cancelled") {
        await db
            .update(bookingCancellationTokens)
            .set({ usedAt: new Date() })
            .where(eq(bookingCancellationTokens.id, tokenRow.id));
        const slot = await getSlot(db, booking.slotId);
        return mapBooking(booking, slot.slotDate);
    }
    const updated = await db.transaction(async (tx) => {
        const [row] = await tx
            .update(bookings)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(and(eq(bookings.id, booking.id), eq(bookings.status, "active")))
            .returning();
        await tx
            .update(bookingCancellationTokens)
            .set({ usedAt: new Date() })
            .where(eq(bookingCancellationTokens.id, tokenRow.id));
        return row ?? booking;
    });
    const slot = await getSlot(db, updated.slotId);
    const mapped = mapBooking(updated, slot.slotDate);
    await sendBookingCancellationEmail(db, email, {
        bookingId: mapped.id,
        eventId: mapped.eventId,
        participantName: mapped.participantName,
        participantEmail: mapped.participantEmail,
        slotDate: mapped.slotDate,
    });
    return mapped;
}
async function listBookingsForEvent(db: Database, eventId: string) {
    const rows = await db
        .select({
        booking: bookings,
        slotDate: mealSlots.slotDate,
    })
        .from(bookings)
        .innerJoin(mealSlots, eq(bookings.slotId, mealSlots.id))
        .where(eq(bookings.eventId, eventId))
        .orderBy(desc(bookings.createdAt));
    return rows.map(({ booking, slotDate }) => mapBooking(booking, slotDate));
}
async function getSlot(db: Database, slotId: string) {
    const [slot] = await db
        .select()
        .from(mealSlots)
        .where(eq(mealSlots.id, slotId))
        .limit(1);
    if (!slot) {
        throw new AppError(404, "SLOT_NOT_FOUND", "Nie znaleziono terminu.");
    }
    return slot;
}
async function ensureCancelToken(db: Database, bookingId: string) {
    await db
        .update(bookingCancellationTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(bookingCancellationTokens.bookingId, bookingId), isNull(bookingCancellationTokens.usedAt), isNull(bookingCancellationTokens.revokedAt)));
    const rawToken = generateSessionToken();
    await db.insert(bookingCancellationTokens).values({
        bookingId,
        tokenHash: hashToken(rawToken),
    });
    return { rawToken };
}
function mapBooking(booking: typeof bookings.$inferSelect, slotDate: string) {
    return {
        id: booking.id,
        slotId: booking.slotId,
        eventId: booking.eventId,
        slotDate,
        participantName: booking.participantName,
        participantEmail: booking.participantEmail,
        mealDescription: booking.mealDescription,
        bookedOnBehalf: booking.bookedOnBehalf,
        status: booking.status as "active" | "cancelled",
        createdAt: booking.createdAt.toISOString(),
    };
}
export async function createOrganizerBooking(db: Database, env: Env, email: EmailSender, organizerId: string, eventId: string, input: CreateBookingBody) {
    await findOwnedEvent(db, organizerId, eventId);
    return createBooking(db, env, email, {
        eventId,
        input,
        bookedOnBehalf: true,
    });
}
function buildCancelUrl(appUrl: string, rawToken: string) {
    return `${appUrl.replace(/\/$/, "")}/anuluj/${encodeURIComponent(rawToken)}`;
}
