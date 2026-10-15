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
      privacyContactEmail: app.env.PRIVACY_CONTACT_EMAIL ?? null,
    });
  });

  app.get("/api/organizer/me", async (request, reply) => {
    const session = await requireOrganizerSession(auth, request, reply);
    if (!session) return;
    return reply.send({
      user: session.user,
    });
  });

  app.post("/api/organizer/privacy/erasure-request", async (request, reply) => {
    const session = await requireOrganizerSession(auth, request, reply);
    if (!session) return;

    const contact = app.env.PRIVACY_CONTACT_EMAIL;
    app.log.info(
      {
        event: "account_erasure_request",
        userId: session.user.id,
        contactConfigured: Boolean(contact),
      },
      "Organizer requested account erasure (manual process)",
    );

    if (contact) {
      try {
        await app.email.send({
          to: contact,
          subject: "Pomagappka — wniosek o usunięcie konta",
          text: `Wniosek o usunięcie konta organizatora.\nUser ID: ${session.user.id}\nE-mail konta: ${session.user.email}\n\nUsunięcie nie jest automatyczne — wymaga ręcznej weryfikacji i procedury retencji.`,
          html: `<p>Wniosek o usunięcie konta organizatora.</p><p>User ID: ${session.user.id}</p><p>E-mail konta: ${session.user.email}</p><p>Usunięcie nie jest automatyczne — wymaga ręcznej weryfikacji.</p>`,
          idempotencyKey: `erasure-request:${session.user.id}:${new Date().toISOString().slice(0, 10)}`,
        });
      } catch {
        app.log.warn(
          { event: "account_erasure_request_email_failed", userId: session.user.id },
          "Failed to notify privacy contact about erasure request",
        );
      }
    }

    return reply.send({
      status: "received",
      automatedDeletion: false,
      message:
        "Wniosek przyjęty. Usunięcie konta nie jest wykonywane automatycznie — administrator skontaktuje się w sprawie dalszych kroków.",
    });
  });
}
