import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { pl } from "@/locales/pl";

type PrivacyNoticeProps = {
  variant: "recipient" | "booking" | "organizer-event";
};

export function PrivacyNotice({ variant }: PrivacyNoticeProps) {
  const copy = pl.privacyNotice[variant];
  const [privacyContactEmail, setPrivacyContactEmail] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/features")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { privacyContactEmail?: string | null } | null) => {
        if (!cancelled) {
          setPrivacyContactEmail(json?.privacyContactEmail ?? null);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside
      className="rounded-md border border-[var(--color-line)] bg-white/70 px-4 py-3 text-sm leading-relaxed"
      aria-label={pl.privacyNotice.ariaLabel}
    >
      <p>{copy.body}</p>
      <p className="mt-2">
        <Link
          className="text-[var(--color-sea)] underline-offset-2 hover:underline"
          to="/polityka-prywatnosci"
        >
          {pl.legal.privacy}
        </Link>
        {" · "}
        <Link
          className="text-[var(--color-sea)] underline-offset-2 hover:underline"
          to="/cookies"
        >
          {pl.legal.cookies}
        </Link>
        {" · "}
        {privacyContactEmail ? (
          <a
            className="text-[var(--color-sea)] underline-offset-2 hover:underline"
            href={`mailto:${privacyContactEmail}`}
          >
            {pl.privacyNotice.contactAdmin}
          </a>
        ) : (
          <Link
            className="text-[var(--color-sea)] underline-offset-2 hover:underline"
            to="/kontakt-prywatnosc"
          >
            {pl.privacyNotice.contactAdmin}
          </Link>
        )}
      </p>
    </aside>
  );
}
