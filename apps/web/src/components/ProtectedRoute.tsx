import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/lib/auth-client";
import { pl } from "@/locales/pl";
export function ProtectedRoute({ children }: {
    children: ReactNode;
}) {
    const { data: session, isPending } = useSession();
    const location = useLocation();
    if (isPending) {
        return (<main className="mx-auto flex min-h-screen max-w-lg items-center px-6">
        <p className="text-sm text-[var(--color-ink)]" role="status">
          {pl.dashboard.loading}
        </p>
      </main>);
    }
    if (!session) {
        return <Navigate to="/logowanie" replace state={{ from: location }}/>;
    }
    return children;
}
