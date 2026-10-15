import { loadEnv } from "./config/env.js";
import { buildApp } from "./app.js";
import { processDeliveryReminders } from "./modules/notifications/reminder-service.js";
import { runPrivacyCleanup } from "./modules/privacy/cleanup-service.js";

const REMINDER_INTERVAL_MS = 15 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function main() {
  const env = loadEnv();
  const app = await buildApp(env);
  let reminderTimer: ReturnType<typeof setInterval> | undefined;
  let cleanupTimer: ReturnType<typeof setInterval> | undefined;

  const runReminders = async () => {
    try {
      const result = await processDeliveryReminders(app.db, app.email);
      if (result.participantSent > 0 || result.organizerSent > 0) {
        app.log.info(
          {
            participantSent: result.participantSent,
            organizerSent: result.organizerSent,
          },
          "Delivery reminders processed",
        );
      }
    } catch (error) {
      app.log.error(error, "Delivery reminder job failed");
    }
  };

  const runCleanup = async () => {
    if (!env.PRIVACY_CLEANUP_ENABLED) return;
    try {
      const result = await runPrivacyCleanup(app.db, {
        dryRun: env.PRIVACY_CLEANUP_DRY_RUN,
        pinAttemptRetentionDays: env.PRIVACY_PIN_ATTEMPT_RETENTION_DAYS,
        notificationRetentionDays: env.PRIVACY_NOTIFICATION_RETENTION_DAYS,
      });
      if (
        result.pinAttemptsDeleted > 0 ||
        result.notificationsDeleted > 0 ||
        result.cancelledBookingsAnonymized > 0
      ) {
        app.log.info(result, "Privacy cleanup processed");
      }
    } catch (error) {
      app.log.error(error, "Privacy cleanup job failed");
    }
  };

  app.addHook("onClose", async () => {
    if (reminderTimer) clearInterval(reminderTimer);
    if (cleanupTimer) clearInterval(cleanupTimer);
  });

  try {
    await app.listen({ host: env.HOST, port: env.PORT });
    app.log.info({ host: env.HOST, port: env.PORT }, "Pomagappka API listening");
    void runReminders();
    void runCleanup();
    reminderTimer = setInterval(() => {
      void runReminders();
    }, REMINDER_INTERVAL_MS);
    reminderTimer.unref?.();
    cleanupTimer = setInterval(() => {
      void runCleanup();
    }, CLEANUP_INTERVAL_MS);
    cleanupTimer.unref?.();
  } catch (error) {
    app.log.error(error, "Failed to start API");
    process.exit(1);
  }
}

main();
