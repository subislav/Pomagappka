import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBookingBodySchema, createBookingResponseSchema, createEventUpdateBodySchema, eventUpdatesResponseSchema, groceryCategorySchema, mealSlotSchema, organizerBookingsResponseSchema, organizerEventSchema, organizerSlotsResponseSchema, regeneratePinResponseSchema, updateEventBodySchema, type Booking, type CreateBookingBody, type CreateEventUpdateBody, type EventUpdate, type GroceryCategory, type MealSlot, type OrganizerEvent, type UpdateEventBody, } from "@pomagappka/shared";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { eachDateInclusive } from "@/lib/dates";
import { pl } from "@/locales/pl";
type LocationState = {
    showOncePin?: string;
};
const slotsPayloadSchema = z.object({
    slots: z.array(mealSlotSchema),
});
const groceryCategories = groceryCategorySchema.options;
function emptyToNull(value: string | null | undefined) {
    return value ? value : null;
}
export function EventDetailPage() {
    const { id } = useParams<{
        id: string;
    }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [event, setEvent] = useState<OrganizerEvent | null>(null);
    const [slots, setSlots] = useState<MealSlot[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [updates, setUpdates] = useState<EventUpdate[]>([]);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [newDate, setNewDate] = useState("");
    const [showOncePin, setShowOncePin] = useState<string | null>((location.state as LocationState | null)?.showOncePin ?? null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting, errors }, } = useForm<UpdateEventBody>({
        resolver: zodResolver(updateEventBodySchema),
    });
    const selectedCategories = watch("groceryCategories") ?? [];
    const updateForm = useForm<CreateEventUpdateBody>({
        resolver: zodResolver(createEventUpdateBodySchema),
        defaultValues: { imageUrl: "", caption: "" },
    });
    const behalfForm = useForm<CreateBookingBody>({
        resolver: zodResolver(createBookingBodySchema),
        defaultValues: {
            slotId: "",
            participantName: "",
            participantEmail: "",
            mealDescription: "",
            idempotencyKey: crypto.randomUUID(),
        },
    });
    const rangeDates = useMemo(() => {
        if (!event)
            return [];
        return eachDateInclusive(event.startsOn, event.endsOn);
    }, [event]);
    const freeSlots = slots.filter((slot) => slot.status === "available" && !slot.isBooked);
    async function loadExtras(eventId: string) {
        const [slotsRes, bookingsRes, updatesRes] = await Promise.all([
            fetch(`/api/organizer/events/${eventId}/slots`, { credentials: "include" }),
            fetch(`/api/organizer/events/${eventId}/bookings`, {
                credentials: "include",
            }),
            fetch(`/api/organizer/events/${eventId}/updates`, {
                credentials: "include",
            }),
        ]);
        if (slotsRes.ok) {
            const parsed = organizerSlotsResponseSchema.parse(await slotsRes.json());
            setSlots(parsed.slots);
            setSelectedDates(parsed.slots
                .filter((s) => s.status === "available")
                .map((s) => s.slotDate));
        }
        if (bookingsRes.ok) {
            const parsed = organizerBookingsResponseSchema.parse(await bookingsRes.json());
            setBookings(parsed.bookings);
        }
        if (updatesRes.ok) {
            const parsed = eventUpdatesResponseSchema.parse(await updatesRes.json());
            setUpdates(parsed.updates);
        }
    }
    function applyEventToForm(parsed: OrganizerEvent) {
        reset({
            title: parsed.title,
            description: parsed.description ?? "",
            recipientDisplayName: parsed.recipientDisplayName,
            peopleCount: parsed.peopleCount,
            startsOn: parsed.startsOn,
            endsOn: parsed.endsOn,
            dietaryPreferences: parsed.dietaryPreferences ?? "",
            dropOffAddress: parsed.dropOffAddress ?? "",
            recipientPhone: parsed.recipientPhone ?? "",
            preferredDeliveryTime: parsed.preferredDeliveryTime ?? "",
            specialInstructions: parsed.specialInstructions ?? "",
            favoriteMeals: parsed.favoriteMeals ?? "",
            leastFavoriteMeals: parsed.leastFavoriteMeals ?? "",
            allergies: parsed.allergies ?? "",
            photoUrl: parsed.photoUrl ?? "",
            photoCaption: parsed.photoCaption ?? "",
            groceryList: parsed.groceryList ?? "",
            groceryCategories: parsed.groceryCategories ?? [],
            budgetHint: parsed.budgetHint ?? "",
            storePreference: parsed.storePreference ?? "",
            dietaryOrAllergyNotes: parsed.dietaryOrAllergyNotes ?? "",
            deliveryOrPickupNotes: parsed.deliveryOrPickupNotes ?? "",
        });
    }
    useEffect(() => {
        if (!id)
            return;
        let cancelled = false;
        async function load() {
            const response = await fetch(`/api/organizer/events/${id}`, {
                credentials: "include",
            });
            if (response.status === 401) {
                navigate("/logowanie", { replace: true });
                return;
            }
            if (!response.ok) {
                if (!cancelled)
                    setError(pl.auth.errorGeneric);
                return;
            }
            const json = (await response.json()) as {
                event: unknown;
            };
            const parsed = organizerEventSchema.parse(json.event);
            if (!cancelled) {
                setEvent(parsed);
                applyEventToForm(parsed);
                await loadExtras(parsed.id);
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, [id, navigate, reset]);
    function toggleCategory(category: GroceryCategory) {
        const next = selectedCategories.includes(category)
            ? selectedCategories.filter((item) => item !== category)
            : [...selectedCategories, category];
        setValue("groceryCategories", next, { shouldValidate: true });
    }
    async function onSave(values: UpdateEventBody) {
        if (!id)
            return;
        setError(null);
        const response = await fetch(`/api/organizer/events/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                ...values,
                description: emptyToNull(values.description),
                dietaryPreferences: emptyToNull(values.dietaryPreferences),
                dropOffAddress: emptyToNull(values.dropOffAddress),
                recipientPhone: emptyToNull(values.recipientPhone),
                preferredDeliveryTime: emptyToNull(values.preferredDeliveryTime),
                specialInstructions: emptyToNull(values.specialInstructions),
                favoriteMeals: emptyToNull(values.favoriteMeals),
                leastFavoriteMeals: emptyToNull(values.leastFavoriteMeals),
                allergies: emptyToNull(values.allergies),
                photoUrl: emptyToNull(values.photoUrl),
                photoCaption: emptyToNull(values.photoCaption),
                groceryList: emptyToNull(values.groceryList),
                groceryCategories: values.groceryCategories?.length
                    ? values.groceryCategories
                    : null,
                budgetHint: emptyToNull(values.budgetHint),
                storePreference: emptyToNull(values.storePreference),
                dietaryOrAllergyNotes: emptyToNull(values.dietaryOrAllergyNotes),
                deliveryOrPickupNotes: emptyToNull(values.deliveryOrPickupNotes),
            }),
        });
        if (!response.ok) {
            setError(pl.eventForm.validation);
            return;
        }
        const json = (await response.json()) as {
            event: unknown;
        };
        const parsed = organizerEventSchema.parse(json.event);
        setEvent(parsed);
        applyEventToForm(parsed);
    }
    async function onSaveSlots() {
        if (!id)
            return;
        setError(null);
        const response = await fetch(`/api/organizer/events/${id}/slots`, {
            method: "PUT",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ dates: selectedDates }),
        });
        if (!response.ok) {
            setError(pl.auth.errorGeneric);
            return;
        }
        const parsed = slotsPayloadSchema.parse(await response.json());
        setSlots(parsed.slots);
        await loadExtras(id);
    }
    function toggleDate(date: string) {
        setSelectedDates((prev) => prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date].sort());
    }
    function addCustomDate() {
        if (!newDate)
            return;
        if (!rangeDates.includes(newDate)) {
            setError(pl.eventForm.validation);
            return;
        }
        setSelectedDates((prev) => prev.includes(newDate) ? prev : [...prev, newDate].sort());
        setNewDate("");
    }
    async function onAddUpdate(values: CreateEventUpdateBody) {
        if (!id)
            return;
        setError(null);
        const response = await fetch(`/api/organizer/events/${id}/updates`, {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                imageUrl: emptyToNull(values.imageUrl),
                caption: emptyToNull(values.caption),
            }),
        });
        if (!response.ok) {
            setError(pl.eventForm.validation);
            return;
        }
        updateForm.reset({ imageUrl: "", caption: "" });
        await loadExtras(id);
    }
    async function onDeleteUpdate(updateId: string) {
        if (!id)
            return;
        const response = await fetch(`/api/organizer/events/${id}/updates/${updateId}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!response.ok && response.status !== 204) {
            setError(pl.auth.errorGeneric);
            return;
        }
        await loadExtras(id);
    }
    async function onBookOnBehalf(values: CreateBookingBody) {
        if (!id)
            return;
        setError(null);
        const response = await fetch(`/api/organizer/events/${id}/bookings`, {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                ...values,
                mealDescription: emptyToNull(values.mealDescription),
                idempotencyKey: crypto.randomUUID(),
            }),
        });
        if (!response.ok) {
            setError(response.status === 409
                ? pl.invite.slotTaken
                : pl.auth.errorGeneric);
            return;
        }
        createBookingResponseSchema.parse(await response.json());
        behalfForm.reset({
            slotId: "",
            participantName: "",
            participantEmail: "",
            mealDescription: "",
            idempotencyKey: crypto.randomUUID(),
        });
        await loadExtras(id);
    }
    async function onRegeneratePin() {
        if (!id || !window.confirm(pl.eventDetail.regenerateConfirm))
            return;
        const response = await fetch(`/api/organizer/events/${id}/pin/regenerate`, { method: "POST", credentials: "include" });
        if (!response.ok) {
            setError(pl.auth.errorGeneric);
            return;
        }
        const payload = regeneratePinResponseSchema.parse(await response.json());
        setShowOncePin(payload.pin);
        setEvent((prev) => prev ? { ...prev, pinVersion: payload.pinVersion } : prev);
    }
    async function onClose() {
        if (!id)
            return;
        const response = await fetch(`/api/organizer/events/${id}/close`, {
            method: "POST",
            credentials: "include",
        });
        if (!response.ok) {
            setError(pl.auth.errorGeneric);
            return;
        }
        const json = (await response.json()) as {
            event: unknown;
        };
        setEvent(organizerEventSchema.parse(json.event));
    }
    async function onDelete() {
        if (!id || !window.confirm(pl.eventDetail.deleteConfirm))
            return;
        const response = await fetch(`/api/organizer/events/${id}`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!response.ok && response.status !== 204) {
            setError(pl.auth.errorGeneric);
            return;
        }
        navigate("/panel", { replace: true });
    }
    async function copyLink() {
        if (!event)
            return;
        await navigator.clipboard.writeText(event.invitationUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    }
    if (!event) {
        return (<main className="mx-auto max-w-xl px-6 py-10">
        <p role="status">{pl.dashboard.loading}</p>
        {error ? <p className="mt-2 text-red-700">{error}</p> : null}
      </main>);
    }
    const isGrocery = event.assistanceType === "grocery";
    return (<main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
      <Link to="/panel" className="text-sm text-[var(--color-sea)] underline">
        {pl.eventDetail.back}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{pl.eventDetail.title}</h1>
      <p className="mt-1 text-sm text-[var(--color-lagoon)]">
        {isGrocery ? pl.dashboard.typeGrocery : pl.dashboard.typeMeal}
      </p>

      {event.status === "closed" ? (<p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {pl.eventDetail.closedNotice}
        </p>) : null}

      {showOncePin ? (<section className="mt-6 rounded-md border border-[var(--color-line)] bg-white px-4 py-4">
          <h2 className="font-semibold">{pl.eventDetail.pinOnceTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed">{pl.eventDetail.pinOnceBody}</p>
          <p className="mt-3 font-mono text-3xl tracking-[0.3em] text-[var(--color-sea)]">
            {showOncePin}
          </p>
        </section>) : null}

      <section className="mt-6 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-lagoon)]">
          {pl.eventDetail.invitation}
        </h2>
        <p className="break-all rounded-md bg-white/80 px-3 py-2 text-sm">
          {event.invitationUrl}
        </p>
        <Button type="button" variant="secondary" onClick={() => void copyLink()}>
          {copied ? pl.eventDetail.copied : pl.eventDetail.copyLink}
        </Button>
      </section>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSave)} noValidate>
        <TextField label={pl.eventForm.title} error={errors.title ? pl.eventForm.validation : undefined} {...register("title")}/>
        <TextArea label={pl.eventForm.description} {...register("description")}/>
        <TextField label={pl.eventForm.recipient} {...register("recipientDisplayName")}/>
        <TextField label={pl.eventForm.peopleCount} type="number" {...register("peopleCount", { valueAsNumber: true })}/>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={pl.eventForm.startsOn} type="date" {...register("startsOn")}/>
          <TextField label={pl.eventForm.endsOn} type="date" {...register("endsOn")}/>
        </div>
        <TextField label={pl.eventForm.dropOffAddress} {...register("dropOffAddress")}/>
        <TextField label={pl.eventForm.recipientPhone} {...register("recipientPhone")}/>
        <TextField label={pl.eventForm.preferredDeliveryTime} {...register("preferredDeliveryTime")}/>
        <TextArea label={pl.eventForm.specialInstructions} {...register("specialInstructions")}/>
        <TextField label={pl.eventForm.photoUrl} type="url" {...register("photoUrl")}/>
        <TextField label={pl.eventForm.photoCaption} {...register("photoCaption")}/>
        {isGrocery ? (<>
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
          </>) : (<>
            <TextArea label={pl.eventForm.dietary} {...register("dietaryPreferences")}/>
            <TextArea label={pl.eventForm.allergies} {...register("allergies")}/>
            <TextArea label={pl.eventForm.favoriteMeals} {...register("favoriteMeals")}/>
            <TextArea label={pl.eventForm.leastFavoriteMeals} {...register("leastFavoriteMeals")}/>
          </>)}
        <Button type="submit" disabled={isSubmitting}>
          {pl.eventForm.submitSave}
        </Button>
      </form>

      <section className="mt-10 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-lagoon)]">
          {pl.eventDetail.updatesHeading}
        </h2>
        <p className="text-sm text-[color-mix(in_srgb,var(--color-ink)_70%,white)]">
          {pl.eventDetail.updatesHelp}
        </p>
        <form className="space-y-3" onSubmit={updateForm.handleSubmit((values) => void onAddUpdate(values))} noValidate>
          <TextField label={pl.eventDetail.updateImageUrl} type="url" {...updateForm.register("imageUrl")}/>
          <TextArea label={pl.eventDetail.updateCaption} {...updateForm.register("caption")}/>
          <Button type="submit">{pl.eventDetail.addUpdate}</Button>
        </form>
        {updates.length === 0 ? (<p className="text-sm">{pl.eventDetail.updatesEmpty}</p>) : (<ul className="space-y-2">
            {updates.map((update) => (<li key={update.id} className="rounded-md border border-[var(--color-line)] bg-white/80 px-3 py-3 text-sm">
                {update.imageUrl ? (<p className="break-all">
                    <a href={update.imageUrl} className="text-[var(--color-sea)] underline" target="_blank" rel="noreferrer">
                      {update.imageUrl}
                    </a>
                  </p>) : null}
                {update.caption ? <p className="mt-1">{update.caption}</p> : null}
                <div className="mt-2">
                  <Button type="button" variant="ghost" onClick={() => void onDeleteUpdate(update.id)}>
                    {pl.eventDetail.deleteUpdate}
                  </Button>
                </div>
              </li>))}
          </ul>)}
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-lagoon)]">
          {isGrocery
            ? pl.eventDetail.slotsHeadingGrocery
            : pl.eventDetail.slotsHeadingMeal}
        </h2>
        <p className="text-sm text-[color-mix(in_srgb,var(--color-ink)_70%,white)]">
          {pl.eventDetail.slotsHelp}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {rangeDates.map((date) => {
            const selected = selectedDates.includes(date);
            const meta = slots.find((s) => s.slotDate === date);
            return (<button key={date} type="button" onClick={() => toggleDate(date)} className={`rounded-md border px-3 py-2 text-left text-sm ${selected
                    ? "border-[var(--color-sea)] bg-[var(--color-mist)]"
                    : "border-[var(--color-line)] bg-white/70"}`}>
                <span className="font-semibold">{date}</span>
                <span className="mt-1 block text-xs opacity-70">
                  {meta?.isBooked
                    ? pl.eventDetail.slotBooked
                    : selected
                        ? pl.eventDetail.slotFree
                        : meta?.status === "cancelled"
                            ? pl.eventDetail.slotCancelled
                            : "—"}
                </span>
              </button>);
        })}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <TextField label={pl.eventDetail.addDate} type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} min={event.startsOn} max={event.endsOn}/>
          <Button type="button" variant="secondary" onClick={addCustomDate}>
            {pl.eventDetail.addDate}
          </Button>
        </div>
        <Button type="button" onClick={() => void onSaveSlots()}>
          {pl.eventDetail.saveSlots}
        </Button>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-lagoon)]">
          {pl.eventDetail.bookOnBehalfHeading}
        </h2>
        <p className="text-sm text-[color-mix(in_srgb,var(--color-ink)_70%,white)]">
          {pl.eventDetail.bookOnBehalfHelp}
        </p>
        {freeSlots.length === 0 ? (<p className="text-sm">{pl.eventDetail.noSlots}</p>) : (<form className="space-y-3" onSubmit={behalfForm.handleSubmit((values) => void onBookOnBehalf(values))} noValidate>
            <label className="block text-sm font-medium">
              {pl.invite.calendarHeading}
              <select className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2" {...behalfForm.register("slotId")}>
                <option value="">{pl.eventDetail.noSlots}</option>
                {freeSlots.map((slot) => (<option key={slot.id} value={slot.id}>
                    {slot.slotDate}
                  </option>))}
              </select>
            </label>
            <TextField label={pl.invite.name} {...behalfForm.register("participantName")}/>
            <TextField label={pl.invite.email} type="email" {...behalfForm.register("participantEmail")}/>
            <TextArea label={isGrocery ? pl.invite.groceryNote : pl.invite.meal} {...behalfForm.register("mealDescription")}/>
            <Button type="submit">{pl.eventDetail.bookOnBehalfSubmit}</Button>
          </form>)}
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-lagoon)]">
          {pl.eventDetail.bookingsHeading}
        </h2>
        {bookings.length === 0 ? (<p className="text-sm">{pl.eventDetail.bookingsEmpty}</p>) : (<ul className="space-y-2">
            {bookings.map((booking) => (<li key={booking.id} className="rounded-md border border-[var(--color-line)] bg-white/80 px-3 py-3 text-sm">
                <p className="font-semibold">
                  {booking.slotDate} · {booking.participantName}
                </p>
                <p>{booking.participantEmail}</p>
                {booking.mealDescription ? <p>{booking.mealDescription}</p> : null}
                {booking.bookedOnBehalf ? (<p className="mt-1 text-xs text-[var(--color-lagoon)]">
                    {pl.eventDetail.bookedOnBehalf}
                  </p>) : null}
                <p className="mt-1 text-xs uppercase tracking-wide opacity-70">
                  {booking.status}
                </p>
              </li>))}
          </ul>)}
      </section>

      {error ? (<p className="mt-6 text-sm text-red-700" role="alert">
          {error}
        </p>) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={() => void onRegeneratePin()}>
          {pl.eventDetail.regeneratePin}
        </Button>
        {event.status === "open" ? (<Button type="button" variant="secondary" onClick={() => void onClose()}>
            {pl.eventDetail.closeEvent}
          </Button>) : null}
        <Button type="button" variant="ghost" onClick={() => void onDelete()}>
          {pl.eventDetail.deleteEvent}
        </Button>
      </div>
    </main>);
}
