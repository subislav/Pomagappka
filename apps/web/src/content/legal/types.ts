export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
};

export type LegalDocument = {
  title: string;
  metaDescription: string;
  intro: string[];
  sections: LegalSection[];
  updatedLabel: string;
};
