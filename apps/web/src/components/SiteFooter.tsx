import { Link } from "react-router-dom";
import { pl } from "@/locales/pl";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--color-line)] pt-8">
      <p className="text-xs text-[color-mix(in_srgb,var(--color-ink)_45%,white)]">
        {pl.footer}
      </p>
      <nav
        className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm"
        aria-label={pl.legal.navLabel}
      >
        <Link
          className="text-[var(--color-sea)] underline-offset-2 hover:underline"
          to="/polityka-prywatnosci"
        >
          {pl.legal.privacy}
        </Link>
        <Link
          className="text-[var(--color-sea)] underline-offset-2 hover:underline"
          to="/regulamin"
        >
          {pl.legal.terms}
        </Link>
        <Link
          className="text-[var(--color-sea)] underline-offset-2 hover:underline"
          to="/cookies"
        >
          {pl.legal.cookies}
        </Link>
        <Link
          className="text-[var(--color-sea)] underline-offset-2 hover:underline"
          to="/kontakt-prywatnosc"
        >
          {pl.privacyNotice.contactAdmin}
        </Link>
      </nav>
    </footer>
  );
}
