import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInBodySchema, type SignInBody } from "@pomagappka/shared";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { signIn, useSession } from "@/lib/auth-client";
import { pl } from "@/locales/pl";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const resetOk = Boolean(
    (location.state as { resetOk?: boolean } | null)?.resetOk,
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInBody>({
    resolver: zodResolver(signInBodySchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/features")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { google?: boolean } | null) => {
        if (!cancelled) setGoogleEnabled(Boolean(json?.google));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isPending && session) {
    return <Navigate to="/panel" replace />;
  }

  async function onSubmit(values: SignInBody) {
    setFormError(null);
    const result = await signIn.email({
      email: values.email,
      password: values.password,
    });
    if (result.error) {
      setFormError(pl.auth.errorInvalid);
      return;
    }
    navigate("/panel", { replace: true });
  }

  async function onGoogle() {
    setFormError(null);
    await signIn.social({
      provider: "google",
      callbackURL: "/panel",
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12">
      <Link to="/" className="brand text-2xl font-bold text-[var(--color-sea)]">
        {pl.brand}
      </Link>
      <h1 className="mt-8 text-2xl font-semibold">{pl.auth.loginTitle}</h1>

      {resetOk ? (
        <p
          className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-950"
          role="status"
        >
          {pl.auth.resetSuccess}
        </p>
      ) : null}

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
        <TextField
          label={pl.auth.password}
          type="password"
          autoComplete="current-password"
          error={errors.password ? pl.auth.validationPassword : undefined}
          {...register("password")}
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
          {pl.auth.submitLogin}
        </Button>
      </form>

      {googleEnabled ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-3 w-full"
          onClick={() => void onGoogle()}
        >
          {pl.auth.googleLogin}
        </Button>
      ) : null}

      <p className="mt-6 text-sm">
        <Link
          className="text-[var(--color-sea)] underline"
          to="/zapomniane-haslo"
        >
          {pl.auth.forgotPassword}
        </Link>
      </p>
      <p className="mt-3 text-sm">
        <Link className="text-[var(--color-sea)] underline" to="/rejestracja">
          {pl.auth.toRegister}
        </Link>
      </p>
      <p className="mt-3 text-sm">
        <Link className="text-[var(--color-ink)]/70 underline" to="/">
          {pl.auth.backHome}
        </Link>
      </p>
      <div className="mt-10">
        <SiteFooter />
      </div>
    </main>
  );
}
