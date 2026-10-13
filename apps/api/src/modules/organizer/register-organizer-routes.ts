import type { FastifyInstance } from "fastify";
import type { Auth } from "../auth/auth.js";
import { requireOrganizerSession } from "../auth/session.js";
export async function registerOrganizerRoutes(app: FastifyInstance, auth: Auth) {
    app.get("/api/organizer/me", async (request, reply) => {
        const session = await requireOrganizerSession(auth, request, reply);
        if (!session)
            return;
        return reply.send({
            user: session.user,
        });
    });
}
