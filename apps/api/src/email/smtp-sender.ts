import nodemailer from "nodemailer";
import type { EmailSender, SendEmailInput, SendEmailResult } from "./types.js";
type SmtpConfig = {
    host: string;
    port: number;
    from: string;
};
export class SmtpEmailSender implements EmailSender {
    readonly providerName = "smtp" as const;
    private readonly transporter: ReturnType<typeof nodemailer.createTransport>;
    private readonly from: string;
    constructor(config: SmtpConfig) {
        this.from = config.from;
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: false,
            tls: { rejectUnauthorized: false },
        });
    }
    async send(input: SendEmailInput): Promise<SendEmailResult> {
        const info = await this.transporter.sendMail({
            from: this.from,
            to: input.to,
            subject: input.subject,
            text: input.text,
            html: input.html,
            headers: {
                "X-Entity-Ref-ID": input.idempotencyKey,
            },
        });
        return { providerMessageId: String(info.messageId ?? "") };
    }
}
