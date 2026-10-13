import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { passwordSchema } from "@pomagappka/shared";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { resetPassword } from "@/lib/auth-client";
import { pl } from "@/locales/pl";

const formSchema = z.object({
  password: passwordSchema,
});
type FormValues = z.infer<typeof formSchema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token"), [params]);
  const invalidLink = !token || params.get("error") === "INVALID_TOKEN";
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!token) return;
    setFormError(null);
    const result = await resetPassword({
      token,
      newPassword: values.password,
    });
    if (result.error) {
      setFormError(result.error.message || pl.auth.errorGeneric);
      return;
    }
    navigate("/logowanie", { replace: true, state: { resetOk: true } });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12">
      <Link to="/" className="brand text-2xl font-bold text-[var(--color-sea)]">
        {pl.brand}
      </Link>
      <h1 className="mt-8 text-2xl font-semibold">{pl.auth.resetTitle}</h1>

      {invalidLink ? (
        <p className="mt-6 rounded-md bg-red-50 px-3 py-3 text-sm text-red-900" role="alert">
          {pl.auth.resetInvalid}
        </p>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
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
            {pl.auth.resetSubmit}
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
