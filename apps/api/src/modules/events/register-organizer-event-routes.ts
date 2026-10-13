import { createEventBodySchema, updateEventBodySchema, } from "@pomagappka/shared";
import type { FastifyInstance } from "fastify";
import type { Auth } from "../auth/auth.js";
import { requireOrganizerSession } from "../auth/session.js";
import { AppError, toErrorBody } from "../../lib/errors.js";
import { closeOrganizerEvent, createOrganizerEvent, getOrganizerEvent, listOrganizerEvents, regenerateOrganizerPin, softDeleteOrganizerEvent, updateOrganizerEvent, } from "./event-service.js";
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
    log.error(error, "Organizer event route failed");
    return reply.status(500).send({
        error: {
            code: "INTERNAL_ERROR",
            message: "Wystąpił nieoczekiwany błąd.",
        },
    });
}
export async function registerOrganizerEventRoutes(app: FastifyInstance, auth: Auth) {
    app.get("/api/organizer/events", async (request, reply) => {
        const session = await requireOrganizerSession(auth, request, reply);
        if (!session)
            return;
        const events = await listOrganizerEvents(app.db, session.user.id);
        return reply.send({ events });
    });
    app.post("/api/organizer/events", async (request, reply) => {
        const session = await requireOrganizerSession(auth, request, reply);
        if (!session)
            return;
        const parsed = createEventBodySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Nieprawidłowe dane wydarzenia.",
                },
            });
        }
        try {
            const result = await createOrganizerEvent(app.db, app.env, session.user.id, parsed.data);
            return reply.status(201).send(result);
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
    app.get("/api/organizer/events/:id", async (request, reply) => {
        const session = await requireOrganizerSession(auth, request, reply);
        if (!session)
            return;
        const { id } = request.params as {
            id: string;
        };
        try {
            const event = await getOrganizerEvent(app.db, app.env, session.user.id, id);
            return reply.send({ event });
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
    app.patch("/api/organizer/events/:id", async (request, reply) => {
        const session = await requireOrganizerSession(auth, request, reply);
        if (!session)
            return;
        const { id } = request.params as {
            id: string;
        };
        const parsed = updateEventBodySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Nieprawidłowe dane wydarzenia.",
                },
            });
        }
        try {
            const event = await updateOrganizerEvent(app.db, app.env, session.user.id, id, parsed.data);
            return reply.send({ event });
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
    app.post("/api/organizer/events/:id/close", async (request, reply) => {
        const session = await requireOrganizerSession(auth, request, reply);
        if (!session)
            return;
        const { id } = request.params as {
            id: string;
        };
        try {
            const event = await closeOrganizerEvent(app.db, app.env, session.user.id, id);
            return reply.send({ event });
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
    app.delete("/api/organizer/events/:id", async (request, reply) => {
        const session = await requireOrganizerSession(auth, request, reply);
        if (!session)
            return;
        const { id } = request.params as {
            id: string;
        };
        try {
            await softDeleteOrganizerEvent(app.db, session.user.id, id);
            return reply.status(204).send();
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
    app.post("/api/organizer/events/:id/pin/regenerate", async (request, reply) => {
        const session = await requireOrganizerSession(auth, request, reply);
        if (!session)
            return;
        const { id } = request.params as {
            id: string;
        };
        try {
            const result = await regenerateOrganizerPin(app.db, session.user.id, id);
            return reply.send(result);
        }
        catch (error) {
            return handleRouteError(error, reply, request.log);
        }
    });
}
