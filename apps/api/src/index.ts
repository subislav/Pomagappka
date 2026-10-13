import { loadEnv } from "./config/env.js";
import { buildApp } from "./app.js";
async function main() {
    const env = loadEnv();
    const app = await buildApp(env);
    try {
        await app.listen({ host: env.HOST, port: env.PORT });
        app.log.info({ host: env.HOST, port: env.PORT }, "Pomagappka API listening");
    }
    catch (error) {
        app.log.error(error, "Failed to start API");
        process.exit(1);
    }
}
main();
