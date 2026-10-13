import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import * as argon2 from "argon2";
export function generateInvitationToken(): string {
    return randomBytes(16).toString("base64url");
}
export function generateFourDigitPin(): string {
    return randomInt(0, 10000).toString().padStart(4, "0");
}
export async function hashPin(pin: string): Promise<string> {
    return argon2.hash(pin, { type: argon2.argon2id });
}
export async function verifyPin(pinHash: string, pin: string): Promise<boolean> {
    try {
        return await argon2.verify(pinHash, pin);
    }
    catch {
        return false;
    }
}
export function generateSessionToken(): string {
    return randomBytes(32).toString("base64url");
}
export function hashToken(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
}
export function hashIp(ip: string, pepper: string): string {
    return createHmac("sha256", pepper).update(ip).digest("hex");
}
export function fingerprintInvitationToken(token: string): string {
    return hashToken(token);
}
