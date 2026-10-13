import { defineConfig } from "drizzle-kit";
export default defineConfig({
    schema: "./src/db/schema/index.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL ??
            "postgresql://pomagappka:pomagappka@localhost:5432/pomagappka",
    },
});
