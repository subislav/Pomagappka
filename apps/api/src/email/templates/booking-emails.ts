type ConfirmationInput = {
    participantName: string;
    eventTitle: string;
    recipientDisplayName: string;
    slotDate: string;
    mealDescription: string | null;
    cancelUrl: string;
};
type CancellationInput = {
    participantName: string;
    eventTitle: string;
    slotDate: string;
};
function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
export function bookingConfirmationEmail(input: ConfirmationInput) {
    const meal = input.mealDescription
        ? `\nPosiłek: ${input.mealDescription}`
        : "";
    const subject = `Potwierdzenie rezerwacji — ${input.eventTitle}`;
    const text = [
        `Cześć ${input.participantName},`,
        "",
        `Twoja rezerwacja posiłku została potwierdzona.`,
        `Wydarzenie: ${input.eventTitle}`,
        `Dla: ${input.recipientDisplayName}`,
        `Termin: ${input.slotDate}`,
        meal.trim() ? meal.trim() : null,
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
    <p>Twoja rezerwacja posiłku została potwierdzona.</p>
    <ul>
      <li><strong>Wydarzenie:</strong> ${escapeHtml(input.eventTitle)}</li>
      <li><strong>Dla:</strong> ${escapeHtml(input.recipientDisplayName)}</li>
      <li><strong>Termin:</strong> ${escapeHtml(input.slotDate)}</li>
      ${input.mealDescription
        ? `<li><strong>Posiłek:</strong> ${escapeHtml(input.mealDescription)}</li>`
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
