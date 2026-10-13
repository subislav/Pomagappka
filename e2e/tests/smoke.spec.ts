import { expect, test } from "@playwright/test";
test.describe("smoke", () => {
    test("landing page loads and reports healthy API", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByText("Pomagappka").first()).toBeVisible();
        await expect(page.getByText("API i baza danych działają poprawnie.")).toBeVisible({
            timeout: 30000,
        });
    });
});
