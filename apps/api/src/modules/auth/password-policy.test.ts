import { describe, expect, it } from "vitest";
import { assertPasswordPolicy } from "./password-policy.js";

describe("password policy", () => {
  it("accepts strong passwords", () => {
    expect(() => assertPasswordPolicy("Haslo123")).not.toThrow();
  });

  it("rejects weak passwords", () => {
    expect(() => assertPasswordPolicy("haslo12345")).toThrow();
    expect(() => assertPasswordPolicy("HASLO12345")).toThrow();
    expect(() => assertPasswordPolicy("HasloHaslo")).toThrow();
    expect(() => assertPasswordPolicy("Ha1")).toThrow();
  });
});
