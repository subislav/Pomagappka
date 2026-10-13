import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { loadEnv } from "../config/env.js";
const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../drizzle");
async function main() {
    const env = loadEnv();
    const sql = postgres(env.DATABASE_URL, { max: 1 });
    const db = drizzle(sql);
    console.log("Running database migrations...");
    await migrate(db, { migrationsFolder });
    console.log("Migrations complete.");
    await sql.end();
}
main().catch((error: unknown) => {
    console.error("Migration failed", error);
    process.exit(1);
});
