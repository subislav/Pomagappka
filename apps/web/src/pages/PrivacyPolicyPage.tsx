import { LegalDocumentView } from "@/components/LegalDocumentView";
import { privacyDocument } from "@/content/legal/privacy";

export function PrivacyPolicyPage() {
  return <LegalDocumentView document={privacyDocument} />;
}
