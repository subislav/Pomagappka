import type { AssistanceType } from "@pomagappka/shared";
type ConfirmationInput = {
    participantName: string;
    eventTitle: string;
    recipientDisplayName: string;
    slotDate: string;
    mealDescription: string | null;
    cancelUrl: string;
    assistanceType?: AssistanceType;
};
type CancellationInput = {
    participantName: string;
    eventTitle: string;
    slotDate: string;
};
type ReminderInput = {
    participantName: string;
    eventTitle: string;
    recipientDisplayName: string;
    slotDate: string;
    mealDescription: string | null;
    assistanceType: AssistanceType;
    dropOffAddress: string | null;
    preferredDeliveryTime: string | null;
};
type OrganizerDigestInput = {
    organizerName: string;
    eventTitle: string;
    slotDate: string;
    assistanceType: AssistanceType;
    bookings: Array<{
        participantName: string;
        participantEmail: string;
        mealDescription: string | null;
    }>;
};
function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
function noteLabel(assistanceType: AssistanceType | undefined): string {
    return assistanceType === "grocery" ? "Zakupy" : "Posiłek";
}
function confirmationLead(assistanceType: AssistanceType | undefined): string {
    return assistanceType === "grocery"
        ? "Twoja rezerwacja zakupów została potwierdzona."
        : "Twoja rezerwacja posiłku została potwierdzona.";
}
function reminderLead(assistanceType: AssistanceType): string {
    return assistanceType === "grocery"
        ? "Przypomnienie: jutro masz dostawę zakupów."
        : "Przypomnienie: jutro masz dostawę posiłku.";
}
export function bookingConfirmationEmail(input: ConfirmationInput) {
    const note = input.mealDescription
        ? `\n${noteLabel(input.assistanceType)}: ${input.mealDescription}`
        : "";
    const subject = `Potwierdzenie rezerwacji — ${input.eventTitle}`;
    const text = [
        `Cześć ${input.participantName},`,
        "",
        confirmationLead(input.assistanceType),
        `Wydarzenie: ${input.eventTitle}`,
        `Dla: ${input.recipientDisplayName}`,
        `Termin: ${input.slotDate}`,
        note.trim() ? note.trim() : null,
        "",
        `Aby anulować rezerwację, użyj linku:`,
        input.cancelUrl,
        "",
        "Pomagappka",
    ]
        .filter((line) => line !== null)
        .join("\n");
    const html = `
    <p>Cześć ${escapeHtml(input.participantName)},</p>
    <p>${escapeHtml(confirmationLead(input.assistanceType))}</p>
    <ul>
      <li><strong>Wydarzenie:</strong> ${escapeHtml(input.eventTitle)}</li>
      <li><strong>Dla:</strong> ${escapeHtml(input.recipientDisplayName)}</li>
      <li><strong>Termin:</strong> ${escapeHtml(input.slotDate)}</li>
      ${input.mealDescription
        ? `<li><strong>${escapeHtml(noteLabel(input.assistanceType))}:</strong> ${escapeHtml(input.mealDescription)}</li>`
        : ""}
    </ul>
    <p><a href="${escapeHtml(input.cancelUrl)}">Anuluj rezerwację</a></p>
    <p>Pomagappka</p>
  `.trim();
    return { subject, text, html };
}
export function bookingCancellationEmail(input: CancellationInput) {
    const subject = `Anulowanie rezerwacji — ${input.eventTitle}`;
    const text = [
        `Cześć ${input.participantName},`,
        "",
        `Twoja rezerwacja została anulowana.`,
        `Wydarzenie: ${input.eventTitle}`,
        `Termin: ${input.slotDate}`,
        "",
        "Pomagappka",
    ].join("\n");
    const html = `
    <p>Cześć ${escapeHtml(input.participantName)},</p>
    <p>Twoja rezerwacja została anulowana.</p>
    <ul>
      <li><strong>Wydarzenie:</strong> ${escapeHtml(input.eventTitle)}</li>
      <li><strong>Termin:</strong> ${escapeHtml(input.slotDate)}</li>
    </ul>
    <p>Pomagappka</p>
  `.trim();
    return { subject, text, html };
}
export function bookingReminderEmail(input: ReminderInput) {
    const subject = `Przypomnienie o dostawie — ${input.eventTitle}`;
    const text = [
        `Cześć ${input.participantName},`,
        "",
        reminderLead(input.assistanceType),
        `Wydarzenie: ${input.eventTitle}`,
        `Dla: ${input.recipientDisplayName}`,
        `Termin: ${input.slotDate}`,
        input.preferredDeliveryTime
            ? `Preferowana pora: ${input.preferredDeliveryTime}`
            : null,
        input.dropOffAddress ? `Adres: ${input.dropOffAddress}` : null,
        input.mealDescription
            ? `${noteLabel(input.assistanceType)}: ${input.mealDescription}`
            : null,
        "",
        "Pomagappka",
    ]
        .filter((line) => line !== null)
        .join("\n");
    const html = `
    <p>Cześć ${escapeHtml(input.participantName)},</p>
    <p>${escapeHtml(reminderLead(input.assistanceType))}</p>
    <ul>
      <li><strong>Wydarzenie:</strong> ${escapeHtml(input.eventTitle)}</li>
      <li><strong>Dla:</strong> ${escapeHtml(input.recipientDisplayName)}</li>
      <li><strong>Termin:</strong> ${escapeHtml(input.slotDate)}</li>
      ${input.preferredDeliveryTime
        ? `<li><strong>Preferowana pora:</strong> ${escapeHtml(input.preferredDeliveryTime)}</li>`
        : ""}
      ${input.dropOffAddress
        ? `<li><strong>Adres:</strong> ${escapeHtml(input.dropOffAddress)}</li>`
        : ""}
      ${input.mealDescription
        ? `<li><strong>${escapeHtml(noteLabel(input.assistanceType))}:</strong> ${escapeHtml(input.mealDescription)}</li>`
        : ""}
    </ul>
    <p>Pomagappka</p>
  `.trim();
    return { subject, text, html };
}
export function organizerReminderDigestEmail(input: OrganizerDigestInput) {
    const kind = input.assistanceType === "grocery" ? "zakupów" : "posiłków";
    const subject = `Jutrzejsze dostawy ${kind} — ${input.eventTitle}`;
    const lines = input.bookings.map((booking) => {
        const note = booking.mealDescription ? ` (${booking.mealDescription})` : "";
        return `- ${booking.participantName} <${booking.participantEmail}>${note}`;
    });
    const text = [
        `Cześć ${input.organizerName},`,
        "",
        `Na ${input.slotDate} zaplanowano ${input.bookings.length} dostaw(y) w wydarzeniu „${input.eventTitle}”:`,
        ...lines,
        "",
        "Pomagappka",
    ].join("\n");
    const htmlItems = input.bookings
        .map((booking) => {
        const note = booking.mealDescription
            ? ` — ${escapeHtml(booking.mealDescription)}`
            : "";
        return `<li>${escapeHtml(booking.participantName)} &lt;${escapeHtml(booking.participantEmail)}&gt;${note}</li>`;
    })
        .join("");
    const html = `
    <p>Cześć ${escapeHtml(input.organizerName)},</p>
    <p>Na <strong>${escapeHtml(input.slotDate)}</strong> zaplanowano ${input.bookings.length} dostaw(y) w wydarzeniu „${escapeHtml(input.eventTitle)}”:</p>
    <ul>${htmlItems}</ul>
    <p>Pomagappka</p>
  `.trim();
    return { subject, text, html };
}
