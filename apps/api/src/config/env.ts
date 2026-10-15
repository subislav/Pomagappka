import { z } from "zod";

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const envSchema = z
  .object({
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
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    PRIVACY_CONTACT_EMAIL: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z.string().email().optional(),
    ),
    PRIVACY_CLEANUP_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    PRIVACY_CLEANUP_DRY_RUN: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
    PRIVACY_PIN_ATTEMPT_RETENTION_DAYS: z.coerce
      .number()
      .int()
      .positive()
      .default(30),
    PRIVACY_NOTIFICATION_RETENTION_DAYS: z.coerce
      .number()
      .int()
      .positive()
      .default(90),
  })
  .superRefine((value, ctx) => {
    if (value.EMAIL_PROVIDER === "resend" && !value.RESEND_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["RESEND_API_KEY"],
        message: "Required when EMAIL_PROVIDER=resend",
      });
    }
    const hasGoogleId = Boolean(value.GOOGLE_CLIENT_ID);
    const hasGoogleSecret = Boolean(value.GOOGLE_CLIENT_SECRET);
    if (hasGoogleId !== hasGoogleSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GOOGLE_CLIENT_ID"],
        message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be set",
      });
    }

    if (value.NODE_ENV === "production") {
      for (const key of ["APP_URL", "API_URL", "BETTER_AUTH_URL"] as const) {
        if (!isHttpsUrl(value[key])) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: "Must be an https:// URL when NODE_ENV=production",
          });
        }
      }
      if (
        value.EMAIL_PROVIDER === "resend" &&
        value.EMAIL_FROM.toLowerCase().includes("localhost")
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["EMAIL_FROM"],
          message:
            "Set a verified Resend sender (not localhost) when EMAIL_PROVIDER=resend",
        });
      }
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
