import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { buildApp } from "../../app.js";
import { loadEnv } from "../../config/env.js";
import { MemoryEmailSender } from "../../email/memory-sender.js";
import { notificationDeliveries } from "../../db/schema/domain.js";
import { EVENT_ACCESS_COOKIE } from "../events/access-session.js";
const hasDatabase = Boolean(process.env.DATABASE_URL);
function extractCookie(setCookie: string | string[] | undefined, name: string): string | undefined {
    const headers = Array.isArray(setCookie)
        ? setCookie
        : setCookie
            ? [setCookie]
            : [];
    for (const header of headers) {
        const match = header.match(new RegExp(`${name}=([^;]+)`));
        if (match?.[1])
            return decodeURIComponent(match[1]);
    }
    return undefined;
}
describe.skipIf(!hasDatabase)("notification deliveries", () => {
    const mail = new MemoryEmailSender();
    let app: Awaited<ReturnType<typeof buildApp>>;
    beforeAll(async () => {
        const env = loadEnv({
            ...process.env,
            BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ??
                "dev-secret-at-least-32-characters-long",
            BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:5173",
            APP_URL: process.env.APP_URL ?? "http://localhost:5173",
            API_URL: process.env.API_URL ?? "http://localhost:3000",
            LOG_LEVEL: "silent",
            EMAIL_PROVIDER: "smtp",
        });
        app = await buildApp(env, { email: mail });
    });
    afterAll(async () => {
        await app.close();
    });
    it("sends confirmation once and skips duplicate idempotent notification", async () => {
        mail.sent.length = 0;
        const email = `notify-${Date.now()}@example.com`;
        const signup = await app.inject({
            method: "POST",
            url: "/api/auth/sign-up/email",
            payload: { name: "Org", email, password: "Haslo12345" },
        });
        const setCookie = signup.headers["set-cookie"];
        const organizerCookie = Array.isArray(setCookie)
            ? setCookie.map((c) => c.split(";")[0]).join("; ")
            : String(setCookie ?? "");
        const created = await app.inject({
            method: "POST",
            url: "/api/organizer/events",
            headers: { cookie: organizerCookie },
            payload: {
                title: "Notify event",
                recipientDisplayName: "Rodzina",
                peopleCount: 2,
                startsOn: "2026-11-01",
                endsOn: "2026-11-05",
            },
        });
        const body = created.json() as {
            event: {
                id: string;
                invitationToken: string;
            };
            pin: string;
        };
        await app.inject({
            method: "PUT",
            url: `/api/organizer/events/${body.event.id}/slots`,
            headers: { cookie: organizerCookie },
            payload: { dates: ["2026-11-02"] },
        });
        const verify = await app.inject({
            method: "POST",
            url: `/api/invite/${body.event.invitationToken}/verify-pin`,
            payload: { pin: body.pin },
        });
        const accessCookie = extractCookie(verify.headers["set-cookie"], EVENT_ACCESS_COOKIE);
        const slots = await app.inject({
            method: "GET",
            url: `/api/invite/${body.event.invitationToken}/slots`,
            headers: { cookie: `${EVENT_ACCESS_COOKIE}=${accessCookie}` },
        });
        const slotId = (slots.json() as {
            slots: Array<{
                id: string;
            }>;
        }).slots[0]
            ?.id;
        const key = `notify-idem-${Date.now()}`;
        const first = await app.inject({
            method: "POST",
            url: `/api/invite/${body.event.invitationToken}/bookings`,
            headers: { cookie: `${EVENT_ACCESS_COOKIE}=${accessCookie}` },
            payload: {
                slotId,
                participantName: "Anna",
                participantEmail: "anna-notify@example.com",
                idempotencyKey: key,
            },
        });
        expect(first.statusCode).toBe(201);
        expect(mail.sent).toHaveLength(1);
        expect(mail.sent[0]?.subject).toContain("Potwierdzenie");
        const bookingId = (first.json() as {
            booking: {
                id: string;
            };
        }).booking.id;
        const [delivery] = await app.db
            .select()
            .from(notificationDeliveries)
            .where(eq(notificationDeliveries.idempotencyKey, `booking_confirmation:${bookingId}`));
        expect(delivery?.status).toBe("sent");
        const second = await app.inject({
            method: "POST",
            url: `/api/invite/${body.event.invitationToken}/bookings`,
            headers: { cookie: `${EVENT_ACCESS_COOKIE}=${accessCookie}` },
            payload: {
                slotId,
                participantName: "Anna",
                participantEmail: "anna-notify@example.com",
                idempotencyKey: key,
            },
        });
        expect(second.statusCode).toBe(200);
        expect(mail.sent).toHaveLength(1);
    });
});
