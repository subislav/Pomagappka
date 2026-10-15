import { describe, expect, it } from "vitest";
import { runPrivacyCleanup } from "./cleanup-service.js";

describe("runPrivacyCleanup", () => {
  it("exports a cleanup function with dry-run support", () => {
    expect(typeof runPrivacyCleanup).toBe("function");
    expect(runPrivacyCleanup.length).toBe(2);
  });
});
