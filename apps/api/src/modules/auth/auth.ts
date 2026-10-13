import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type { Env } from "../../config/env.js";
import type { Database } from "../../db/client.js";
import * as schema from "../../db/schema/index.js";
export function createAuth(db: Database, env: Env) {
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
        },
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
    });
}
export type Auth = ReturnType<typeof createAuth>;
