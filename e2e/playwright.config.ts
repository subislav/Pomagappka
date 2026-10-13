import { defineConfig, devices } from "@playwright/test";
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";
export default defineConfig({
    testDir: "./tests",
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
    timeout: 60000,
    expect: { timeout: 15000 },
    use: {
        baseURL,
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
