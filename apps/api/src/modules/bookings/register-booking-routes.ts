import { cancelBookingBodySchema, createBookingBodySchema, putSlotsBodySchema, } from "@pomagappka/shared";
import type { FastifyInstance } from "fastify";
import type { Auth } from "../auth/auth.js";
import { requireOrganizerSession } from "../auth/session.js";
import { AppError, toErrorBody } from "../../lib/errors.js";
import { EVENT_ACCESS_COOKIE, readCookie, resolveEventAccessSession, } from "../events/access-session.js";
import { findEventByInvitationToken } from "../events/event-service.js";
import { cancelBookingByToken, createBooking, createOrganizerBooking, listOrganizerBookings, } from "./booking-service.js";
import { listOrganizerSlots, listParticipantSlots, putOrganizerSlots, } from "./slot-service.js";
function handleRouteError(error: unknown, reply: {
    status: (code: number) => {
        send: (body: unknown) => unknown;
    };
}, log: {
    error: (obj: unknown, msg: string) => void;
}) {
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send(toErrorBody(error));
    }
    log.error(error, "Booking route failed");
    return reply.status(500).send({
        error: {
            code: "INTERNAL_ERROR",
            message: "Wystąpił nieoczekiwany błąd.",
        },
    });
}
async function requireInviteAccess(app: FastifyInstance, token: string, cookieHeader: string | undefined) {
    const event = await findEventByInvitationToken(app.db, token);
    if (!event || event.status === "deleted") {
        throw new AppError(404, "NOT_FOUND", "Nie znaleziono zaproszenia.");
    }
    if (event.status !== "open") {
        throw new AppError(403, "EVENT_CLOSED", "Wydarzenie jest zamknięte.");
    }
    const raw = readCookie(cookieHeader, EVENT_ACCESS_COOKIE);
    const access = await resolveEventAccessSession(app.db, raw, event.id);
    if (!access) {
        throw new AppError(401, "UNAUTHORIZED", "Wymagane potwierdzenie PIN.");
    }
    return access;
}
export async function registerBookingRoutes(app: FastifyInstance, auth: Auth) {
    app.get("/api/organizer/events/:id/slots", async (request, reply) => {
        const session = await requireOrganizerSession(auth, request, reply);
        if (!session)
            return;
        const { id } = request.params as {
            id: string;
        };
        try {
            const slots = await listOrganizerSlots(app.db, session.user.id, id);
            return reply.send({ slots });
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
    app.put("/api/organizer/events/:id/slots", async (request, reply) => {
        const session = await requireOrganizerSession(auth, request, reply);
        if (!session)
            return;
        const { id } = request.params as {
            id: string;
        };
        const parsed = putSlotsBodySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Nieprawidłowa lista terminów.",
                },
            });
        }
        try {
            const slots = await putOrganizerSlots(app.db, session.user.id, id, parsed.data);
            return reply.send({ slots });
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
    app.get("/api/organizer/events/:id/bookings", async (request, reply) => {
        const session = await requireOrganizerSession(auth, request, reply);
        if (!session)
            return;
        const { id } = request.params as {
            id: string;
        };
        try {
            const bookings = await listOrganizerBookings(app.db, session.user.id, id);
            return reply.send({ bookings });
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
    app.post("/api/organizer/events/:id/bookings", async (request, reply) => {
        const session = await requireOrganizerSession(auth, request, reply);
        if (!session)
            return;
        const { id } = request.params as {
            id: string;
        };
        const parsed = createBookingBodySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Nieprawidłowe dane rezerwacji.",
                },
            });
        }
        try {
            const result = await createOrganizerBooking(app.db, app.env, app.email, session.user.id, id, parsed.data);
            return reply.status(result.reused ? 200 : 201).send({
                booking: result.booking,
                cancelToken: result.cancelToken,
                cancelUrl: result.cancelUrl,
            });
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
    app.get("/api/invite/:token/slots", async (request, reply) => {
        const { token } = request.params as {
            token: string;
        };
        try {
            const access = await requireInviteAccess(app, token, request.headers.cookie);
            const slots = await listParticipantSlots(app.db, access.event.id);
            return reply.send({ slots });
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
    app.post("/api/invite/:token/bookings", async (request, reply) => {
        const { token } = request.params as {
            token: string;
        };
        const parsed = createBookingBodySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Nieprawidłowe dane rezerwacji.",
                },
            });
        }
        try {
            const access = await requireInviteAccess(app, token, request.headers.cookie);
            const result = await createBooking(app.db, app.env, app.email, {
                eventId: access.event.id,
                input: parsed.data,
            });
            return reply.status(result.reused ? 200 : 201).send({
                booking: result.booking,
                cancelToken: result.cancelToken,
                cancelUrl: result.cancelUrl,
            });
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
    app.post("/api/bookings/cancel", async (request, reply) => {
        const parsed = cancelBookingBodySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Nieprawidłowy token anulowania.",
                },
            });
        }
        try {
            const booking = await cancelBookingByToken(app.db, app.email, parsed.data.token);
            return reply.send({
                ok: true as const,
                booking: {
                    id: booking.id,
                    slotDate: booking.slotDate,
                    status: booking.status,
                },
            });
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
}
