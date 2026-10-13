import { describe, expect, it } from "vitest";
import { bookingCancellationEmail, bookingConfirmationEmail, bookingReminderEmail, } from "./booking-emails.js";
describe("booking email templates", () => {
    it("builds Polish confirmation content with cancel link", () => {
        const mail = bookingConfirmationEmail({
            participantName: "Anna <Test>",
            eventTitle: "Wsparcie",
            recipientDisplayName: "Rodzina",
            slotDate: "2026-11-02",
            mealDescription: "Zupa",
            cancelUrl: "http://localhost:5173/anuluj/abc",
        });
        expect(mail.subject).toContain("Potwierdzenie");
        expect(mail.text).toContain("Anna <Test>");
        expect(mail.text).toContain("http://localhost:5173/anuluj/abc");
        expect(mail.html).toContain("Anna &lt;Test&gt;");
        expect(mail.html).not.toContain("<Test>");
    });
    it("uses grocery wording for grocery confirmation", () => {
        const mail = bookingConfirmationEmail({
            participantName: "Anna",
            eventTitle: "Zakupy",
            recipientDisplayName: "Rodzina",
            slotDate: "2026-11-02",
            mealDescription: "Mleko",
            cancelUrl: "http://localhost:5173/anuluj/abc",
            assistanceType: "grocery",
        });
        expect(mail.text).toContain("zakupów");
        expect(mail.text).toContain("Zakupy: Mleko");
    });
    it("builds Polish cancellation content", () => {
        const mail = bookingCancellationEmail({
            participantName: "Anna",
            eventTitle: "Wsparcie",
            slotDate: "2026-11-02",
        });
        expect(mail.subject).toContain("Anulowanie");
        expect(mail.text).toContain("anulowana");
    });
    it("builds reminder with address for authorized delivery context", () => {
        const mail = bookingReminderEmail({
            participantName: "Anna",
            eventTitle: "Wsparcie",
            recipientDisplayName: "Rodzina",
            slotDate: "2026-11-03",
            mealDescription: null,
            assistanceType: "meal",
            dropOffAddress: "ul. Testowa 1",
            preferredDeliveryTime: "12:00-14:00",
        });
        expect(mail.text).toContain("Przypomnienie");
        expect(mail.text).toContain("ul. Testowa 1");
        expect(mail.text).toContain("12:00-14:00");
    });
});
