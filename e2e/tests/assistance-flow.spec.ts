import { expect, test, type Page } from "@playwright/test";
import { eventDateRange, uniqueEmail } from "../helpers/unique.js";
async function registerOrganizer(page: Page, email: string, password: string) {
    await page.goto("/rejestracja");
    await page.getByLabel("Imię i nazwisko").fill("Organizator E2E");
    await page.getByLabel("Adres e-mail").fill(email);
    await page.getByLabel("Hasło").fill(password);
    await page.getByRole("button", { name: "Utwórz konto" }).click();
    await expect(page).toHaveURL(/\/panel$/);
    await expect(page.getByRole("heading", { name: "Panel organizatora" })).toBeVisible();
}
test.describe("assistance critical path", () => {
    test("register → create event → slot → PIN → book → cancel", async ({ page, browser, }) => {
        const email = uniqueEmail("org");
        const password = "Haslo12345";
        const { startsOn, endsOn } = eventDateRange(3);
        await registerOrganizer(page, email, password);
        await page.getByRole("link", { name: "Nowe wydarzenie" }).first().click();
        await expect(page).toHaveURL(/\/panel\/wydarzenia\/nowe$/);
        await page.getByLabel("Tytuł").fill("E2E wsparcie posiłkami");
        await page.getByLabel("Nazwa wyświetlana odbiorcy").fill("Rodzina Kowalskich");
        await page.getByLabel("Liczba osób").fill("3");
        await page.getByLabel("Data od").fill(startsOn);
        await page.getByLabel("Data do").fill(endsOn);
        await page.getByRole("button", { name: "Utwórz wydarzenie" }).click();
        await expect(page).toHaveURL(/\/panel\/wydarzenia\/[^/]+$/);
        await expect(page.getByRole("heading", { name: "Twój kod PIN (pokaż tylko raz)" })).toBeVisible();
        const pinText = await page
            .locator("section")
            .filter({ hasText: "Twój kod PIN" })
            .locator("p.font-mono")
            .innerText();
        const pin = pinText.trim();
        expect(pin).toMatch(/^\d{4}$/);
        const inviteUrl = await page
            .locator("section")
            .filter({ hasText: "Link zaproszenia" })
            .locator("p.break-all")
            .innerText();
        expect(inviteUrl).toContain("/i/");
        await page.getByRole("button", { name: startsOn }).click();
        await page.getByRole("button", { name: "Zapisz terminy" }).click();
        await expect(page.getByText("Wolny").first()).toBeVisible();
        const participant = await browser.newContext();
        const pPage = await participant.newPage();
        await pPage.goto(new URL(inviteUrl).pathname);
        await expect(pPage.getByRole("heading", { name: "Wejście na wydarzenie" })).toBeVisible();
        await pPage.getByLabel("PIN").fill("0000");
        await pPage.getByRole("button", { name: "Wejdź" }).click();
        await expect(pPage.getByText("Nie udało się zweryfikować dostępu.")).toBeVisible();
        await pPage.getByLabel("PIN").fill(pin);
        await pPage.getByRole("button", { name: "Wejdź" }).click();
        await expect(pPage).toHaveURL(/\/i\/[^/]+\/wydarzenie$/);
        await expect(pPage.getByRole("heading", { name: "E2E wsparcie posiłkami" })).toBeVisible();
        await pPage.getByRole("button", { name: startsOn }).click();
        await pPage.getByLabel("Imię i nazwisko").fill("Uczestnik E2E");
        await pPage.getByLabel("E-mail").fill(uniqueEmail("guest"));
        await pPage.getByLabel("Co przygotujesz? (opcjonalnie)").fill("Zupa jarzynowa");
        await pPage.getByRole("button", { name: "Zarezerwuj" }).click();
        await expect(pPage.getByRole("heading", { name: "Rezerwacja potwierdzona" })).toBeVisible();
        const cancelHref = await pPage
            .locator("a")
            .filter({ hasText: /\/anuluj\// })
            .getAttribute("href");
        expect(cancelHref).toBeTruthy();
        await pPage.goto(cancelHref!);
        await expect(pPage.getByRole("heading", { name: "Anulowanie rezerwacji" })).toBeVisible();
        await pPage.getByRole("button", { name: "Anuluj rezerwację" }).click();
        await expect(pPage.getByText("Rezerwacja została anulowana")).toBeVisible();
        await participant.close();
    });
});
