import { describe, expect, it } from "vitest";
import { buildApp } from "../../app.js";
import { loadEnv } from "../../config/env.js";
const hasDatabase = Boolean(process.env.DATABASE_URL);
describe("organizer authorization", () => {
    it.skipIf(!hasDatabase)("rejects unauthenticated access to /api/organizer/me", async () => {
        const env = loadEnv({
            ...process.env,
            BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ??
                "dev-secret-at-least-32-characters-long",
            BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:5173",
            APP_URL: process.env.APP_URL ?? "http://localhost:5173",
            API_URL: process.env.API_URL ?? "http://localhost:3000",
        });
        const app = await buildApp(env);
        const response = await app.inject({
            method: "GET",
            url: "/api/organizer/me",
        });
        expect(response.statusCode).toBe(401);
        expect(response.json()).toMatchObject({
            error: { code: "UNAUTHORIZED" },
        });
        await app.close();
    });
    it("documents that authz tests require DATABASE_URL", () => {
        expect(typeof hasDatabase).toBe("boolean");
    });
});
