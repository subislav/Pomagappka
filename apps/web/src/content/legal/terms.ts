import type { LegalDocument } from "./types";

export const termsDocument: LegalDocument = {
  title: "Regulamin",
  metaDescription:
    "Regulamin korzystania z bezpłatnej platformy Pomagappka.",
  updatedLabel: "Obowiązuje od 14.10.2026",
  intro: [
    "Niniejszy regulamin określa zasady korzystania z serwisu Pomagappka dostępnego pod adresem https://pomagappka.pl.",
    "Operatorem serwisu jest Jan Subczynski. Kontakt: subijanek@gmail.com, strona „Kontakt w sprawie prywatności” oraz dane wskazane w polityce prywatności.",
  ],
  sections: [
    {
      heading: "1. Charakter usługi",
      paragraphs: [
        "Pomagappka to bezpłatne narzędzie do organizacji wsparcia posiłkami lub zakupami. Serwis nie pośredniczy w płatnościach i nie jest placówką medyczną.",
        "Operator udostępnia infrastrukturę techniczną. Za treść danych i faktyczną organizację pomocy odpowiadają organizatorzy oraz uczestnicy.",
      ],
    },
    {
      heading: "2. Konto organizatora",
      paragraphs: [
        "Rejestracja wymaga imienia i nazwiska, adresu e-mail, hasła spełniającego wymagania serwisu oraz akceptacji niniejszego regulaminu. Jeśli w danej instalacji włączono logowanie Google, akceptacja regulaminu jest wymagana przed skorzystaniem z tej opcji.",
        "Informacje o przetwarzaniu danych konta znajdują się w polityce prywatności (to nie jest zgoda na wszystkie cele przetwarzania w rozumieniu RODO).",
        "Organizator chroni dane logowania. W panelu można zgłosić wniosek o usunięcie konta; usunięcie nie jest automatyczne i wymaga weryfikacji przez administratora.",
      ],
    },
    {
      heading: "3. Wydarzenia, PIN i dane osób trzecich",
      paragraphs: [
        "Organizator tworzy wydarzenie, otrzymuje prywatny link i PIN oraz odpowiada za sposób ich udostępnienia.",
        "Po poprawnym PIN uczestnik widzi dane wydarzenia potrzebne do organizacji pomocy.",
        "Organizator nie powinien wprowadzać danych medycznych ani diagnoz. Odpowiada za prawo do przetwarzania danych odbiorcy i innych osób oraz za poinformowanie ich, gdy prawo tego wymaga.",
      ],
    },
    {
      heading: "4. Rezerwacje",
      paragraphs: [
        "Uczestnik rezerwuje wolny termin, podając imię i nazwisko oraz e-mail. Na ten adres mogą trafić potwierdzenie, przypomnienie i link anulowania.",
        "Organizator może utworzyć rezerwację w imieniu innej osoby i odpowiada za poprawność podanego e-maila.",
      ],
    },
    {
      heading: "5. Zakazy",
      paragraphs: [
        "Zabrania się działań bezprawnych, naruszania dóbr osobistych, wprowadzania danych bez podstawy prawnej oraz prób obchodzenia zabezpieczeń PIN lub zakłócania działania serwisu.",
      ],
    },
    {
      heading: "6. E-mail i prywatność",
      paragraphs: [
        "Serwis wysyła wiadomości transakcyjne (w produkcji przez Resend). Zasady ochrony danych określa Polityka prywatności.",
      ],
    },
    {
      heading: "7. Odpowiedzialność i prawo",
      paragraphs: [
        "Organizatorzy i uczestnicy odpowiadają za własne działania, w tym za dostawy. Operator nie gwarantuje nieprzerwanej dostępności serwisu.",
        "W sprawach nieuregulowanych stosuje się prawo polskie.",
        "Aktualna wersja regulaminu jest publikowana w serwisie.",
      ],
    },
  ],
};
