import { describe, expect, it } from "vitest";
import { warsawDatePlusDays } from "./reminder-service.js";
describe("warsawDatePlusDays", () => {
    it("returns tomorrow in Europe/Warsaw calendar date", () => {
        const noonUtc = new Date("2026-06-15T12:00:00.000Z");
        expect(warsawDatePlusDays(0, noonUtc)).toBe("2026-06-15");
        expect(warsawDatePlusDays(1, noonUtc)).toBe("2026-06-16");
    });
});
