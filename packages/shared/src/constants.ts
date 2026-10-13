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
export const assistanceTypeSchema = z.enum(["meal", "grocery"]);
export type AssistanceType = z.infer<typeof assistanceTypeSchema>;
export const groceryCategorySchema = z.enum([
    "dairy",
    "bread",
    "fruitVeg",
    "cleaning",
    "baby",
    "other",
]);
export type GroceryCategory = z.infer<typeof groceryCategorySchema>;
