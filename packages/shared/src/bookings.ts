import { z } from "zod";
import { bookingStatusSchema } from "./constants.js";
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const putSlotsBodySchema = z.object({
    dates: z.array(dateString).max(120),
    label: z.string().trim().max(80).optional().nullable(),
});
export type PutSlotsBody = z.infer<typeof putSlotsBodySchema>;
export const mealSlotSchema = z.object({
    id: z.string().uuid(),
    slotDate: dateString,
    label: z.string().nullable(),
    status: z.enum(["available", "cancelled"]),
    isBooked: z.boolean(),
});
export type MealSlot = z.infer<typeof mealSlotSchema>;
export const organizerSlotsResponseSchema = z.object({
    slots: z.array(mealSlotSchema),
});
export const participantSlotSchema = z.object({
    id: z.string().uuid(),
    slotDate: dateString,
    label: z.string().nullable(),
    available: z.boolean(),
});
export type ParticipantSlot = z.infer<typeof participantSlotSchema>;
export const participantSlotsResponseSchema = z.object({
    slots: z.array(participantSlotSchema),
});
export const createBookingBodySchema = z.object({
    slotId: z.string().uuid(),
    participantName: z.string().trim().min(1).max(120),
    participantEmail: z.string().trim().email().max(255),
    mealDescription: z.string().trim().max(2000).optional().nullable(),
    idempotencyKey: z.string().trim().min(8).max(128).optional(),
});
export type CreateBookingBody = z.infer<typeof createBookingBodySchema>;
export const bookingSchema = z.object({
    id: z.string().uuid(),
    slotId: z.string().uuid(),
    eventId: z.string().uuid(),
    slotDate: dateString,
    participantName: z.string(),
    participantEmail: z.string().email(),
    mealDescription: z.string().nullable(),
    bookedOnBehalf: z.boolean(),
    status: bookingStatusSchema,
    createdAt: z.string(),
});
export type Booking = z.infer<typeof bookingSchema>;
export const createBookingResponseSchema = z.object({
    booking: bookingSchema,
    cancelToken: z.string(),
    cancelUrl: z.string().url(),
});
export type CreateBookingResponse = z.infer<typeof createBookingResponseSchema>;
export const organizerBookingsResponseSchema = z.object({
    bookings: z.array(bookingSchema),
});
export const cancelBookingBodySchema = z.object({
    token: z.string().min(16).max(200),
});
export type CancelBookingBody = z.infer<typeof cancelBookingBodySchema>;
export const cancelBookingResponseSchema = z.object({
    ok: z.literal(true),
    booking: bookingSchema.pick({
        id: true,
        slotDate: true,
        status: true,
    }),
});
