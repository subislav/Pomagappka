import { z } from "zod";
export const healthResponseSchema = z.object({
    status: z.enum(["ok", "degraded"]),
    service: z.literal("pomagappka-api"),
    timestamp: z.string().datetime(),
    checks: z.object({
        database: z.enum(["up", "down"]),
    }),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
