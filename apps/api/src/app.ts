import Fastify from "fastify";
import type { Env } from "./config/env.js";
import { checkDatabase, createDb } from "./db/client.js";
import { createEmailSender } from "./email/create-sender.js";
import type { EmailSender } from "./email/types.js";
import { createAuth, type Auth } from "./modules/auth/auth.js";
import { registerAuthRoutes } from "./modules/auth/register-auth-routes.js";
import { registerBookingRoutes } from "./modules/bookings/register-booking-routes.js";
import { registerInviteRoutes } from "./modules/events/register-invite-routes.js";
import { registerOrganizerEventRoutes } from "./modules/events/register-organizer-event-routes.js";
import { registerOrganizerRoutes } from "./modules/organizer/register-organizer-routes.js";
import { registerHealthRoutes } from "./routes/health.js";

export type BuildAppOptions = {
  email?: EmailSender;
};

export async function buildApp(env: Env, options: BuildAppOptions = {}) {
  const app = Fastify({
    trustProxy: true,
    logger: {
      level: env.LOG_LEVEL,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.body.pin",
          "req.body.password",
          "req.body.currentPassword",
          "req.body.newPassword",
          "req.body.participantEmail",
          "req.body.participantName",
          "req.body.email",
          "req.body.name",
          "req.body.dropOffAddress",
          "req.body.recipientPhone",
          "req.body.allergies",
          "req.body.dietaryPreferences",
          "req.body.dietaryOrAllergyNotes",
          "req.body.specialInstructions",
          "req.body.recipientDisplayName",
          "pin",
          "password",
          "pinHash",
          "cancelToken",
          "invitationToken",
          "participantEmail",
          "participantName",
          "email",
          "dropOffAddress",
          "recipientPhone",
          "allergies",
          "dietaryOrAllergyNotes",
          "*.pin",
          "*.password",
          "*.pinHash",
          "*.cancelToken",
          "*.invitationToken",
          "*.participantEmail",
          "*.email",
          "*.dropOffAddress",
          "*.recipientPhone",
          "*.allergies",
          "*.dietaryOrAllergyNotes",
        ],
        remove: true,
      },
    },
  });
  const { db, sql } = createDb(env);
  const email = options.email ?? createEmailSender(env);
  const auth = createAuth(db, env, email);
  app.decorate("db", db);
  app.decorate("sql", sql);
  app.decorate("env", env);
  app.decorate("auth", auth);
  app.decorate("email", email);
  app.addHook("onClose", async () => {
    await sql.end({ timeout: 5 });
  });
  await registerHealthRoutes(app, {
    checkDatabase: () => checkDatabase(sql),
  });
  await registerAuthRoutes(app, auth);
  await registerOrganizerRoutes(app, auth);
  await registerOrganizerEventRoutes(app, auth);
  await registerInviteRoutes(app);
  await registerBookingRoutes(app, auth);
  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    db: ReturnType<typeof createDb>["db"];
    sql: ReturnType<typeof createDb>["sql"];
    env: Env;
    auth: Auth;
    email: EmailSender;
  }
}
