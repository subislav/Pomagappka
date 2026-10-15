import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { participantEventSchema, verifyPinBodySchema, type VerifyPinBody, } from "@pomagappka/shared";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { pl } from "@/locales/pl";
export function InvitePinPage() {
    const { token } = useParams<{
        token: string;
    }>();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);
    const { register, handleSubmit, formState: { isSubmitting, errors }, } = useForm<VerifyPinBody>({
        resolver: zodResolver(verifyPinBodySchema),
        defaultValues: { pin: "" },
    });
    useEffect(() => {
        if (!token)
            return;
        let cancelled = false;
        async function probe() {
            const response = await fetch(`/api/invite/${token}/event`, {
                credentials: "include",
            });
            if (cancelled)
                return;
            if (response.ok) {
                navigate(`/i/${token}/wydarzenie`, { replace: true });
                return;
            }
            setChecking(false);
        }
        void probe();
        return () => {
            cancelled = true;
        };
    }, [token, navigate]);
    async function onSubmit(values: VerifyPinBody) {
        if (!token)
            return;
        setFormError(null);
        const response = await fetch(`/api/invite/${token}/verify-pin`, {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(values),
        });
        if (response.status === 429) {
            setFormError(pl.invite.locked);
            return;
        }
        if (response.status === 404) {
            setFormError(pl.invite.notFound);
            return;
        }
        if (!response.ok) {
            setFormError(pl.invite.invalid);
            return;
        }
        const json = (await response.json()) as {
            event: unknown;
        };
        participantEventSchema.parse(json.event);
        navigate(`/i/${token}/wydarzenie`, { replace: true });
    }
    if (checking) {
        return (<main className="mx-auto max-w-md px-6 py-16">
        <p role="status">{pl.dashboard.loading}</p>
      </main>);
    }
    return (<main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12">
      <Link to="/" className="brand text-2xl font-bold text-[var(--color-sea)]">
        {pl.brand}
      </Link>
      <h1 className="mt-8 text-2xl font-semibold">{pl.invite.pinTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-ink)_75%,white)]">
        {pl.invite.pinBody}
      </p>
      <div className="mt-4">
        <PrivacyNotice variant="recipient" />
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField label={pl.invite.pinLabel} inputMode="numeric" autoComplete="one-time-code" maxLength={4} error={errors.pin ? pl.invite.pinLabel : undefined} {...register("pin")}/>
        {formError ? (<p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {formError}
          </p>) : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {pl.invite.submit}
        </Button>
      </form>
      <div className="mt-10">
        <SiteFooter />
      </div>
    </main>);
}
