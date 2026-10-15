import { LegalDocumentView } from "@/components/LegalDocumentView";
import { termsDocument } from "@/content/legal/terms";

export function TermsPage() {
  return <LegalDocumentView document={termsDocument} />;
}
