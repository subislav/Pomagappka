export type SendEmailInput = {
    to: string;
    subject: string;
    html: string;
    text: string;
    idempotencyKey: string;
};
export type SendEmailResult = {
    providerMessageId?: string;
};
export interface EmailSender {
    readonly providerName: "smtp" | "resend";
    send(input: SendEmailInput): Promise<SendEmailResult>;
}
