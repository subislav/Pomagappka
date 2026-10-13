import type { EmailSender, SendEmailInput, SendEmailResult } from "./types.js";
type ResendConfig = {
    apiKey: string;
    from: string;
};
export class ResendEmailSender implements EmailSender {
    readonly providerName = "resend" as const;
    constructor(private readonly config: ResendConfig) { }
    async send(input: SendEmailInput): Promise<SendEmailResult> {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.config.apiKey}`,
                "Content-Type": "application/json",
                "Idempotency-Key": input.idempotencyKey,
            },
            body: JSON.stringify({
                from: this.config.from,
                to: [input.to],
                subject: input.subject,
                html: input.html,
                text: input.text,
            }),
        });
        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Resend error ${response.status}: ${body.slice(0, 300)}`);
        }
        const json = (await response.json()) as {
            id?: string;
        };
        return { providerMessageId: json.id };
    }
}
