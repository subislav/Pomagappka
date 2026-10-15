import { LegalDocumentView } from "@/components/LegalDocumentView";
import { cookiesDocument } from "@/content/legal/cookies";

export function CookiesPage() {
  return <LegalDocumentView document={cookiesDocument} />;
}
