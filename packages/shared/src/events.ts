import { z } from "zod";
import { assistanceTypeSchema, eventStatusSchema, groceryCategorySchema, } from "./constants.js";
export const pinSchema = z
    .string()
    .regex(/^\d{4}$/, "PIN must be exactly 4 digits");
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const optionalHttpUrl = (max: number) => z
    .string()
    .trim()
    .max(max)
    .refine((value) => value.length === 0 || /^https?:\/\/.+/i.test(value), {
    message: "Must be an http(s) URL",
})
    .optional()
    .nullable();
const mealDetailFields = {
    dropOffAddress: optionalText(500),
    recipientPhone: optionalText(40),
    preferredDeliveryTime: optionalText(200),
    specialInstructions: optionalText(2000),
    favoriteMeals: optionalText(2000),
    leastFavoriteMeals: optionalText(2000),
    allergies: optionalText(2000),
    photoUrl: optionalHttpUrl(2000),
    photoCaption: optionalText(500),
};
const groceryDetailFields = {
    groceryList: optionalText(10000),
    groceryCategories: z.array(groceryCategorySchema).max(12).optional().nullable(),
    budgetHint: optionalText(500),
    storePreference: optionalText(500),
    dietaryOrAllergyNotes: optionalText(2000),
    deliveryOrPickupNotes: optionalText(2000),
};
export const createEventBodySchema = z
    .object({
    title: z.string().trim().min(1).max(200),
    description: optionalText(5000),
    recipientDisplayName: z.string().trim().min(1).max(200),
    peopleCount: z.number().int().min(1).max(100),
    startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dietaryPreferences: optionalText(2000),
    assistanceType: assistanceTypeSchema.optional(),
    ...mealDetailFields,
    ...groceryDetailFields,
})
    .superRefine((value, ctx) => {
    if (value.endsOn < value.startsOn) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endsOn"],
            message: "endsOn must be on or after startsOn",
        });
    }
});
export type CreateEventBody = z.infer<typeof createEventBodySchema>;
export const updateEventBodySchema = z
    .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: optionalText(5000),
    recipientDisplayName: z.string().trim().min(1).max(200).optional(),
    peopleCount: z.number().int().min(1).max(100).optional(),
    startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dietaryPreferences: optionalText(2000),
    ...mealDetailFields,
    ...groceryDetailFields,
})
    .superRefine((value, ctx) => {
    if (value.startsOn &&
        value.endsOn &&
        value.endsOn < value.startsOn) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endsOn"],
            message: "endsOn must be on or after startsOn",
        });
    }
});
export type UpdateEventBody = z.infer<typeof updateEventBodySchema>;
export const verifyPinBodySchema = z.object({
    pin: pinSchema,
});
export type VerifyPinBody = z.infer<typeof verifyPinBodySchema>;
const eventDetailSchema = {
    dietaryPreferences: z.string().nullable(),
    dropOffAddress: z.string().nullable(),
    recipientPhone: z.string().nullable(),
    preferredDeliveryTime: z.string().nullable(),
    specialInstructions: z.string().nullable(),
    favoriteMeals: z.string().nullable(),
    leastFavoriteMeals: z.string().nullable(),
    allergies: z.string().nullable(),
    photoUrl: z.string().nullable(),
    photoCaption: z.string().nullable(),
    groceryList: z.string().nullable(),
    groceryCategories: z.array(groceryCategorySchema).nullable(),
    budgetHint: z.string().nullable(),
    storePreference: z.string().nullable(),
    dietaryOrAllergyNotes: z.string().nullable(),
    deliveryOrPickupNotes: z.string().nullable(),
};
export const organizerEventSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    recipientDisplayName: z.string(),
    peopleCount: z.number().int(),
    startsOn: z.string(),
    endsOn: z.string(),
    ...eventDetailSchema,
    assistanceType: assistanceTypeSchema,
    invitationToken: z.string(),
    invitationUrl: z.string().url(),
    pinVersion: z.number().int(),
    status: eventStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type OrganizerEvent = z.infer<typeof organizerEventSchema>;
export const organizerEventListItemSchema = organizerEventSchema.omit({
    invitationToken: true,
    invitationUrl: true,
    pinVersion: true,
    description: true,
    dietaryPreferences: true,
    dropOffAddress: true,
    recipientPhone: true,
    preferredDeliveryTime: true,
    specialInstructions: true,
    favoriteMeals: true,
    leastFavoriteMeals: true,
    allergies: true,
    photoUrl: true,
    photoCaption: true,
    groceryList: true,
    groceryCategories: true,
    budgetHint: true,
    storePreference: true,
    dietaryOrAllergyNotes: true,
    deliveryOrPickupNotes: true,
});
export type OrganizerEventListItem = z.infer<typeof organizerEventListItemSchema>;
export const organizerEventsResponseSchema = z.object({
    events: z.array(organizerEventListItemSchema),
});
export type OrganizerEventsResponse = z.infer<typeof organizerEventsResponseSchema>;
export const createEventResponseSchema = z.object({
    event: organizerEventSchema,
    pin: pinSchema,
});
export type CreateEventResponse = z.infer<typeof createEventResponseSchema>;
export const regeneratePinResponseSchema = z.object({
    pin: pinSchema,
    pinVersion: z.number().int(),
});
export type RegeneratePinResponse = z.infer<typeof regeneratePinResponseSchema>;
export const participantEventSchema = z.object({
    title: z.string(),
    description: z.string().nullable(),
    recipientDisplayName: z.string(),
    peopleCount: z.number().int(),
    startsOn: z.string(),
    endsOn: z.string(),
    ...eventDetailSchema,
    assistanceType: assistanceTypeSchema,
    status: eventStatusSchema,
});
export type ParticipantEvent = z.infer<typeof participantEventSchema>;
export const createEventUpdateBodySchema = z
    .object({
    imageUrl: optionalHttpUrl(2000),
    caption: optionalText(2000),
})
    .superRefine((value, ctx) => {
    const image = value.imageUrl?.trim() ?? "";
    const caption = value.caption?.trim() ?? "";
    if (!image && !caption) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["caption"],
            message: "imageUrl or caption required",
        });
    }
});
export type CreateEventUpdateBody = z.infer<typeof createEventUpdateBodySchema>;
export const eventUpdateSchema = z.object({
    id: z.string().uuid(),
    imageUrl: z.string().nullable(),
    caption: z.string().nullable(),
    createdAt: z.string(),
});
export type EventUpdate = z.infer<typeof eventUpdateSchema>;
export const eventUpdatesResponseSchema = z.object({
    updates: z.array(eventUpdateSchema),
});
export type EventUpdatesResponse = z.infer<typeof eventUpdatesResponseSchema>;
