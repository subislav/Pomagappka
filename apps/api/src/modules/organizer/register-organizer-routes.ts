import type { FastifyInstance } from "fastify";
import type { Auth } from "../auth/auth.js";
import { isGoogleAuthEnabled } from "../auth/auth.js";
import { requireOrganizerSession } from "../auth/session.js";

export async function registerOrganizerRoutes(
  app: FastifyInstance,
  auth: Auth,
) {
  app.get("/api/features", async (_request, reply) => {
    return reply.send({
      google: isGoogleAuthEnabled(app.env),
    });
  });

  app.get("/api/organizer/me", async (request, reply) => {
    const session = await requireOrganizerSession(auth, request, reply);
    if (!session) return;
    return reply.send({
      user: session.user,
    });
  });
}
