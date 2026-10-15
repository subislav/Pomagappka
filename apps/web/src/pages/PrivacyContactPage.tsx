import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SiteFooter } from "@/components/SiteFooter";
import { pl } from "@/locales/pl";

export function PrivacyContactPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = `${pl.privacyContact.title} — ${pl.brand}`;
    let cancelled = false;
    fetch("/api/features")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { privacyContactEmail?: string | null } | null) => {
        if (!cancelled) {
          setEmail(json?.privacyContactEmail ?? null);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      document.title = previous;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-10 sm:py-16">
      <p className="brand text-2xl font-bold tracking-tight text-[var(--color-sea)]">
        <Link to="/">{pl.brand}</Link>
      </p>
      <h1 className="mt-4 text-2xl font-semibold">{pl.privacyContact.title}</h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed">
        <p>{pl.privacyContact.body}</p>
        {email ? (
          <p>
            <a
              className="text-[var(--color-sea)] underline"
              href={`mailto:${email}`}
            >
              {email}
            </a>
          </p>
        ) : (
          <p className="rounded-md border border-[var(--color-line)] bg-white/70 px-4 py-3 text-sm">
            {pl.privacyContact.emailUnavailable}
          </p>
        )}
        <p>
          <Link
            className="text-[var(--color-sea)] underline"
            to="/polityka-prywatnosci"
          >
            {pl.legal.privacy}
          </Link>
        </p>
      </div>
      <p className="mt-10 text-sm">
        <Link className="text-[var(--color-sea)] underline" to="/">
          {pl.legal.backHome}
        </Link>
      </p>
      <div className="mt-10">
        <SiteFooter />
      </div>
    </main>
  );
}
