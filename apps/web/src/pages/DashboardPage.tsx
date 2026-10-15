import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  organizerEventsResponseSchema,
  organizerMeResponseSchema,
  type OrganizerEventListItem,
} from "@pomagappka/shared";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/Button";
import { signOut, useSession } from "@/lib/auth-client";
import { pl } from "@/locales/pl";

function statusLabel(status: OrganizerEventListItem["status"]) {
  if (status === "open") return pl.dashboard.statusOpen;
  if (status === "closed") return pl.dashboard.statusClosed;
  if (status === "draft") return pl.dashboard.statusDraft;
  return status;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [events, setEvents] = useState<OrganizerEventListItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [erasureState, setErasureState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [meRes, eventsRes] = await Promise.all([
          fetch("/api/organizer/me", { credentials: "include" }),
          fetch("/api/organizer/events", { credentials: "include" }),
        ]);
        if (meRes.status === 401 || eventsRes.status === 401) {
          navigate("/logowanie", { replace: true });
          return;
        }
        if (!meRes.ok || !eventsRes.ok) {
          throw new Error("load_failed");
        }
        organizerMeResponseSchema.parse(await meRes.json());
        const eventsPayload = organizerEventsResponseSchema.parse(
          await eventsRes.json(),
        );
        if (!cancelled) {
          setEvents(eventsPayload.events);
        }
      } catch {
        if (!cancelled) {
          setLoadError(pl.auth.errorGeneric);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleLogout() {
    await signOut();
    navigate("/", { replace: true });
  }

  async function requestErasure() {
    setErasureState("sending");
    try {
      const response = await fetch("/api/organizer/privacy/erasure-request", {
        method: "POST",
        credentials: "include",
      });
      if (response.status === 401) {
        navigate("/logowanie", { replace: true });
        return;
      }
      if (!response.ok) {
        setErasureState("error");
        return;
      }
      setErasureState("sent");
    } catch {
      setErasureState("error");
    }
  }

  const displayName = session?.user.name ?? "";
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="brand text-2xl font-bold text-[var(--color-sea)]">
            {pl.brand}
          </Link>
          <h1 className="mt-3 text-2xl font-semibold">{pl.dashboard.title}</h1>
          <p className="mt-1 text-sm text-[color-mix(in_srgb,var(--color-ink)_70%,white)]">
            {pl.dashboard.welcome} {displayName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/panel/wydarzenia/nowe">
            <Button>{pl.dashboard.createEvent}</Button>
          </Link>
          <Button variant="secondary" onClick={() => void handleLogout()}>
            {pl.dashboard.logout}
          </Button>
        </div>
      </header>

      <section className="mt-10 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-lagoon)]">
          {pl.dashboard.eventsHeading}
        </h2>

        {loadError ? (
          <p
            className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-900"
            role="alert"
          >
            {loadError}
          </p>
        ) : null}

        {events === null && !loadError ? (
          <p className="text-sm" role="status">
            {pl.dashboard.loading}
          </p>
        ) : null}

        {events && events.length === 0 ? (
          <div className="rounded-md border border-[var(--color-line)] bg-white/70 px-5 py-6">
            <h3 className="text-lg font-semibold">{pl.dashboard.emptyTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-ink)_75%,white)]">
              {pl.dashboard.emptyBody}
            </p>
            <Link to="/panel/wydarzenia/nowe" className="mt-4 inline-block">
              <Button>{pl.dashboard.createEvent}</Button>
            </Link>
          </div>
        ) : null}

        {events && events.length > 0 ? (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  to={`/panel/wydarzenia/${event.id}`}
                  className="block rounded-md border border-[var(--color-line)] bg-white/80 px-4 py-4 transition hover:border-[var(--color-lagoon)]"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-semibold">{event.title}</h3>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-lagoon)]">
                      {statusLabel(event.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">
                    {event.assistanceType === "grocery"
                      ? pl.dashboard.typeGrocery
                      : pl.dashboard.typeMeal}{" "}
                    · {event.recipientDisplayName} · {event.startsOn} –{" "}
                    {event.endsOn}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mt-12 space-y-3 border-t border-[var(--color-line)] pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-lagoon)]">
          {pl.dashboard.privacyHeading}
        </h2>
        <Button
          type="button"
          variant="ghost"
          disabled={erasureState === "sending" || erasureState === "sent"}
          onClick={() => void requestErasure()}
        >
          {erasureState === "sending"
            ? pl.dashboard.erasureSending
            : pl.dashboard.erasureRequest}
        </Button>
        {erasureState === "sent" ? (
          <p className="text-sm text-emerald-900" role="status">
            {pl.dashboard.erasureSent}
          </p>
        ) : null}
        {erasureState === "error" ? (
          <p className="text-sm text-red-800" role="alert">
            {pl.dashboard.erasureFailed}
          </p>
        ) : null}
      </section>

      <div className="mt-10">
        <SiteFooter />
      </div>
    </main>
  );
}
