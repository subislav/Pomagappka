import type { EmailSender, SendEmailInput, SendEmailResult } from "./types.js";
export class MemoryEmailSender implements EmailSender {
    readonly providerName = "smtp" as const;
    readonly sent: SendEmailInput[] = [];
    async send(input: SendEmailInput): Promise<SendEmailResult> {
        this.sent.push(input);
        return { providerMessageId: `memory-${this.sent.length}` };
    }
}
