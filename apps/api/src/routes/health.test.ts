import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerHealthRoutes } from "./health.js";
describe("GET /health", () => {
    it("returns 200 when database is up", async () => {
        const app = Fastify();
        await registerHealthRoutes(app, {
            checkDatabase: async () => true,
        });
        const response = await app.inject({ method: "GET", url: "/api/health" });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
            status: "ok",
            service: "pomagappka-api",
            checks: { database: "up" },
        });
        await app.close();
    });
    it("returns 503 when database is down", async () => {
        const app = Fastify();
        await registerHealthRoutes(app, {
            checkDatabase: async () => false,
        });
        const response = await app.inject({ method: "GET", url: "/health" });
        expect(response.statusCode).toBe(503);
        expect(response.json()).toMatchObject({
            status: "degraded",
            checks: { database: "down" },
        });
        await app.close();
    });
});
