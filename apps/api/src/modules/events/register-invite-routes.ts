import { verifyPinBodySchema } from "@pomagappka/shared";
import type { FastifyInstance } from "fastify";
import { AppError, toErrorBody } from "../../lib/errors.js";
import { EVENT_ACCESS_COOKIE, buildEventAccessCookie, clearEventAccessCookie, readCookie, resolveEventAccessSession, } from "./access-session.js";
import { findEventByInvitationToken } from "./event-service.js";
import { listEventUpdates } from "./event-update-service.js";
import { toParticipantEvent } from "./mappers.js";
import { PIN_LOCKOUT_RETRY_AFTER_SEC } from "./pin-rate-limit.js";
import { verifyInvitationPin } from "./pin-verify.js";
function clientIp(request: {
    ip: string;
    headers: Record<string, string | string[] | undefined>;
}): string {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
        return forwarded.split(",")[0]?.trim() || request.ip;
    }
    return request.ip;
}
function handleRouteError(error: unknown, reply: {
    header: (name: string, value: string | number) => unknown;
    status: (code: number) => {
        send: (body: unknown) => unknown;
    };
}, log: {
    error: (obj: unknown, msg: string) => void;
}) {
    if (error instanceof AppError) {
        if (error.statusCode === 429) {
            reply.header("retry-after", PIN_LOCKOUT_RETRY_AFTER_SEC);
        }
        return reply.status(error.statusCode).send(toErrorBody(error));
    }
    log.error(error, "Invite route failed");
    return reply.status(500).send({
        error: {
            code: "INTERNAL_ERROR",
            message: "Wystąpił nieoczekiwany błąd.",
        },
    });
}
export async function registerInviteRoutes(app: FastifyInstance) {
    app.post("/api/invite/:token/verify-pin", async (request, reply) => {
        const { token } = request.params as {
            token: string;
        };
        const parsed = verifyPinBodySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "PIN musi składać się z 4 cyfr.",
                },
            });
        }
        try {
            const result = await verifyInvitationPin(app.db, app.env, {
                invitationToken: token,
                pin: parsed.data.pin,
                ip: clientIp(request),
            });
            reply.header("set-cookie", buildEventAccessCookie(result.access.rawToken, result.access.expiresAt, app.env.NODE_ENV === "production"));
            return reply.send({
                ok: true,
                event: toParticipantEvent(result.event),
            });
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
    app.post("/api/invite/:token/logout", async (request, reply) => {
        reply.header("set-cookie", clearEventAccessCookie(app.env.NODE_ENV === "production"));
        return reply.send({ ok: true });
    });
    app.get("/api/invite/:token/event", async (request, reply) => {
        const { token } = request.params as {
            token: string;
        };
        try {
            const event = await findEventByInvitationToken(app.db, token);
            if (!event || event.status === "deleted") {
                return reply.status(404).send({
                    error: {
                        code: "NOT_FOUND",
                        message: "Nie znaleziono zaproszenia.",
                    },
                });
            }
            const raw = readCookie(request.headers.cookie, EVENT_ACCESS_COOKIE);
            const access = await resolveEventAccessSession(app.db, raw, event.id);
            if (!access) {
                return reply.status(401).send({
                    error: {
                        code: "UNAUTHORIZED",
                        message: "Wymagane potwierdzenie PIN.",
                    },
                });
            }
            return reply.send({
                event: toParticipantEvent(access.event),
            });
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
    app.get("/api/invite/:token/updates", async (request, reply) => {
        const { token } = request.params as {
            token: string;
        };
        try {
            const event = await findEventByInvitationToken(app.db, token);
            if (!event || event.status === "deleted") {
                return reply.status(404).send({
                    error: {
                        code: "NOT_FOUND",
                        message: "Nie znaleziono zaproszenia.",
                    },
                });
            }
            const raw = readCookie(request.headers.cookie, EVENT_ACCESS_COOKIE);
            const access = await resolveEventAccessSession(app.db, raw, event.id);
            if (!access) {
                return reply.status(401).send({
                    error: {
                        code: "UNAUTHORIZED",
                        message: "Wymagane potwierdzenie PIN.",
                    },
                });
            }
            const updates = await listEventUpdates(app.db, access.event.id);
            return reply.send({ updates });
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
}
