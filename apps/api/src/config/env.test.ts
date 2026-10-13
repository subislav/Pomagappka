import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.js";
const baseEnv = {
    DATABASE_URL: "postgresql://pomagappka:pomagappka@db:5432/pomagappka",
    BETTER_AUTH_SECRET: "dev-secret-at-least-32-characters-long",
    BETTER_AUTH_URL: "http://localhost:5173",
};
describe("loadEnv", () => {
    it("loads required DATABASE_URL with defaults", () => {
        const env = loadEnv(baseEnv);
        expect(env.PORT).toBe(3000);
        expect(env.EMAIL_PROVIDER).toBe("smtp");
        expect(env.BETTER_AUTH_URL).toBe("http://localhost:5173");
    });
    it("rejects missing DATABASE_URL", () => {
        expect(() => loadEnv({
            BETTER_AUTH_SECRET: baseEnv.BETTER_AUTH_SECRET,
            BETTER_AUTH_URL: baseEnv.BETTER_AUTH_URL,
        })).toThrow(/DATABASE_URL/);
    });
    it("rejects short BETTER_AUTH_SECRET", () => {
        expect(() => loadEnv({
            ...baseEnv,
            BETTER_AUTH_SECRET: "too-short",
        })).toThrow(/BETTER_AUTH_SECRET/);
    });
    it("requires RESEND_API_KEY when provider is resend", () => {
        expect(() => loadEnv({
            ...baseEnv,
            EMAIL_PROVIDER: "resend",
        })).toThrow(/RESEND_API_KEY/);
    });
});
