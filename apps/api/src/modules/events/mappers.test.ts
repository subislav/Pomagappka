import { describe, expect, it } from "vitest";
import { toOrganizerEvent, toParticipantEvent } from "./mappers.js";

const baseRow = {
  id: "11111111-1111-1111-1111-111111111111",
  organizerId: "org-1",
  title: "Test",
  description: null,
  recipientDisplayName: "Odbiorca",
  peopleCount: 2,
  startsOn: "2026-11-01",
  endsOn: "2026-11-07",
  dietaryPreferences: "wegetariańskie",
  dropOffAddress: "ul. Test 1",
  recipientPhone: "+48111111111",
  preferredDeliveryTime: null,
  specialInstructions: null,
  favoriteMeals: null,
  leastFavoriteMeals: null,
  allergies: "orzechy",
  photoUrl: null,
  photoCaption: null,
  groceryList: null,
  groceryCategories: null,
  budgetHint: null,
  storePreference: null,
  dietaryOrAllergyNotes: "alergia na gluten",
  deliveryOrPickupNotes: null,
  assistanceType: "meal",
  invitationToken: "token",
  pinHash: "hash",
  pinVersion: 1,
  status: "open",
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-01T00:00:00.000Z"),
};

describe("event mappers privacy sanitization", () => {
  it("never exposes allergy fields to organizers or participants", () => {
    const organizer = toOrganizerEvent(baseRow, "https://pomagappka.pl");
    const participant = toParticipantEvent(baseRow);
    expect(organizer.allergies).toBeNull();
    expect(organizer.dietaryOrAllergyNotes).toBeNull();
    expect(participant.allergies).toBeNull();
    expect(participant.dietaryOrAllergyNotes).toBeNull();
    expect(organizer.dropOffAddress).toBe("ul. Test 1");
    expect(participant.dropOffAddress).toBe("ul. Test 1");
  });
});
