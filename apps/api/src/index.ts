import { loadEnv } from "./config/env.js";
import { buildApp } from "./app.js";
import { processDeliveryReminders } from "./modules/notifications/reminder-service.js";
const REMINDER_INTERVAL_MS = 15 * 60 * 1000;
async function main() {
    const env = loadEnv();
    const app = await buildApp(env);
    let timer: ReturnType<typeof setInterval> | undefined;
    const runReminders = async () => {
        try {
            const result = await processDeliveryReminders(app.db, app.email);
            if (result.participantSent > 0 || result.organizerSent > 0) {
                app.log.info(result, "Delivery reminders processed");
            }
        }
        catch (error) {
            app.log.error(error, "Delivery reminder job failed");
        }
    };
    app.addHook("onClose", async () => {
        if (timer) {
            clearInterval(timer);
        }
    });
    try {
        await app.listen({ host: env.HOST, port: env.PORT });
        app.log.info({ host: env.HOST, port: env.PORT }, "Pomagappka API listening");
        void runReminders();
        timer = setInterval(() => {
            void runReminders();
        }, REMINDER_INTERVAL_MS);
        timer.unref?.();
    }
    catch (error) {
        app.log.error(error, "Failed to start API");
        process.exit(1);
    }
}
main();
