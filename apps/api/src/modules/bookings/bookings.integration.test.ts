import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../app.js";
import { loadEnv } from "../../config/env.js";
import { MemoryEmailSender } from "../../email/memory-sender.js";
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
describe.skipIf(!hasDatabase)("bookings concurrency and cancel", () => {
    let app: FastifyInstance;
    let organizerCookie = "";
    const mail = new MemoryEmailSender();
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
        app = await buildApp(env, { email: mail });
    });
    afterAll(async () => {
        await app.close();
    });
    async function setupEventWithSlot() {
        const email = `book-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
        const signup = await app.inject({
            method: "POST",
            url: "/api/auth/sign-up/email",
            payload: { name: "Org", email, password: "haslo12345" },
        });
        expect(signup.statusCode).toBe(200);
        const setCookie = signup.headers["set-cookie"];
        organizerCookie = Array.isArray(setCookie)
            ? setCookie.map((c) => c.split(";")[0]).join("; ")
            : String(setCookie ?? "");
        const created = await app.inject({
            method: "POST",
            url: "/api/organizer/events",
            headers: { cookie: organizerCookie },
            payload: {
                title: "Booking event",
                recipientDisplayName: "Rodzina",
                peopleCount: 2,
                startsOn: "2026-11-01",
                endsOn: "2026-11-10",
            },
        });
        const eventBody = created.json() as {
            event: {
                id: string;
                invitationToken: string;
            };
            pin: string;
        };
        const slots = await app.inject({
            method: "PUT",
            url: `/api/organizer/events/${eventBody.event.id}/slots`,
            headers: { cookie: organizerCookie },
            payload: { dates: ["2026-11-03", "2026-11-04"] },
        });
        expect(slots.statusCode).toBe(200);
        const slotId = (slots.json() as {
            slots: Array<{
                id: string;
                slotDate: string;
            }>;
        })
            .slots.find((s) => s.slotDate === "2026-11-03")?.id;
        expect(slotId).toBeTruthy();
        const verify = await app.inject({
            method: "POST",
            url: `/api/invite/${eventBody.event.invitationToken}/verify-pin`,
            payload: { pin: eventBody.pin },
        });
        const accessCookie = extractCookie(verify.headers["set-cookie"], EVENT_ACCESS_COOKIE);
        return {
            eventId: eventBody.event.id,
            invitationToken: eventBody.event.invitationToken,
            slotId: slotId!,
            accessCookie: accessCookie!,
        };
    }
    it("prevents concurrent double booking of one slot", async () => {
        const ctx = await setupEventWithSlot();
        const payload = {
            slotId: ctx.slotId,
            participantName: "Anna",
            participantEmail: "anna@example.com",
            mealDescription: "Zupa",
        };
        const [a, b] = await Promise.all([
            app.inject({
                method: "POST",
                url: `/api/invite/${ctx.invitationToken}/bookings`,
                headers: { cookie: `${EVENT_ACCESS_COOKIE}=${ctx.accessCookie}` },
                payload: { ...payload, idempotencyKey: `a-${Date.now()}` },
            }),
            app.inject({
                method: "POST",
                url: `/api/invite/${ctx.invitationToken}/bookings`,
                headers: { cookie: `${EVENT_ACCESS_COOKIE}=${ctx.accessCookie}` },
                payload: { ...payload, participantEmail: "ola@example.com", idempotencyKey: `b-${Date.now()}` },
            }),
        ]);
        const statuses = [a.statusCode, b.statusCode].sort();
        expect(statuses).toEqual([201, 409]);
    });
    it("returns the same booking for duplicate idempotency key", async () => {
        const ctx = await setupEventWithSlot();
        const key = `idem-${Date.now()}`;
        const payload = {
            slotId: ctx.slotId,
            participantName: "Bartek",
            participantEmail: "bartek@example.com",
            idempotencyKey: key,
        };
        const first = await app.inject({
            method: "POST",
            url: `/api/invite/${ctx.invitationToken}/bookings`,
            headers: { cookie: `${EVENT_ACCESS_COOKIE}=${ctx.accessCookie}` },
            payload,
        });
        expect(first.statusCode).toBe(201);
        const firstId = (first.json() as {
            booking: {
                id: string;
            };
        }).booking.id;
        const second = await app.inject({
            method: "POST",
            url: `/api/invite/${ctx.invitationToken}/bookings`,
            headers: { cookie: `${EVENT_ACCESS_COOKIE}=${ctx.accessCookie}` },
            payload,
        });
        expect(second.statusCode).toBe(200);
        expect((second.json() as {
            booking: {
                id: string;
            };
        }).booking.id).toBe(firstId);
    });
    it("cancels with a valid token and rejects invalid/used tokens", async () => {
        const ctx = await setupEventWithSlot();
        const created = await app.inject({
            method: "POST",
            url: `/api/invite/${ctx.invitationToken}/bookings`,
            headers: { cookie: `${EVENT_ACCESS_COOKIE}=${ctx.accessCookie}` },
            payload: {
                slotId: ctx.slotId,
                participantName: "Celina",
                participantEmail: "celina@example.com",
            },
        });
        expect(created.statusCode).toBe(201);
        const cancelToken = (created.json() as {
            cancelToken: string;
        }).cancelToken;
        const bad = await app.inject({
            method: "POST",
            url: "/api/bookings/cancel",
            payload: { token: "definitely-not-a-valid-token-xx" },
        });
        expect(bad.statusCode).toBe(404);
        const ok = await app.inject({
            method: "POST",
            url: "/api/bookings/cancel",
            payload: { token: cancelToken },
        });
        expect(ok.statusCode).toBe(200);
        expect(ok.json()).toMatchObject({
            ok: true,
            booking: { status: "cancelled" },
        });
        const reuse = await app.inject({
            method: "POST",
            url: "/api/bookings/cancel",
            payload: { token: cancelToken },
        });
        expect(reuse.statusCode).toBe(404);
        const again = await app.inject({
            method: "POST",
            url: `/api/invite/${ctx.invitationToken}/bookings`,
            headers: { cookie: `${EVENT_ACCESS_COOKIE}=${ctx.accessCookie}` },
            payload: {
                slotId: ctx.slotId,
                participantName: "Dawid",
                participantEmail: "dawid@example.com",
            },
        });
        expect(again.statusCode).toBe(201);
    });
});
