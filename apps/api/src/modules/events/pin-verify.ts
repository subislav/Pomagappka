import type { Database } from "../../db/client.js";
import type { Env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { verifyPin } from "../../lib/crypto.js";
import { createEventAccessSession } from "./access-session.js";
import { findEventByInvitationToken } from "./event-service.js";
import {
  assertPinAttemptAllowed,
  recordPinAttempt,
} from "./pin-rate-limit.js";

export async function verifyInvitationPin(
  db: Database,
  env: Env,
  opts: {
    invitationToken: string;
    pin: string;
    ip: string;
  },
) {
  const event = await findEventByInvitationToken(db, opts.invitationToken);
  const attemptMeta = await assertPinAttemptAllowed(db, {
    invitationToken: opts.invitationToken,
    eventId: event?.id ?? null,
    pinVersion: event?.pinVersion ?? null,
    ip: opts.ip,
    pepper: env.BETTER_AUTH_SECRET,
  });

  if (!event || event.status !== "open") {
    await recordPinAttempt(db, {
      eventId: event?.id ?? null,
      pinVersion: event?.pinVersion ?? null,
      invitationTokenFingerprint: attemptMeta.invitationTokenFingerprint,
      ipHash: attemptMeta.ipHash,
      succeeded: false,
    });
    throw new AppError(404, "NOT_FOUND", "Nie znaleziono zaproszenia.");
  }

  const ok = await verifyPin(event.pinHash, opts.pin);
  await recordPinAttempt(db, {
    eventId: event.id,
    pinVersion: event.pinVersion,
    invitationTokenFingerprint: attemptMeta.invitationTokenFingerprint,
    ipHash: attemptMeta.ipHash,
    succeeded: ok,
  });

  if (!ok) {
    try {
      await assertPinAttemptAllowed(db, {
        invitationToken: opts.invitationToken,
        eventId: event.id,
        pinVersion: event.pinVersion,
        ip: opts.ip,
        pepper: env.BETTER_AUTH_SECRET,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
    }
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Nie udało się zweryfikować dostępu.",
    );
  }

  const access = await createEventAccessSession(
    db,
    event.id,
    event.pinVersion,
  );
  return { event, access };
}
