import { and, eq, gte, sql } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import { pinVerificationAttempts } from "../../db/schema/domain.js";
import { AppError } from "../../lib/errors.js";
import {
  fingerprintInvitationToken,
  hashIp,
} from "../../lib/crypto.js";

export const PIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_EVENT_IP = 5;
const MAX_FAILURES_PER_IP_WINDOW = 20;
export const PIN_LOCKOUT_RETRY_AFTER_SEC = Math.ceil(
  PIN_RATE_LIMIT_WINDOW_MS / 1000,
);

const PIN_RESET_REQUIRED_MESSAGE =
  "Zbyt wiele nieudanych prób z tego adresu IP. Organizator musi wygenerować nowy PIN, aby odblokować dostęp.";

export async function assertPinAttemptAllowed(
  db: Database,
  opts: {
    invitationToken: string;
    eventId: string | null;
    pinVersion: number | null;
    ip: string;
    pepper: string;
  },
) {
  const ipHash = hashIp(opts.ip, opts.pepper);
  const since = new Date(Date.now() - PIN_RATE_LIMIT_WINDOW_MS);

  const [ipStats] = await db
    .select({
      failures: sql<number>`count(*)::int`,
    })
    .from(pinVerificationAttempts)
    .where(
      and(
        eq(pinVerificationAttempts.ipHash, ipHash),
        eq(pinVerificationAttempts.succeeded, false),
        gte(pinVerificationAttempts.createdAt, since),
      ),
    );

  if ((ipStats?.failures ?? 0) >= MAX_FAILURES_PER_IP_WINDOW) {
    throw new AppError(
      429,
      "TOO_MANY_ATTEMPTS",
      "Zbyt wiele prób. Spróbuj ponownie później.",
    );
  }

  if (opts.eventId && opts.pinVersion != null) {
    const [eventStats] = await db
      .select({
        failures: sql<number>`count(*)::int`,
      })
      .from(pinVerificationAttempts)
      .where(
        and(
          eq(pinVerificationAttempts.eventId, opts.eventId),
          eq(pinVerificationAttempts.ipHash, ipHash),
          eq(pinVerificationAttempts.pinVersion, opts.pinVersion),
          eq(pinVerificationAttempts.succeeded, false),
        ),
      );

    if ((eventStats?.failures ?? 0) >= MAX_FAILURES_PER_EVENT_IP) {
      throw new AppError(429, "PIN_RESET_REQUIRED", PIN_RESET_REQUIRED_MESSAGE);
    }
  }

  return {
    ipHash,
    invitationTokenFingerprint: fingerprintInvitationToken(
      opts.invitationToken,
    ),
  };
}

export async function recordPinAttempt(
  db: Database,
  opts: {
    eventId: string | null;
    pinVersion: number | null;
    invitationTokenFingerprint: string;
    ipHash: string;
    succeeded: boolean;
  },
) {
  await db.insert(pinVerificationAttempts).values({
    eventId: opts.eventId,
    pinVersion: opts.pinVersion,
    invitationTokenFingerprint: opts.invitationTokenFingerprint,
    ipHash: opts.ipHash,
    succeeded: opts.succeeded,
  });
}
