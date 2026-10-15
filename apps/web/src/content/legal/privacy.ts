import type { LegalDocument } from "./types";

export const privacyDocument: LegalDocument = {
  title: "Polityka prywatności",
  metaDescription:
    "Polityka prywatności serwisu Pomagappka — informacje o przetwarzaniu danych osobowych.",
  updatedLabel: "Obowiązuje od 14.10.2026",
  intro: [
    "Niniejsza polityka opisuje, jakie dane osobowe przetwarza serwis Pomagappka (https://pomagappka.pl) w związku z korzystaniem z aplikacji.",
    "Administratorem danych osobowych jest Jan Subczynski. Kontakt w sprawach ochrony prywatności: subijanek@gmail.com oraz strona „Kontakt w sprawie prywatności”.",
  ],
  sections: [
    {
      heading: "1. Zakres usługi",
      paragraphs: [
        "Pomagappka to bezpłatna platforma do organizacji wsparcia posiłkami lub zakupami. Konta mają organizatorzy. Odbiorcy wsparcia i uczestnicy rezerwacji nie muszą zakładać konta.",
        "Aplikacja działa na serwerze wirtualnym (Oracle Cloud Infrastructure) z bazą PostgreSQL, API Fastify, uwierzytelnianiem Better Auth, proxy Caddy (HTTPS) oraz wysyłką e-mail przez Resend w środowisku produkcyjnym.",
      ],
    },
    {
      heading: "2. Jakie dane przetwarzamy",
      paragraphs: ["Przetwarzamy następujące kategorie danych:"],
      bullets: [
        "Organizator: imię i nazwisko, e-mail, skrót hasła; opcjonalnie dane logowania Google, gdy ta funkcja jest włączona w danej instalacji; dane sesji (w tym adres IP i user-agent).",
        "Odbiorca (zwykle bez konta): nazwa wyświetlana oraz opcjonalnie adres dostawy, telefon, preferencje smakowe, wskazówki logistyczne, URL zdjęcia — dane wpisywane przez organizatora. Serwis nie zbiera już dedykowanych pól alergii; odpowiedzi API nie ujawniają historycznych wartości tych pól.",
        "Uczestnik rezerwacji: imię i nazwisko, e-mail, opcjonalny opis posiłku lub zakupów.",
        "Bezpieczeństwo wydarzenia: token zaproszenia, skrót PIN, skrót sesji dostępu, skróty IP przy próbach PIN, skróty tokenów anulowania.",
        "Logi e-mail: adres odbiorcy, typ wiadomości, status dostawy u dostawcy.",
      ],
    },
    {
      heading: "3. Cele i podstawy prawne",
      paragraphs: [
        "Dane konta organizatora przetwarzamy w celu świadczenia usługi (założenie i obsługa konta). Akceptacja regulaminu przy rejestracji dotyczy warunków korzystania z serwisu; polityka prywatności jest informacją o przetwarzaniu, a nie ogólną zgodą na wszystkie cele.",
        "Dane wydarzeń, rezerwacji i e-maili transakcyjnych przetwarzamy w celu organizacji pomocy oraz komunikacji związanej z rezerwacją.",
        "Skróty IP i limity prób PIN stosujemy w celu ochrony przed nadużyciami.",
        "Dane odbiorcy często pochodzą od organizatora. Organizator powinien poinformować odbiorcę o przetwarzaniu danych, o ile prawo tego wymaga. Informacje w serwisie nie zastępują indywidualnej oceny prawnej (w szczególności art. 14 RODO).",
      ],
    },
    {
      heading: "4. Odbiorcy i transfery",
      paragraphs: [
        "Dane mogą być przetwarzane przez dostawcę hostingu (OCI), dostawcę e-mail (Resend), a także ujawniane organizatorowi oraz osobom posiadającym link zaproszenia i poprawny PIN.",
        "Korzystanie z usług poza Europejskim Obszarem Gospodarczym może wiązać się z transferem danych — zabezpieczenia wynikają z umów z dostawcami.",
      ],
    },
    {
      heading: "5. Okres przechowywania",
      paragraphs: [
        "Sesja organizatora trwa około 7 dni. Sesja dostępu do wydarzenia po PIN — 12 godzin.",
        "Usunięcie wydarzenia w panelu ustawia status „usunięte”; pełne usunięcie lub anonimizacja danych może wymagać działania administratora.",
        "W panelu organizatora dostępny jest wniosek o usunięcie konta. Wniosek jest rejestrowany i — jeśli skonfigurowano — przekazywany administratorowi. Usunięcie konta nie jest wykonywane automatycznie.",
        "Opcjonalne czyszczenie starych prób PIN i logów e-mail może być włączone przez administratora serwera. Domyślnie działa w trybie podglądu (dry-run) i nie usuwa danych, dopóki nie zostanie to świadomie skonfigurowane.",
      ],
    },
    {
      heading: "6. Prawa osób",
      paragraphs: [
        "Przysługują prawa dostępu, sprostowania, usunięcia, ograniczenia, przenoszenia (w zakresie mającym zastosowanie), sprzeciwu oraz skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2, 00-193 Warszawa, https://uodo.gov.pl.",
        "Organizator może edytować wydarzenie i zgłosić wniosek o usunięcie konta. Uczestnik może anulować rezerwację linkiem z e-maila. Odbiorca lub inna osoba może skontaktować się przez stronę kontaktu prywatności w sprawie sprostowania lub usunięcia danych — realizacja zależy od weryfikacji i procedur administratora.",
      ],
    },
    {
      heading: "7. Cookie i bezpieczeństwo",
      paragraphs: [
        "Stosujemy niezbędne cookie sesji oraz cookie dostępu do wydarzenia. Szczegóły: strona „Pliki cookie”. Nie stosujemy SDK analityki reklamowej.",
        "Stosujemy m.in. HTTPS, hashowanie haseł i PIN oraz ograniczanie prób PIN. Czcionki interfejsu są hostowane lokalnie w aplikacji.",
      ],
    },
    {
      heading: "8. Zautomatyzowane decyzje",
      paragraphs: [
        "Nie prowadzimy profilowania marketingowego. Działają limity bezpieczeństwa dla prób PIN.",
      ],
    },
  ],
};
