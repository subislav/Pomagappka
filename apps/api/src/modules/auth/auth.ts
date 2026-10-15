import type { DBAdapter } from "@better-auth/core/db/adapter";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { createAuthMiddleware } from "better-auth/api";
import type { Env } from "../../config/env.js";
import type { Database } from "../../db/client.js";
import type { EmailSender } from "../../email/types.js";
import * as schema from "../../db/schema/index.js";
import {
  assertPasswordPolicy,
  passwordSameAsLastError,
} from "./password-policy.js";

export function createAuth(db: Database, env: Env, email: EmailSender) {
  const googleEnabled = Boolean(
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
  );

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.APP_URL, env.BETTER_AUTH_URL, env.API_URL],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        void email
          .send({
            to: user.email,
            subject: "Pomagappka — reset hasła",
            text: `Aby zresetować hasło, otwórz ten link:\n\n${url}\n\nJeśli to nie Ty, zignoruj tę wiadomość.`,
            html: `<p>Aby zresetować hasło, otwórz ten link:</p><p><a href="${url}">${url}</a></p><p>Jeśli to nie Ty, zignoruj tę wiadomość.</p>`,
            idempotencyKey: `password-reset:${user.id}:${url}`,
          })
          .catch(() => undefined);
      },
    },
    socialProviders: googleEnabled
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : undefined,
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    advanced: {
      useSecureCookies: env.NODE_ENV === "production",
      defaultCookieAttributes: {
        sameSite: "lax",
        httpOnly: true,
        path: "/",
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/sign-up/email") {
          const password = (ctx.body as { password?: string } | undefined)
            ?.password;
          if (typeof password === "string") {
            assertPasswordPolicy(password);
          }
          return;
        }

        if (ctx.path === "/reset-password") {
          const body = ctx.body as
            | { newPassword?: string; token?: string }
            | undefined;
          const newPassword = body?.newPassword;
          if (typeof newPassword !== "string") return;
          assertPasswordPolicy(newPassword);

          const token =
            body?.token ||
            (ctx.query as { token?: string } | undefined)?.token;
          if (!token) return;

          const verification =
            await ctx.context.internalAdapter.findVerificationValue(
              `reset-password:${token}`,
            );
          if (!verification) return;

          const credential =
            await ctx.context.internalAdapter.findCredentialAccount(
              verification.value,
            );
          if (credential?.password) {
            const same = await ctx.context.password.verify({
              hash: credential.password,
              password: newPassword,
            });
            if (same) throw passwordSameAsLastError();
          }
          return;
        }

        if (ctx.path === "/change-password") {
          const body = ctx.body as
            | { newPassword?: string; currentPassword?: string }
            | undefined;
          const newPassword = body?.newPassword;
          if (typeof newPassword !== "string") return;
          assertPasswordPolicy(newPassword);

          const session = ctx.context.session;
          const userId = session?.user?.id;
          if (!userId) return;

          const credential =
            await ctx.context.internalAdapter.findCredentialAccount(userId);
          if (credential?.password) {
            const same = await ctx.context.password.verify({
              hash: credential.password,
              password: newPassword,
            });
            if (same) throw passwordSameAsLastError();
          }
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

export function isGoogleAuthEnabled(env: Env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}
