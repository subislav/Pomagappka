import type { EmailSender, SendEmailInput, SendEmailResult } from "./types.js";
export class NoopEmailSender implements EmailSender {
    readonly providerName = "smtp" as const;
    async send(_input: SendEmailInput): Promise<SendEmailResult> {
        return { providerMessageId: "noop" };
    }
}
