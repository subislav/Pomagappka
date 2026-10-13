import { describe, expect, it } from "vitest";
import { generateFourDigitPin, generateInvitationToken, hashPin, hashToken, verifyPin, } from "./crypto.js";
describe("crypto helpers", () => {
    it("generates invitation tokens with >= 128 bits of entropy encoding", () => {
        const token = generateInvitationToken();
        expect(token.length).toBeGreaterThanOrEqual(22);
        expect(token).not.toMatch(/[+/=]/);
    });
    it("generates a 4-digit PIN", () => {
        const pin = generateFourDigitPin();
        expect(pin).toMatch(/^\d{4}$/);
    });
    it("hashes and verifies PIN with Argon2id", async () => {
        const pin = "4821";
        const hashed = await hashPin(pin);
        expect(hashed).not.toContain(pin);
        expect(await verifyPin(hashed, pin)).toBe(true);
        expect(await verifyPin(hashed, "0000")).toBe(false);
    });
    it("hashes tokens deterministically", () => {
        expect(hashToken("abc")).toBe(hashToken("abc"));
        expect(hashToken("abc")).not.toBe(hashToken("abcd"));
    });
});
