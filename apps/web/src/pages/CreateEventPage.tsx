import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventBodySchema, groceryCategorySchema, type CreateEventBody, type GroceryCategory, createEventResponseSchema, } from "@pomagappka/shared";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { pl } from "@/locales/pl";
const groceryCategories = groceryCategorySchema.options;
export function CreateEventPage() {
    const navigate = useNavigate();
    const [formError, setFormError] = useState<string | null>(null);
    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, } = useForm<CreateEventBody>({
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
            dropOffAddress: "",
            recipientPhone: "",
            preferredDeliveryTime: "",
            specialInstructions: "",
            favoriteMeals: "",
            leastFavoriteMeals: "",
            allergies: "",
            photoUrl: "",
            photoCaption: "",
            groceryList: "",
            groceryCategories: [],
            budgetHint: "",
            storePreference: "",
            dietaryOrAllergyNotes: "",
            deliveryOrPickupNotes: "",
        },
    });
    const assistanceType = watch("assistanceType") ?? "meal";
    const selectedCategories = watch("groceryCategories") ?? [];
    function toggleCategory(category: GroceryCategory) {
        const next = selectedCategories.includes(category)
            ? selectedCategories.filter((item) => item !== category)
            : [...selectedCategories, category];
        setValue("groceryCategories", next, { shouldValidate: true });
    }
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
                dropOffAddress: values.dropOffAddress || null,
                recipientPhone: values.recipientPhone || null,
                preferredDeliveryTime: values.preferredDeliveryTime || null,
                specialInstructions: values.specialInstructions || null,
                favoriteMeals: values.favoriteMeals || null,
                leastFavoriteMeals: values.leastFavoriteMeals || null,
                allergies: values.allergies || null,
                photoUrl: values.photoUrl || null,
                photoCaption: values.photoCaption || null,
                groceryList: values.groceryList || null,
                groceryCategories: values.groceryCategories?.length
                    ? values.groceryCategories
                    : null,
                budgetHint: values.budgetHint || null,
                storePreference: values.storePreference || null,
                dietaryOrAllergyNotes: values.dietaryOrAllergyNotes || null,
                deliveryOrPickupNotes: values.deliveryOrPickupNotes || null,
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
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{pl.eventForm.assistanceType}</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="meal" {...register("assistanceType")}/>
            {pl.eventForm.typeMeal}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="grocery" {...register("assistanceType")}/>
            {pl.eventForm.typeGrocery}
          </label>
        </fieldset>
        <TextField label={pl.eventForm.title} error={errors.title ? pl.eventForm.validation : undefined} {...register("title")}/>
        <TextArea label={pl.eventForm.description} {...register("description")}/>
        <TextField label={pl.eventForm.recipient} error={errors.recipientDisplayName ? pl.eventForm.validation : undefined} {...register("recipientDisplayName")}/>
        <TextField label={pl.eventForm.peopleCount} type="number" min={1} error={errors.peopleCount ? pl.eventForm.validation : undefined} {...register("peopleCount", { valueAsNumber: true })}/>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={pl.eventForm.startsOn} type="date" error={errors.startsOn ? pl.eventForm.validation : undefined} {...register("startsOn")}/>
          <TextField label={pl.eventForm.endsOn} type="date" error={errors.endsOn ? pl.eventForm.validation : undefined} {...register("endsOn")}/>
        </div>
        <TextField label={pl.eventForm.dropOffAddress} {...register("dropOffAddress")}/>
        <TextField label={pl.eventForm.recipientPhone} {...register("recipientPhone")}/>
        <TextField label={pl.eventForm.preferredDeliveryTime} {...register("preferredDeliveryTime")}/>
        <TextArea label={pl.eventForm.specialInstructions} {...register("specialInstructions")}/>
        <TextField label={pl.eventForm.photoUrl} type="url" {...register("photoUrl")}/>
        <TextField label={pl.eventForm.photoCaption} {...register("photoCaption")}/>

        {assistanceType === "meal" ? (<>
            <TextArea label={pl.eventForm.dietary} {...register("dietaryPreferences")}/>
            <TextArea label={pl.eventForm.allergies} {...register("allergies")}/>
            <TextArea label={pl.eventForm.favoriteMeals} {...register("favoriteMeals")}/>
            <TextArea label={pl.eventForm.leastFavoriteMeals} {...register("leastFavoriteMeals")}/>
          </>) : (<>
            <TextArea label={pl.eventForm.groceryList} {...register("groceryList")}/>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                {pl.eventForm.groceryCategories}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {groceryCategories.map((category) => (<label key={category} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => toggleCategory(category)}/>
                    {pl.eventForm.groceryCategory[category]}
                  </label>))}
              </div>
            </fieldset>
            <TextField label={pl.eventForm.budgetHint} {...register("budgetHint")}/>
            <TextField label={pl.eventForm.storePreference} {...register("storePreference")}/>
            <TextArea label={pl.eventForm.dietaryOrAllergyNotes} {...register("dietaryOrAllergyNotes")}/>
            <TextArea label={pl.eventForm.deliveryOrPickupNotes} {...register("deliveryOrPickupNotes")}/>
          </>)}

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
