import type { Env } from "../config/env.js";
import { ResendEmailSender } from "./resend-sender.js";
import { SmtpEmailSender } from "./smtp-sender.js";
import type { EmailSender } from "./types.js";
export function createEmailSender(env: Env): EmailSender {
    if (env.EMAIL_PROVIDER === "resend") {
        if (!env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
        }
        return new ResendEmailSender({
            apiKey: env.RESEND_API_KEY,
            from: env.EMAIL_FROM,
        });
    }
    return new SmtpEmailSender({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        from: env.EMAIL_FROM,
    });
}
