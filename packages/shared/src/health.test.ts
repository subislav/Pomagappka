import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "./health.js";
describe("healthResponseSchema", () => {
    it("accepts a healthy payload", () => {
        const parsed = healthResponseSchema.parse({
            status: "ok",
            service: "pomagappka-api",
            timestamp: "2026-10-13T20:00:00.000Z",
            checks: { database: "up" },
        });
        expect(parsed.status).toBe("ok");
    });
    it("rejects an unknown service name", () => {
        expect(() => healthResponseSchema.parse({
            status: "ok",
            service: "other",
            timestamp: "2026-10-13T20:00:00.000Z",
            checks: { database: "up" },
        })).toThrow();
    });
});
