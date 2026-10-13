import { z } from "zod";
export const signUpBodySchema = z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(128),
});
export type SignUpBody = z.infer<typeof signUpBodySchema>;
export const signInBodySchema = z.object({
    email: z.string().trim().email().max(255),
    password: z.string().min(1).max(128),
});
export type SignInBody = z.infer<typeof signInBodySchema>;
export const organizerUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
});
export type OrganizerUser = z.infer<typeof organizerUserSchema>;
export const organizerMeResponseSchema = z.object({
    user: organizerUserSchema,
});
export type OrganizerMeResponse = z.infer<typeof organizerMeResponseSchema>;
