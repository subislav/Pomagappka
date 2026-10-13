import { describe, expect, it } from "vitest";
import { bookingCancellationEmail, bookingConfirmationEmail, } from "./booking-emails.js";
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
    it("builds Polish cancellation content", () => {
        const mail = bookingCancellationEmail({
            participantName: "Anna",
            eventTitle: "Wsparcie",
            slotDate: "2026-11-02",
        });
        expect(mail.subject).toContain("Anulowanie");
        expect(mail.text).toContain("anulowana");
    });
});
