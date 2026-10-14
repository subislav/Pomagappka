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
    expect(() =>
      loadEnv({
        BETTER_AUTH_SECRET: baseEnv.BETTER_AUTH_SECRET,
        BETTER_AUTH_URL: baseEnv.BETTER_AUTH_URL,
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it("rejects short BETTER_AUTH_SECRET", () => {
    expect(() =>
      loadEnv({
        ...baseEnv,
        BETTER_AUTH_SECRET: "too-short",
      }),
    ).toThrow(/BETTER_AUTH_SECRET/);
  });

  it("requires RESEND_API_KEY when provider is resend", () => {
    expect(() =>
      loadEnv({
        ...baseEnv,
        EMAIL_PROVIDER: "resend",
      }),
    ).toThrow(/RESEND_API_KEY/);
  });

  it("requires https URLs in production", () => {
    expect(() =>
      loadEnv({
        ...baseEnv,
        NODE_ENV: "production",
        APP_URL: "http://example.com",
        API_URL: "https://example.com",
        BETTER_AUTH_URL: "https://example.com",
        EMAIL_PROVIDER: "resend",
        RESEND_API_KEY: "re_test",
        EMAIL_FROM: "Pomagappka <powiadomienia@notify.example.com>",
      }),
    ).toThrow(/APP_URL/);
  });

  it("accepts https production config with Resend", () => {
    const env = loadEnv({
      ...baseEnv,
      NODE_ENV: "production",
      APP_URL: "https://app.example.com",
      API_URL: "https://app.example.com",
      BETTER_AUTH_URL: "https://app.example.com",
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "Pomagappka <powiadomienia@notify.example.com>",
    });
    expect(env.NODE_ENV).toBe("production");
    expect(env.EMAIL_PROVIDER).toBe("resend");
  });

  it("allows local prod overlay (https localhost + smtp/mailpit)", () => {
    const env = loadEnv({
      ...baseEnv,
      NODE_ENV: "production",
      APP_URL: "https://localhost",
      API_URL: "https://localhost",
      BETTER_AUTH_URL: "https://localhost",
      EMAIL_PROVIDER: "smtp",
      SMTP_HOST: "mailpit",
      EMAIL_FROM: "Pomagappka <noreply@localhost>",
    });
    expect(env.EMAIL_PROVIDER).toBe("smtp");
  });
});
