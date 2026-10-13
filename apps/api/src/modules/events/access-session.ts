import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { eventAccessSessions, events, } from "../../db/schema/domain.js";
import { generateSessionToken, hashToken, } from "../../lib/crypto.js";
export const EVENT_ACCESS_COOKIE = "pomagappka_event_access";
export const EVENT_ACCESS_TTL_MS = 1000 * 60 * 60 * 12;
export async function createEventAccessSession(db: Database, eventId: string, pinVersion: number) {
    const rawToken = generateSessionToken();
    const sessionTokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + EVENT_ACCESS_TTL_MS);
    await db.insert(eventAccessSessions).values({
        eventId,
        sessionTokenHash,
        pinVersion,
        expiresAt,
    });
    return { rawToken, expiresAt };
}
export async function revokeEventAccessSessions(db: Database, eventId: string) {
    await db
        .update(eventAccessSessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(eventAccessSessions.eventId, eventId), isNull(eventAccessSessions.revokedAt)));
}
export async function resolveEventAccessSession(db: Database, rawToken: string | undefined, expectedEventId: string) {
    if (!rawToken) {
        return null;
    }
    const sessionTokenHash = hashToken(rawToken);
    const [session] = await db
        .select()
        .from(eventAccessSessions)
        .where(eq(eventAccessSessions.sessionTokenHash, sessionTokenHash))
        .limit(1);
    if (!session) {
        return null;
    }
    if (session.eventId !== expectedEventId) {
        return null;
    }
    if (session.revokedAt) {
        return null;
    }
    if (session.expiresAt.getTime() <= Date.now()) {
        return null;
    }
    const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, expectedEventId))
        .limit(1);
    if (!event) {
        return null;
    }
    if (event.pinVersion !== session.pinVersion) {
        return null;
    }
    if (event.status !== "open") {
        return null;
    }
    return { session, event };
}
export function buildEventAccessCookie(rawToken: string, expiresAt: Date, secure: boolean) {
    const parts = [
        `${EVENT_ACCESS_COOKIE}=${encodeURIComponent(rawToken)}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        `Expires=${expiresAt.toUTCString()}`,
    ];
    if (secure) {
        parts.push("Secure");
    }
    return parts.join("; ");
}
export function clearEventAccessCookie(secure: boolean) {
    const parts = [
        `${EVENT_ACCESS_COOKIE}=`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ];
    if (secure) {
        parts.push("Secure");
    }
    return parts.join("; ");
}
export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
    if (!cookieHeader)
        return undefined;
    const parts = cookieHeader.split(";");
    for (const part of parts) {
        const [rawKey, ...rest] = part.trim().split("=");
        if (rawKey === name) {
            return decodeURIComponent(rest.join("="));
        }
    }
    return undefined;
}
