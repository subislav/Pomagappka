import { and, eq, lt, sql } from "drizzle-orm";
import type { Database } from "../../db/client.js";
import {
  bookings,
  notificationDeliveries,
  pinVerificationAttempts,
} from "../../db/schema/domain.js";

export type PrivacyCleanupResult = {
  dryRun: boolean;
  pinAttemptsDeleted: number;
  notificationsDeleted: number;
  cancelledBookingsAnonymized: number;
};

export async function runPrivacyCleanup(
  db: Database,
  options: {
    dryRun: boolean;
    pinAttemptRetentionDays: number;
    notificationRetentionDays: number;
    anonymizeCancelledBookingsOlderThanDays?: number;
  },
): Promise<PrivacyCleanupResult> {
  const pinCutoff = new Date(
    Date.now() - options.pinAttemptRetentionDays * 24 * 60 * 60 * 1000,
  );
  const notificationCutoff = new Date(
    Date.now() - options.notificationRetentionDays * 24 * 60 * 60 * 1000,
  );

  if (options.dryRun) {
    const pinRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pinVerificationAttempts)
      .where(lt(pinVerificationAttempts.createdAt, pinCutoff));
    const notificationRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificationDeliveries)
      .where(lt(notificationDeliveries.createdAt, notificationCutoff));
    const pinCount = pinRows[0]?.count ?? 0;
    const notificationCount = notificationRows[0]?.count ?? 0;

    let cancelledBookingsAnonymized = 0;
    if (options.anonymizeCancelledBookingsOlderThanDays) {
      const bookingCutoff = new Date(
        Date.now() -
          options.anonymizeCancelledBookingsOlderThanDays * 24 * 60 * 60 * 1000,
      );
      const bookingRows = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(
          and(
            eq(bookings.status, "cancelled"),
            lt(bookings.updatedAt, bookingCutoff),
            sql`${bookings.participantEmail} <> 'redacted@invalid.local'`,
          ),
        );
      cancelledBookingsAnonymized = bookingRows[0]?.count ?? 0;
    }

    return {
      dryRun: true,
      pinAttemptsDeleted: pinCount,
      notificationsDeleted: notificationCount,
      cancelledBookingsAnonymized,
    };
  }

  const deletedPins = await db
    .delete(pinVerificationAttempts)
    .where(lt(pinVerificationAttempts.createdAt, pinCutoff))
    .returning({ id: pinVerificationAttempts.id });

  const deletedNotifications = await db
    .delete(notificationDeliveries)
    .where(lt(notificationDeliveries.createdAt, notificationCutoff))
    .returning({ id: notificationDeliveries.id });

  let cancelledBookingsAnonymized = 0;
  if (options.anonymizeCancelledBookingsOlderThanDays) {
    const bookingCutoff = new Date(
      Date.now() -
        options.anonymizeCancelledBookingsOlderThanDays * 24 * 60 * 60 * 1000,
    );
    const anonymized = await db
      .update(bookings)
      .set({
        participantName: "[usunięto]",
        participantEmail: "redacted@invalid.local",
        mealDescription: null,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(bookings.status, "cancelled"),
          lt(bookings.updatedAt, bookingCutoff),
          sql`${bookings.participantEmail} <> 'redacted@invalid.local'`,
        ),
      )
      .returning({ id: bookings.id });
    cancelledBookingsAnonymized = anonymized.length;
  }

  return {
    dryRun: false,
    pinAttemptsDeleted: deletedPins.length,
    notificationsDeleted: deletedNotifications.length,
    cancelledBookingsAnonymized,
  };
}
