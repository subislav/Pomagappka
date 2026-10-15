import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { LegalDocument } from "@/content/legal/types";
import { SiteFooter } from "@/components/SiteFooter";
import { pl } from "@/locales/pl";

export function LegalDocumentView({ document }: { document: LegalDocument }) {
  useEffect(() => {
    const previous = window.document.title;
    window.document.title = `${document.title} — ${pl.brand}`;
    const meta = window.document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") ?? null;
    meta?.setAttribute("content", document.metaDescription);
    return () => {
      window.document.title = previous;
      if (meta && previousDescription !== null) {
        meta.setAttribute("content", previousDescription);
      }
    };
  }, [document]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-10 sm:py-16">
      <header className="mb-8">
        <p className="brand text-2xl font-bold tracking-tight text-[var(--color-sea)]">
          <Link to="/" className="hover:opacity-90">
            {pl.brand}
          </Link>
        </p>
        <h1 className="mt-4 text-2xl font-semibold leading-snug text-[var(--color-ink)] sm:text-3xl">
          {document.title}
        </h1>
        <p className="mt-2 text-sm text-[color-mix(in_srgb,var(--color-ink)_55%,white)]">
          {document.updatedLabel}
        </p>
      </header>

      <article className="space-y-8 text-base leading-relaxed text-[color-mix(in_srgb,var(--color-ink)_88%,white)]">
        {document.intro.map((paragraph, index) => (
          <p key={`intro-${index}`}>{paragraph}</p>
        ))}

        {document.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-ink)]">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={`p-${section.heading}-${index}`}>{paragraph}</p>
            ))}
            {section.bullets && section.bullets.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5">
                {section.bullets.map((item, index) => (
                  <li key={`b-${section.heading}-${index}`}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.note ? (
              <p className="rounded-md border border-[var(--color-line)] bg-white/60 px-4 py-3 text-sm">
                {section.note}
              </p>
            ) : null}
          </section>
        ))}
      </article>

      <p className="mt-10 text-sm">
        <Link
          className="text-[var(--color-sea)] underline-offset-2 hover:underline"
          to="/"
        >
          {pl.legal.backHome}
        </Link>
      </p>

      <div className="mt-10">
        <SiteFooter />
      </div>
    </main>
  );
}
