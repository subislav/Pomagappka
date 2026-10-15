import type { LegalDocument } from "./types";

export const cookiesDocument: LegalDocument = {
  title: "Pliki cookie",
  metaDescription:
    "Informacja o plikach cookie i podobnych technologiach w serwisie Pomagappka.",
  updatedLabel: "Obowiązuje od 14.10.2026",
  intro: [
    "Ta strona opisuje technologie stosowane przez Pomagappka.",
    "Nie stosujemy SDK analityki ani reklam. Nie zapisujemy danych w localStorage ani sessionStorage w kodzie frontendu. Nie wyświetlamy banera zgody na cookie marketingowe, ponieważ nie stosujemy takich cookie.",
  ],
  sections: [
    {
      heading: "1. Cookie niezbędne",
      paragraphs: ["Stosujemy następujące technologie:"],
      bullets: [
        "Cookie sesji organizatora (Better Auth) — utrzymanie zalogowania; czas ok. 7 dni wg konfiguracji API; HttpOnly, SameSite=Lax, Secure w produkcji.",
        "Cookie pomagappka_event_access — dostęp do prywatnego wydarzenia po PIN; 12 godzin; HttpOnly, SameSite=Lax, Secure w produkcji.",
      ],
    },
    {
      heading: "2. Czcionki",
      paragraphs: [
        "Interfejs używa czcionek Fraunces i Source Sans 3 hostowanych lokalnie w aplikacji (bez żądań do Google Fonts).",
      ],
    },
    {
      heading: "3. Zarządzanie",
      paragraphs: [
        "Cookie można usunąć w ustawieniach przeglądarki. Usunięcie cookie dostępu do wydarzenia wymaga ponownego podania PIN.",
        "Więcej informacji: Polityka prywatności oraz Kontakt w sprawie prywatności.",
      ],
    },
  ],
};
