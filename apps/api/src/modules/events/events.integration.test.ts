import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../app.js";
import { loadEnv } from "../../config/env.js";
import { MemoryEmailSender } from "../../email/memory-sender.js";
import { EVENT_ACCESS_COOKIE } from "./access-session.js";
const hasDatabase = Boolean(process.env.DATABASE_URL);
function extractCookie(setCookie: string | string[] | undefined, name: string): string | undefined {
    const headers = Array.isArray(setCookie)
        ? setCookie
        : setCookie
            ? [setCookie]
            : [];
    for (const header of headers) {
        const match = header.match(new RegExp(`${name}=([^;]+)`));
        if (match?.[1]) {
            return decodeURIComponent(match[1]);
        }
    }
    return undefined;
}
describe.skipIf(!hasDatabase)("events + PIN access", () => {
    let app: FastifyInstance;
    let cookieHeader = "";
    beforeAll(async () => {
        const env = loadEnv({
            ...process.env,
            BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ??
                "dev-secret-at-least-32-characters-long",
            BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:5173",
            APP_URL: process.env.APP_URL ?? "http://localhost:5173",
            API_URL: process.env.API_URL ?? "http://localhost:3000",
            LOG_LEVEL: "silent",
        });
        app = await buildApp(env, { email: new MemoryEmailSender() });
    });
    afterAll(async () => {
        await app.close();
    });
    async function signUpOrganizer() {
        const email = `org-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
        const response = await app.inject({
            method: "POST",
            url: "/api/auth/sign-up/email",
            payload: {
                name: "Organizer Test",
                email,
                password: "Haslo12345",
            },
        });
        expect(response.statusCode).toBe(200);
        const setCookie = response.headers["set-cookie"];
        cookieHeader = Array.isArray(setCookie)
            ? setCookie.map((c) => c.split(";")[0]).join("; ")
            : String(setCookie ?? "")
                .split(",")
                .map((c) => c.split(";")[0]?.trim())
                .filter(Boolean)
                .join("; ");
        return email;
    }
    it("denies unauthorized event payload and accepts valid PIN session", async () => {
        await signUpOrganizer();
        const created = await app.inject({
            method: "POST",
            url: "/api/organizer/events",
            headers: { cookie: cookieHeader },
            payload: {
                title: "Wsparcie po operacji",
                recipientDisplayName: "Rodzina Nowaków",
                peopleCount: 3,
                startsOn: "2026-11-01",
                endsOn: "2026-11-14",
                description: "Prosimy o proste posiłki",
            },
        });
        expect(created.statusCode).toBe(201);
        const body = created.json() as {
            event: {
                invitationToken: string;
                id: string;
            };
            pin: string;
        };
        expect(body.pin).toMatch(/^\d{4}$/);
        expect(JSON.stringify(body)).not.toContain("pinHash");
        const unauthorized = await app.inject({
            method: "GET",
            url: `/api/invite/${body.event.invitationToken}/event`,
        });
        expect(unauthorized.statusCode).toBe(401);
        const badPin = await app.inject({
            method: "POST",
            url: `/api/invite/${body.event.invitationToken}/verify-pin`,
            payload: { pin: body.pin === "0000" ? "1111" : "0000" },
        });
        expect(badPin.statusCode).toBe(401);
        expect(badPin.json()).toMatchObject({
            error: { code: "INVALID_CREDENTIALS" },
        });
        const goodPin = await app.inject({
            method: "POST",
            url: `/api/invite/${body.event.invitationToken}/verify-pin`,
            payload: { pin: body.pin },
        });
        expect(goodPin.statusCode).toBe(200);
        const accessCookie = extractCookie(goodPin.headers["set-cookie"], EVENT_ACCESS_COOKIE);
        expect(accessCookie).toBeTruthy();
        const authorized = await app.inject({
            method: "GET",
            url: `/api/invite/${body.event.invitationToken}/event`,
            headers: {
                cookie: `${EVENT_ACCESS_COOKIE}=${accessCookie}`,
            },
        });
        expect(authorized.statusCode).toBe(200);
        expect(authorized.json()).toMatchObject({
            event: {
                title: "Wsparcie po operacji",
                recipientDisplayName: "Rodzina Nowaków",
            },
        });
        expect(JSON.stringify(authorized.json())).not.toContain("pin");
    });
    it("exposes address and phone only after PIN session", async () => {
        await signUpOrganizer();
        const created = await app.inject({
            method: "POST",
            url: "/api/organizer/events",
            headers: { cookie: cookieHeader },
            payload: {
                title: "Prywatne dane",
                recipientDisplayName: "Rodzina",
                peopleCount: 2,
                startsOn: "2026-11-01",
                endsOn: "2026-11-07",
                dropOffAddress: "ul. Sekwana 12, Warszawa",
                recipientPhone: "+48123123123",
                allergies: "orzechy",
            },
        });
        expect(created.statusCode).toBe(201);
        const body = created.json() as {
            event: {
                invitationToken: string;
                dropOffAddress: string;
            };
            pin: string;
        };
        expect(body.event.dropOffAddress).toBe("ul. Sekwana 12, Warszawa");
        const unauthorized = await app.inject({
            method: "GET",
            url: `/api/invite/${body.event.invitationToken}/event`,
        });
        expect(unauthorized.statusCode).toBe(401);
        expect(JSON.stringify(unauthorized.json())).not.toContain("Sekwana");
        expect(JSON.stringify(unauthorized.json())).not.toContain("+48123123123");
        const goodPin = await app.inject({
            method: "POST",
            url: `/api/invite/${body.event.invitationToken}/verify-pin`,
            payload: { pin: body.pin },
        });
        const accessCookie = extractCookie(goodPin.headers["set-cookie"], EVENT_ACCESS_COOKIE);
        const authorized = await app.inject({
            method: "GET",
            url: `/api/invite/${body.event.invitationToken}/event`,
            headers: {
                cookie: `${EVENT_ACCESS_COOKIE}=${accessCookie}`,
            },
        });
        expect(authorized.statusCode).toBe(200);
        expect(authorized.json()).toMatchObject({
            event: {
                dropOffAddress: "ul. Sekwana 12, Warszawa",
                recipientPhone: "+48123123123",
                allergies: "orzechy",
            },
        });
    });
    it("creates grocery events with grocery brackets after PIN", async () => {
        await signUpOrganizer();
        const created = await app.inject({
            method: "POST",
            url: "/api/organizer/events",
            headers: { cookie: cookieHeader },
            payload: {
                title: "Zakupy dla mamy",
                recipientDisplayName: "Mama",
                peopleCount: 1,
                startsOn: "2026-11-01",
                endsOn: "2026-11-10",
                assistanceType: "grocery",
                groceryList: "mleko, chleb, jabłka",
                groceryCategories: ["dairy", "bread", "fruitVeg"],
                budgetHint: "do 150 zł",
                storePreference: "Biedronka",
            },
        });
        expect(created.statusCode).toBe(201);
        const body = created.json() as {
            event: {
                id: string;
                invitationToken: string;
                assistanceType: string;
            };
            pin: string;
        };
        expect(body.event.assistanceType).toBe("grocery");
        const verify = await app.inject({
            method: "POST",
            url: `/api/invite/${body.event.invitationToken}/verify-pin`,
            payload: { pin: body.pin },
        });
        const accessCookie = extractCookie(verify.headers["set-cookie"], EVENT_ACCESS_COOKIE);
        const authorized = await app.inject({
            method: "GET",
            url: `/api/invite/${body.event.invitationToken}/event`,
            headers: {
                cookie: `${EVENT_ACCESS_COOKIE}=${accessCookie}`,
            },
        });
        expect(authorized.statusCode).toBe(200);
        expect(authorized.json()).toMatchObject({
            event: {
                assistanceType: "grocery",
                groceryList: "mleko, chleb, jabłka",
                budgetHint: "do 150 zł",
                storePreference: "Biedronka",
            },
        });
        const slots = await app.inject({
            method: "PUT",
            url: `/api/organizer/events/${body.event.id}/slots`,
            headers: { cookie: cookieHeader },
            payload: { dates: ["2026-11-03"] },
        });
        const slotId = (slots.json() as {
            slots: Array<{
                id: string;
            }>;
        }).slots[0]?.id;
        const booking = await app.inject({
            method: "POST",
            url: `/api/invite/${body.event.invitationToken}/bookings`,
            headers: {
                cookie: `${EVENT_ACCESS_COOKIE}=${accessCookie}`,
            },
            payload: {
                slotId,
                participantName: "Kasia",
                participantEmail: "kasia@example.com",
                mealDescription: "nabiał i pieczywo",
            },
        });
        expect(booking.statusCode).toBe(201);
        expect(booking.json()).toMatchObject({
            booking: {
                mealDescription: "nabiał i pieczywo",
                bookedOnBehalf: false,
            },
        });
    });
    it("isolates access sessions across events and invalidates on PIN rotate", async () => {
        await signUpOrganizer();
        const eventA = await app.inject({
            method: "POST",
            url: "/api/organizer/events",
            headers: { cookie: cookieHeader },
            payload: {
                title: "Event A",
                recipientDisplayName: "Odbiorca A",
                peopleCount: 2,
                startsOn: "2026-11-01",
                endsOn: "2026-11-07",
            },
        });
        const eventB = await app.inject({
            method: "POST",
            url: "/api/organizer/events",
            headers: { cookie: cookieHeader },
            payload: {
                title: "Event B",
                recipientDisplayName: "Odbiorca B",
                peopleCount: 2,
                startsOn: "2026-11-01",
                endsOn: "2026-11-07",
            },
        });
        const a = eventA.json() as {
            event: {
                id: string;
                invitationToken: string;
            };
            pin: string;
        };
        const b = eventB.json() as {
            event: {
                id: string;
                invitationToken: string;
            };
            pin: string;
        };
        const verifyA = await app.inject({
            method: "POST",
            url: `/api/invite/${a.event.invitationToken}/verify-pin`,
            payload: { pin: a.pin },
        });
        const cookieA = extractCookie(verifyA.headers["set-cookie"], EVENT_ACCESS_COOKIE);
        const cross = await app.inject({
            method: "GET",
            url: `/api/invite/${b.event.invitationToken}/event`,
            headers: { cookie: `${EVENT_ACCESS_COOKIE}=${cookieA}` },
        });
        expect(cross.statusCode).toBe(401);
        const regen = await app.inject({
            method: "POST",
            url: `/api/organizer/events/${a.event.id}/pin/regenerate`,
            headers: { cookie: cookieHeader },
        });
        expect(regen.statusCode).toBe(200);
        const newPin = (regen.json() as {
            pin: string;
        }).pin;
        const afterRotate = await app.inject({
            method: "GET",
            url: `/api/invite/${a.event.invitationToken}/event`,
            headers: { cookie: `${EVENT_ACCESS_COOKIE}=${cookieA}` },
        });
        expect(afterRotate.statusCode).toBe(401);
        const reenter = await app.inject({
            method: "POST",
            url: `/api/invite/${a.event.invitationToken}/verify-pin`,
            payload: { pin: newPin },
        });
        expect(reenter.statusCode).toBe(200);
    });
    it("locks out after repeated PIN guessing", async () => {
        await signUpOrganizer();
        const created = await app.inject({
            method: "POST",
            url: "/api/organizer/events",
            headers: { cookie: cookieHeader },
            payload: {
                title: "Lockout event",
                recipientDisplayName: "Odbiorca",
                peopleCount: 1,
                startsOn: "2026-12-01",
                endsOn: "2026-12-02",
            },
        });
        const body = created.json() as {
            event: {
                id: string;
                invitationToken: string;
            };
            pin: string;
        };
        const wrong = body.pin === "9999" ? "0000" : "9999";
        let lastStatus = 0;
        let lastBody: { error?: { code?: string } } = {};
        for (let i = 0; i < 6; i += 1) {
            const response = await app.inject({
                method: "POST",
                url: `/api/invite/${body.event.invitationToken}/verify-pin`,
                payload: { pin: wrong },
                remoteAddress: "203.0.113.50",
            });
            lastStatus = response.statusCode;
            lastBody = response.json() as { error?: { code?: string } };
        }
        expect(lastStatus).toBe(429);
        expect(lastBody.error?.code).toBe("PIN_RESET_REQUIRED");

        const stillLocked = await app.inject({
            method: "POST",
            url: `/api/invite/${body.event.invitationToken}/verify-pin`,
            payload: { pin: body.pin },
            remoteAddress: "203.0.113.50",
        });
        expect(stillLocked.statusCode).toBe(429);

        const regenerated = await app.inject({
            method: "POST",
            url: `/api/organizer/events/${body.event.id}/pin/regenerate`,
            headers: { cookie: cookieHeader },
        });
        expect(regenerated.statusCode).toBe(200);
        const newPin = (regenerated.json() as { pin: string }).pin;

        const unlocked = await app.inject({
            method: "POST",
            url: `/api/invite/${body.event.invitationToken}/verify-pin`,
            payload: { pin: newPin },
            remoteAddress: "203.0.113.50",
        });
        expect(unlocked.statusCode).toBe(200);
    });
});
