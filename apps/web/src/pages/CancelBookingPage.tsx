import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cancelBookingResponseSchema, } from "@pomagappka/shared";
import { Button } from "@/components/ui/Button";
import { pl } from "@/locales/pl";
export function CancelBookingPage() {
    const { token } = useParams<{
        token: string;
    }>();
    const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
    const [slotDate, setSlotDate] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    async function onCancel() {
        if (!token)
            return;
        setSubmitting(true);
        const response = await fetch("/api/bookings/cancel", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ token }),
        });
        setSubmitting(false);
        if (!response.ok) {
            setStatus("error");
            return;
        }
        const payload = cancelBookingResponseSchema.parse(await response.json());
        setSlotDate(payload.booking.slotDate);
        setStatus("ok");
    }
    return (<main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12">
      <Link to="/" className="brand text-2xl font-bold text-[var(--color-sea)]">
        {pl.brand}
      </Link>
      <h1 className="mt-8 text-2xl font-semibold">{pl.cancel.title}</h1>

      {status === "idle" ? (<>
          <p className="mt-3 text-sm leading-relaxed">{pl.cancel.body}</p>
          <Button className="mt-6" disabled={submitting} onClick={() => void onCancel()}>
            {pl.cancel.submit}
          </Button>
        </>) : null}

      {status === "ok" ? (<p className="mt-4 rounded-md bg-emerald-50 px-3 py-3 text-sm text-emerald-950" role="status">
          {pl.cancel.success}
          {slotDate ? ` (${slotDate})` : ""}
        </p>) : null}

      {status === "error" ? (<p className="mt-4 rounded-md bg-red-50 px-3 py-3 text-sm text-red-900" role="alert">
          {pl.cancel.invalid}
        </p>) : null}

      <Link to="/" className="mt-8 text-sm text-[var(--color-sea)] underline">
        {pl.auth.backHome}
      </Link>
    </main>);
}
