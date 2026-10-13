import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Env } from "../config/env.js";
import * as schema from "./schema/index.js";
export type Database = ReturnType<typeof createDb>["db"];
export function createDb(env: Env) {
    const sql = postgres(env.DATABASE_URL, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
    });
    const db = drizzle(sql, { schema });
    return { db, sql };
}
export async function checkDatabase(sql: postgres.Sql): Promise<boolean> {
    try {
        await sql `select 1`;
        return true;
    }
    catch {
        return false;
    }
}
