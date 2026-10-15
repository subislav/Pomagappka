import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { HealthResponse } from "@pomagappka/shared";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/Button";
import { fetchHealth } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { pl } from "@/locales/pl";
type HealthState = {
    kind: "loading";
} | {
    kind: "ok";
    data: HealthResponse;
} | {
    kind: "error";
    message: string;
};
export function LandingPage() {
    const { data: session } = useSession();
    const [health, setHealth] = useState<HealthState>({ kind: "loading" });
    useEffect(() => {
        let cancelled = false;
        fetchHealth()
            .then((data) => {
            if (!cancelled) {
                setHealth({ kind: "ok", data });
            }
        })
            .catch((error: unknown) => {
            if (!cancelled) {
                setHealth({
                    kind: "error",
                    message: error instanceof Error ? error.message : pl.statusError,
                });
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);
    return (<main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-10 sm:py-16">
      <header className="mb-10">
        <p className="brand text-4xl font-bold tracking-tight text-[var(--color-sea)] sm:text-5xl">
          {pl.brand}
        </p>
        <h1 className="mt-4 max-w-xl text-2xl font-semibold leading-snug text-[var(--color-ink)] sm:text-3xl">
          {pl.tagline}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[color-mix(in_srgb,var(--color-ink)_78%,white)] sm:text-lg">
          {pl.heroBody}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {session ? (<Link to="/panel">
              <Button>{pl.dashboard.title}</Button>
            </Link>) : (<>
              <Link to="/rejestracja">
                <Button>{pl.ctaRegister}</Button>
              </Link>
              <Link to="/logowanie">
                <Button variant="secondary">{pl.ctaLogin}</Button>
              </Link>
            </>)}
        </div>
      </header>

      <section className="mt-auto space-y-4 border-t border-[var(--color-line)] pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-lagoon)]">
          {pl.statusTitle}
        </h2>
        <HealthStatus state={health}/>
        <p className="text-sm text-[color-mix(in_srgb,var(--color-ink)_55%,white)]">
          {pl.ctaInvite}
        </p>
        <SiteFooter />
      </section>
    </main>);
}
function HealthStatus({ state }: {
    state: HealthState;
}) {
    if (state.kind === "loading") {
        return (<p className="rounded-md bg-white/50 px-4 py-3 text-sm" role="status">
        {pl.statusLoading}
      </p>);
    }
    if (state.kind === "error") {
        return (<p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
        {pl.statusError} ({state.message})
      </p>);
    }
    const ok = state.data.status === "ok";
    return (<p className={ok
            ? "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
            : "rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"} role="status">
      {ok ? pl.statusOk : pl.statusDegraded}{" "}
      <span className="opacity-70">
        (db: {state.data.checks.database})
      </span>
    </p>);
}
