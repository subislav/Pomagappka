import { z } from "zod";
import { assistanceTypeSchema, eventStatusSchema } from "./constants.js";
export const pinSchema = z
    .string()
    .regex(/^\d{4}$/, "PIN must be exactly 4 digits");
export const createEventBodySchema = z
    .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).optional().nullable(),
    recipientDisplayName: z.string().trim().min(1).max(200),
    peopleCount: z.number().int().min(1).max(100),
    startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dietaryPreferences: z.string().trim().max(2000).optional().nullable(),
    assistanceType: assistanceTypeSchema.optional(),
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
    description: z.string().trim().max(5000).optional().nullable(),
    recipientDisplayName: z.string().trim().min(1).max(200).optional(),
    peopleCount: z.number().int().min(1).max(100).optional(),
    startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dietaryPreferences: z.string().trim().max(2000).optional().nullable(),
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
export const organizerEventSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable(),
    recipientDisplayName: z.string(),
    peopleCount: z.number().int(),
    startsOn: z.string(),
    endsOn: z.string(),
    dietaryPreferences: z.string().nullable(),
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
    dietaryPreferences: z.string().nullable(),
    assistanceType: assistanceTypeSchema,
    status: eventStatusSchema,
});
export type ParticipantEvent = z.infer<typeof participantEventSchema>;
