import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    HOST: z.string().default("0.0.0.0"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    LOG_LEVEL: z
        .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
        .default("info"),
    APP_URL: z.string().url().default("http://localhost:5173"),
    API_URL: z.string().url().default("http://localhost:3000"),
    SMTP_HOST: z.string().default("mailpit"),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    EMAIL_FROM: z.string().default("Pomagappka <noreply@localhost>"),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_PROVIDER: z.enum(["smtp", "resend"]).default("smtp"),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
}).superRefine((value, ctx) => {
    if (value.EMAIL_PROVIDER === "resend" && !value.RESEND_API_KEY) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["RESEND_API_KEY"],
            message: "Required when EMAIL_PROVIDER=resend",
        });
    }
});
export type Env = z.infer<typeof envSchema>;
export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
    const parsed = envSchema.safeParse(raw);
    if (!parsed.success) {
        const details = parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; ");
        throw new Error(`Invalid environment configuration: ${details}`);
    }
    return parsed.data;
}
