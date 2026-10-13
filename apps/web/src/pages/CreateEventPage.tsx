import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventBodySchema, createEventResponseSchema, type CreateEventBody, } from "@pomagappka/shared";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { pl } from "@/locales/pl";
export function CreateEventPage() {
    const navigate = useNavigate();
    const [formError, setFormError] = useState<string | null>(null);
    const { register, handleSubmit, formState: { errors, isSubmitting }, } = useForm<CreateEventBody>({
        resolver: zodResolver(createEventBodySchema),
        defaultValues: {
            title: "",
            description: "",
            recipientDisplayName: "",
            peopleCount: 2,
            startsOn: "",
            endsOn: "",
            dietaryPreferences: "",
            assistanceType: "meal",
        },
    });
    async function onSubmit(values: CreateEventBody) {
        setFormError(null);
        const response = await fetch("/api/organizer/events", {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                ...values,
                description: values.description || null,
                dietaryPreferences: values.dietaryPreferences || null,
            }),
        });
        if (response.status === 401) {
            navigate("/logowanie", { replace: true });
            return;
        }
        if (!response.ok) {
            setFormError(pl.eventForm.validation);
            return;
        }
        const payload = createEventResponseSchema.parse(await response.json());
        navigate(`/panel/wydarzenia/${payload.event.id}`, {
            replace: true,
            state: { showOncePin: payload.pin },
        });
    }
    return (<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-10">
      <Link to="/panel" className="brand text-2xl font-bold text-[var(--color-sea)]">
        {pl.brand}
      </Link>
      <h1 className="mt-6 text-2xl font-semibold">{pl.eventForm.createTitle}</h1>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField label={pl.eventForm.title} error={errors.title ? pl.eventForm.validation : undefined} {...register("title")}/>
        <TextArea label={pl.eventForm.description} {...register("description")}/>
        <TextField label={pl.eventForm.recipient} error={errors.recipientDisplayName ? pl.eventForm.validation : undefined} {...register("recipientDisplayName")}/>
        <TextField label={pl.eventForm.peopleCount} type="number" min={1} error={errors.peopleCount ? pl.eventForm.validation : undefined} {...register("peopleCount", { valueAsNumber: true })}/>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={pl.eventForm.startsOn} type="date" error={errors.startsOn ? pl.eventForm.validation : undefined} {...register("startsOn")}/>
          <TextField label={pl.eventForm.endsOn} type="date" error={errors.endsOn ? pl.eventForm.validation : undefined} {...register("endsOn")}/>
        </div>
        <TextArea label={pl.eventForm.dietary} {...register("dietaryPreferences")}/>

        {formError ? (<p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {formError}
          </p>) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {pl.eventForm.submitCreate}
          </Button>
          <Link to="/panel">
            <Button type="button" variant="secondary">
              {pl.eventForm.cancel}
            </Button>
          </Link>
        </div>
      </form>
    </main>);
}
