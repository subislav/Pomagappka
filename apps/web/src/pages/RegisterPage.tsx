import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpBodySchema, type SignUpBody } from "@pomagappka/shared";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { signIn, signUp, useSession } from "@/lib/auth-client";
import { pl } from "@/locales/pl";

export function RegisterPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpBody>({
    resolver: zodResolver(signUpBodySchema),
    defaultValues: { name: "", email: "", password: "" },
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

  async function onSubmit(values: SignUpBody) {
    setFormError(null);
    const result = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    if (result.error) {
      setFormError(result.error.message || pl.auth.errorGeneric);
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
      <h1 className="mt-8 text-2xl font-semibold">{pl.auth.registerTitle}</h1>

      <form
        className="mt-8 space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <TextField
          label={pl.auth.name}
          autoComplete="name"
          error={errors.name ? pl.auth.validationName : undefined}
          {...register("name")}
        />
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
          autoComplete="new-password"
          hint={pl.auth.passwordHint}
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
          {pl.auth.submitRegister}
        </Button>
      </form>

      {googleEnabled ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-3 w-full"
          onClick={() => void onGoogle()}
        >
          {pl.auth.googleRegister}
        </Button>
      ) : null}

      <p className="mt-6 text-sm">
        <Link className="text-[var(--color-sea)] underline" to="/logowanie">
          {pl.auth.toLogin}
        </Link>
      </p>
      <p className="mt-3 text-sm">
        <Link className="text-[var(--color-ink)]/70 underline" to="/">
          {pl.auth.backHome}
        </Link>
      </p>
    </main>
  );
}
