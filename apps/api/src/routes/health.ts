import type { HealthResponse } from "@pomagappka/shared";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
type HealthDeps = {
    checkDatabase: () => Promise<boolean>;
};
export async function registerHealthRoutes(app: FastifyInstance, deps: HealthDeps) {
    async function handler(_request: FastifyRequest, reply: FastifyReply) {
        const databaseUp = await deps.checkDatabase();
        const body: HealthResponse = {
            status: databaseUp ? "ok" : "degraded",
            service: "pomagappka-api",
            timestamp: new Date().toISOString(),
            checks: {
                database: databaseUp ? "up" : "down",
            },
        };
        return reply.status(databaseUp ? 200 : 503).send(body);
    }
    app.get("/api/health", handler);
    app.get("/health", handler);
}
