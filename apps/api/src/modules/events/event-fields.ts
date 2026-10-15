import type { CreateEventBody, UpdateEventBody } from "@pomagappka/shared";

function nullableText(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function eventDetailInsertValues(input: CreateEventBody) {
  return {
    dietaryPreferences: nullableText(input.dietaryPreferences) ?? null,
    dropOffAddress: nullableText(input.dropOffAddress) ?? null,
    recipientPhone: nullableText(input.recipientPhone) ?? null,
    preferredDeliveryTime: nullableText(input.preferredDeliveryTime) ?? null,
    specialInstructions: nullableText(input.specialInstructions) ?? null,
    favoriteMeals: nullableText(input.favoriteMeals) ?? null,
    leastFavoriteMeals: nullableText(input.leastFavoriteMeals) ?? null,
    allergies: null,
    photoUrl: nullableText(input.photoUrl) ?? null,
    photoCaption: nullableText(input.photoCaption) ?? null,
    groceryList: nullableText(input.groceryList) ?? null,
    groceryCategories: input.groceryCategories ?? null,
    budgetHint: nullableText(input.budgetHint) ?? null,
    storePreference: nullableText(input.storePreference) ?? null,
    dietaryOrAllergyNotes: null,
    deliveryOrPickupNotes: nullableText(input.deliveryOrPickupNotes) ?? null,
  };
}

export function eventDetailUpdateValues(
  input: UpdateEventBody,
  existing: {
    dietaryPreferences: string | null;
    dropOffAddress: string | null;
    recipientPhone: string | null;
    preferredDeliveryTime: string | null;
    specialInstructions: string | null;
    favoriteMeals: string | null;
    leastFavoriteMeals: string | null;
    allergies: string | null;
    photoUrl: string | null;
    photoCaption: string | null;
    groceryList: string | null;
    groceryCategories: string[] | null;
    budgetHint: string | null;
    storePreference: string | null;
    dietaryOrAllergyNotes: string | null;
    deliveryOrPickupNotes: string | null;
  },
) {
  const pick = <T,>(next: T | undefined, current: T): T =>
    next === undefined ? current : next;
  return {
    dietaryPreferences: pick(
      nullableText(input.dietaryPreferences),
      existing.dietaryPreferences,
    ),
    dropOffAddress: pick(
      nullableText(input.dropOffAddress),
      existing.dropOffAddress,
    ),
    recipientPhone: pick(
      nullableText(input.recipientPhone),
      existing.recipientPhone,
    ),
    preferredDeliveryTime: pick(
      nullableText(input.preferredDeliveryTime),
      existing.preferredDeliveryTime,
    ),
    specialInstructions: pick(
      nullableText(input.specialInstructions),
      existing.specialInstructions,
    ),
    favoriteMeals: pick(
      nullableText(input.favoriteMeals),
      existing.favoriteMeals,
    ),
    leastFavoriteMeals: pick(
      nullableText(input.leastFavoriteMeals),
      existing.leastFavoriteMeals,
    ),
    allergies: null,
    photoUrl: pick(nullableText(input.photoUrl), existing.photoUrl),
    photoCaption: pick(
      nullableText(input.photoCaption),
      existing.photoCaption,
    ),
    groceryList: pick(nullableText(input.groceryList), existing.groceryList),
    groceryCategories: pick(
      input.groceryCategories === undefined
        ? undefined
        : input.groceryCategories,
      existing.groceryCategories,
    ),
    budgetHint: pick(nullableText(input.budgetHint), existing.budgetHint),
    storePreference: pick(
      nullableText(input.storePreference),
      existing.storePreference,
    ),
    dietaryOrAllergyNotes: null,
    deliveryOrPickupNotes: pick(
      nullableText(input.deliveryOrPickupNotes),
      existing.deliveryOrPickupNotes,
    ),
  };
}
