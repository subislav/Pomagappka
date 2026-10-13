import type { FastifyInstance } from "fastify";
import type { Auth } from "./auth.js";
export async function registerAuthRoutes(app: FastifyInstance, auth: Auth) {
    app.route({
        method: ["GET", "POST"],
        url: "/api/auth/*",
        async handler(request, reply) {
            const url = new URL(request.url, app.env.BETTER_AUTH_URL);
            const headers = new Headers();
            for (const [key, value] of Object.entries(request.headers)) {
                if (value === undefined)
                    continue;
                if (Array.isArray(value)) {
                    for (const item of value) {
                        headers.append(key, item);
                    }
                }
                else {
                    headers.append(key, value);
                }
            }
            const init: RequestInit = {
                method: request.method,
                headers,
            };
            if (request.method !== "GET" && request.method !== "HEAD") {
                init.body = JSON.stringify(request.body ?? {});
                headers.set("content-type", "application/json");
            }
            const response = await auth.handler(new Request(url.toString(), init));
            reply.status(response.status);
            response.headers.forEach((value, key) => {
                reply.header(key, value);
            });
            const text = await response.text();
            if (!text) {
                return reply.send(null);
            }
            const contentType = response.headers.get("content-type") ?? "";
            if (contentType.includes("application/json")) {
                return reply.send(JSON.parse(text) as unknown);
            }
            return reply.send(text);
        },
    });
}
