import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBookingBodySchema, createBookingResponseSchema, eventUpdatesResponseSchema, participantEventSchema, participantSlotsResponseSchema, type CreateBookingBody, type CreateBookingResponse, type EventUpdate, type ParticipantEvent, type ParticipantSlot, } from "@pomagappka/shared";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { pl } from "@/locales/pl";
function DetailLine({ label, value, }: {
    label: string;
    value: string | null | undefined;
}) {
    if (!value)
        return null;
    return (<p className="mt-3 text-sm">
      <span className="font-semibold">{label}</span> {value}
    </p>);
}
export function InviteEventPage() {
    const { token } = useParams<{
        token: string;
    }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<ParticipantEvent | null>(null);
    const [slots, setSlots] = useState<ParticipantSlot[]>([]);
    const [updates, setUpdates] = useState<EventUpdate[]>([]);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<CreateBookingResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { register, handleSubmit, setValue, formState: { isSubmitting, errors }, } = useForm<CreateBookingBody>({
        resolver: zodResolver(createBookingBodySchema),
        defaultValues: {
            slotId: "",
            participantName: "",
            participantEmail: "",
            mealDescription: "",
            idempotencyKey: crypto.randomUUID(),
        },
    });
    useEffect(() => {
        if (!token)
            return;
        let cancelled = false;
        async function load() {
            const [eventRes, slotsRes, updatesRes] = await Promise.all([
                fetch(`/api/invite/${token}/event`, { credentials: "include" }),
                fetch(`/api/invite/${token}/slots`, { credentials: "include" }),
                fetch(`/api/invite/${token}/updates`, { credentials: "include" }),
            ]);
            if (cancelled)
                return;
            if (eventRes.status === 401 || slotsRes.status === 401) {
                navigate(`/i/${token}`, { replace: true });
                return;
            }
            if (eventRes.status === 404) {
                setError(pl.invite.notFound);
                return;
            }
            if (!eventRes.ok || !slotsRes.ok) {
                setError(pl.auth.errorGeneric);
                return;
            }
            const eventJson = (await eventRes.json()) as {
                event: unknown;
            };
            setEvent(participantEventSchema.parse(eventJson.event));
            const slotsJson = participantSlotsResponseSchema.parse(await slotsRes.json());
            setSlots(slotsJson.slots);
            if (updatesRes.ok) {
                setUpdates(eventUpdatesResponseSchema.parse(await updatesRes.json()).updates);
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, [token, navigate]);
    async function logout() {
        if (!token)
            return;
        await fetch(`/api/invite/${token}/logout`, {
            method: "POST",
            credentials: "include",
        });
        navigate(`/i/${token}`, { replace: true });
    }
    function selectSlot(slot: ParticipantSlot) {
        if (!slot.available)
            return;
        setSelectedSlotId(slot.id);
        setValue("slotId", slot.id, { shouldValidate: true });
    }
    async function onSubmit(values: CreateBookingBody) {
        if (!token)
            return;
        setError(null);
        const response = await fetch(`/api/invite/${token}/bookings`, {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                ...values,
                mealDescription: values.mealDescription || null,
            }),
        });
        if (response.status === 409) {
            setError(pl.invite.slotTaken);
            const slotsRes = await fetch(`/api/invite/${token}/slots`, {
                credentials: "include",
            });
            if (slotsRes.ok) {
                setSlots(participantSlotsResponseSchema.parse(await slotsRes.json()).slots);
            }
            return;
        }
        if (!response.ok) {
            setError(pl.auth.errorGeneric);
            return;
        }
        setConfirmation(createBookingResponseSchema.parse(await response.json()));
    }
    if (error && !event) {
        return (<main className="mx-auto max-w-md px-6 py-16">
        <p className="text-red-800" role="alert">
          {error}
        </p>
        <Link className="mt-4 inline-block text-[var(--color-sea)] underline" to="/">
          {pl.auth.backHome}
        </Link>
      </main>);
    }
    if (!event) {
        return (<main className="mx-auto max-w-md px-6 py-16">
        <p role="status">{pl.dashboard.loading}</p>
      </main>);
    }
    if (confirmation) {
        return (<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-12">
        <h1 className="text-2xl font-semibold">{pl.invite.confirmationTitle}</h1>
        <p className="mt-3 text-sm leading-relaxed" role="status" aria-live="polite">
          {pl.invite.confirmationBody}
        </p>
        <p className="mt-4 text-sm">
          {confirmation.booking.slotDate} · {confirmation.booking.participantName}
        </p>
        <p className="mt-6 text-sm font-semibold">{pl.invite.cancelLink}</p>
        <p className="mt-2 break-all rounded-md bg-white/80 px-3 py-2 text-sm">
          <a href={confirmation.cancelUrl} className="text-[var(--color-sea)] underline">
            {confirmation.cancelUrl}
          </a>
        </p>
        <Link to={`/i/${token}/wydarzenie`} className="mt-8">
          <Button variant="secondary">{pl.invite.backToEvent}</Button>
        </Link>
      </main>);
    }
    const isGrocery = event.assistanceType === "grocery";
    const categoryLabels = event.groceryCategories
        ?.map((category) => pl.eventForm.groceryCategory[category])
        .join(", ");
    return (<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <Link to="/" className="brand text-2xl font-bold text-[var(--color-sea)]">
          {pl.brand}
        </Link>
        <Button variant="ghost" onClick={() => void logout()}>
          {pl.invite.logout}
        </Button>
      </div>

      <p className="mt-8 text-sm uppercase tracking-[0.08em] text-[var(--color-lagoon)]">
        {pl.invite.eventTitle} ·{" "}
        {isGrocery ? pl.dashboard.typeGrocery : pl.dashboard.typeMeal}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{event.title}</h1>
      <p className="mt-4 text-base">
        <span className="font-semibold">{pl.invite.forRecipient}</span>{" "}
        {event.recipientDisplayName}
      </p>
      <p className="mt-2 text-sm">
        {pl.invite.people} {event.peopleCount}
      </p>
      <p className="mt-1 text-sm">
        {pl.invite.dates} {event.startsOn} – {event.endsOn}
      </p>
      {event.description ? (<p className="mt-6 text-base leading-relaxed">{event.description}</p>) : null}
      {event.photoUrl ? (<figure className="mt-6">
          <img src={event.photoUrl} alt={event.photoCaption ?? event.title} className="max-h-72 w-full rounded-md object-cover"/>
          {event.photoCaption ? (<figcaption className="mt-2 text-sm opacity-80">
              {event.photoCaption}
            </figcaption>) : null}
        </figure>) : null}

      <DetailLine label={pl.invite.dropOffAddress} value={event.dropOffAddress}/>
      <DetailLine label={pl.invite.recipientPhone} value={event.recipientPhone}/>
      <DetailLine label={pl.invite.preferredDeliveryTime} value={event.preferredDeliveryTime}/>
      <DetailLine label={pl.invite.specialInstructions} value={event.specialInstructions}/>

      <div className="mt-6">
        <PrivacyNotice variant="recipient" />
      </div>

      {isGrocery ? (<>
          <DetailLine label={pl.invite.groceryList} value={event.groceryList}/>
          <DetailLine label={pl.invite.groceryCategories} value={categoryLabels}/>
          <DetailLine label={pl.invite.budgetHint} value={event.budgetHint}/>
          <DetailLine label={pl.invite.storePreference} value={event.storePreference}/>
          <DetailLine label={pl.invite.deliveryOrPickupNotes} value={event.deliveryOrPickupNotes}/>
        </>) : (<>
          <DetailLine label={pl.invite.dietary} value={event.dietaryPreferences}/>
          <DetailLine label={pl.invite.favoriteMeals} value={event.favoriteMeals}/>
          <DetailLine label={pl.invite.leastFavoriteMeals} value={event.leastFavoriteMeals}/>
        </>)}

      {updates.length > 0 ? (<section className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-lagoon)]">
            {pl.invite.updatesHeading}
          </h2>
          <ul className="space-y-3">
            {updates.map((update) => (<li key={update.id} className="rounded-md border border-[var(--color-line)] bg-white/80 px-3 py-3 text-sm">
                {update.imageUrl ? (<img src={update.imageUrl} alt={update.caption ?? ""} className="mb-2 max-h-48 w-full rounded object-cover"/>) : null}
                {update.caption ? <p>{update.caption}</p> : null}
              </li>))}
          </ul>
        </section>) : null}

      <section className="mt-10 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-lagoon)]">
          {pl.invite.calendarHeading}
        </h2>
        {slots.length === 0 ? (<p className="text-sm">{pl.invite.emptySlots}</p>) : (<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.map((slot) => (<button key={slot.id} type="button" disabled={!slot.available} onClick={() => selectSlot(slot)} className={`rounded-md border px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${selectedSlotId === slot.id
                    ? "border-[var(--color-sea)] bg-[var(--color-mist)]"
                    : "border-[var(--color-line)] bg-white/80"}`}>
                <span className="font-semibold">{slot.slotDate}</span>
                <span className="mt-1 block text-xs">
                  {slot.available ? pl.invite.available : pl.invite.taken}
                </span>
              </button>))}
          </div>)}
      </section>

      {selectedSlotId ? (<form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <h2 className="text-lg font-semibold">{pl.invite.bookTitle}</h2>
          <PrivacyNotice variant="booking" />
          <input type="hidden" {...register("slotId")}/>
          <TextField label={pl.invite.name} error={errors.participantName ? pl.auth.validationName : undefined} {...register("participantName")}/>
          <TextField label={pl.invite.email} type="email" error={errors.participantEmail ? pl.auth.validationEmail : undefined} {...register("participantEmail")}/>
          <TextArea label={isGrocery ? pl.invite.groceryNote : pl.invite.meal} {...register("mealDescription")}/>
          {error ? (<p className="text-sm text-red-700" role="alert">
              {error}
            </p>) : null}
          <Button type="submit" disabled={isSubmitting}>
            {pl.invite.submitBook}
          </Button>
        </form>) : null}

      <div className="mt-12">
        <SiteFooter />
      </div>
    </main>);
}
