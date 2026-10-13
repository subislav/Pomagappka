import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordBodySchema,
  type ForgotPasswordBody,
} from "@pomagappka/shared";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { requestPasswordReset } from "@/lib/auth-client";
import { pl } from "@/locales/pl";

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordBody>({
    resolver: zodResolver(forgotPasswordBodySchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordBody) {
    setFormError(null);
    const result = await requestPasswordReset({
      email: values.email,
      redirectTo: `${window.location.origin}/reset-hasla`,
    });
    if (result.error) {
      setFormError(pl.auth.errorGeneric);
      return;
    }
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12">
      <Link to="/" className="brand text-2xl font-bold text-[var(--color-sea)]">
        {pl.brand}
      </Link>
      <h1 className="mt-8 text-2xl font-semibold">{pl.auth.forgotTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-ink)_75%,white)]">
        {pl.auth.forgotBody}
      </p>

      {sent ? (
        <p
          className="mt-8 rounded-md bg-emerald-50 px-3 py-3 text-sm text-emerald-950"
          role="status"
        >
          {pl.auth.forgotSent}
        </p>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <TextField
            label={pl.auth.email}
            type="email"
            autoComplete="email"
            error={errors.email ? pl.auth.validationEmail : undefined}
            {...register("email")}
          />
          {formError ? (
            <p
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {formError}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {pl.auth.forgotSubmit}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm">
        <Link className="text-[var(--color-sea)] underline" to="/logowanie">
          {pl.auth.toLogin}
        </Link>
      </p>
    </main>
  );
}
