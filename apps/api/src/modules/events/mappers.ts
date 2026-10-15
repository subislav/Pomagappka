import type { AssistanceType, EventStatus, GroceryCategory, OrganizerEvent, OrganizerEventListItem, ParticipantEvent, } from "@pomagappka/shared";
import type { events } from "../../db/schema/domain.js";
type EventRow = typeof events.$inferSelect;
function parseGroceryCategories(value: unknown): GroceryCategory[] | null {
    if (value == null)
        return null;
    if (!Array.isArray(value))
        return null;
    return value.filter((item): item is GroceryCategory => typeof item === "string");
}
function detailFields(row: EventRow) {
    return {
        dietaryPreferences: row.dietaryPreferences,
        dropOffAddress: row.dropOffAddress,
        recipientPhone: row.recipientPhone,
        preferredDeliveryTime: row.preferredDeliveryTime,
        specialInstructions: row.specialInstructions,
        favoriteMeals: row.favoriteMeals,
        leastFavoriteMeals: row.leastFavoriteMeals,
        allergies: null,
        photoUrl: row.photoUrl,
        photoCaption: row.photoCaption,
        groceryList: row.groceryList,
        groceryCategories: parseGroceryCategories(row.groceryCategories),
        budgetHint: row.budgetHint,
        storePreference: row.storePreference,
        dietaryOrAllergyNotes: null,
        deliveryOrPickupNotes: row.deliveryOrPickupNotes,
    };
}
export function toOrganizerEvent(row: EventRow, appUrl: string): OrganizerEvent {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        recipientDisplayName: row.recipientDisplayName,
        peopleCount: row.peopleCount,
        startsOn: row.startsOn,
        endsOn: row.endsOn,
        ...detailFields(row),
        assistanceType: row.assistanceType as AssistanceType,
        invitationToken: row.invitationToken,
        invitationUrl: `${appUrl.replace(/\/$/, "")}/i/${row.invitationToken}`,
        pinVersion: row.pinVersion,
        status: row.status as EventStatus,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}
export function toOrganizerEventListItem(row: EventRow): OrganizerEventListItem {
    return {
        id: row.id,
        title: row.title,
        recipientDisplayName: row.recipientDisplayName,
        peopleCount: row.peopleCount,
        startsOn: row.startsOn,
        endsOn: row.endsOn,
        assistanceType: row.assistanceType as AssistanceType,
        status: row.status as EventStatus,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}
export function toParticipantEvent(row: EventRow): ParticipantEvent {
    return {
        title: row.title,
        description: row.description,
        recipientDisplayName: row.recipientDisplayName,
        peopleCount: row.peopleCount,
        startsOn: row.startsOn,
        endsOn: row.endsOn,
        ...detailFields(row),
        assistanceType: row.assistanceType as AssistanceType,
        status: row.status as EventStatus,
    };
}
