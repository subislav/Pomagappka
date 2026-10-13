import { expect, test } from "@playwright/test";
import { uniqueEmail } from "../helpers/unique.js";
test.describe("organizer auth", () => {
    test("register, logout, and login again", async ({ page }) => {
        const email = uniqueEmail("auth");
        const password = "haslo12345";
        await page.goto("/rejestracja");
        await page.getByLabel("Imię i nazwisko").fill("Auth E2E");
        await page.getByLabel("Adres e-mail").fill(email);
        await page.getByLabel("Hasło").fill(password);
        await page.getByRole("button", { name: "Utwórz konto" }).click();
        await expect(page).toHaveURL(/\/panel$/);
        await page.getByRole("button", { name: "Wyloguj" }).click();
        await expect(page).toHaveURL(/\/$/);
        await page.goto("/logowanie");
        await page.getByLabel("Adres e-mail").fill(email);
        await page.getByLabel("Hasło").fill(password);
        await page.getByRole("button", { name: "Zaloguj" }).click();
        await expect(page).toHaveURL(/\/panel$/);
        await expect(page.getByRole("heading", { name: "Panel organizatora" })).toBeVisible();
    });
    test("protected panel redirects unauthenticated users", async ({ page }) => {
        await page.goto("/panel");
        await expect(page).toHaveURL(/\/logowanie/);
    });
});
