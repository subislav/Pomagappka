import { z } from "zod";
export const eventStatusSchema = z.enum([
    "draft",
    "open",
    "closed",
    "deleted",
]);
export type EventStatus = z.infer<typeof eventStatusSchema>;
export const bookingStatusSchema = z.enum(["active", "cancelled"]);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export const assistanceTypeSchema = z.enum(["meal"]);
export type AssistanceType = z.infer<typeof assistanceTypeSchema>;
