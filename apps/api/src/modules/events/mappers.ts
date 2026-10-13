import type { OrganizerEvent, OrganizerEventListItem, ParticipantEvent, } from "@pomagappka/shared";
import type { events } from "../../db/schema/domain.js";
type EventRow = typeof events.$inferSelect;
export function toOrganizerEvent(row: EventRow, appUrl: string): OrganizerEvent {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        recipientDisplayName: row.recipientDisplayName,
        peopleCount: row.peopleCount,
        startsOn: row.startsOn,
        endsOn: row.endsOn,
        dietaryPreferences: row.dietaryPreferences,
        assistanceType: row.assistanceType as OrganizerEvent["assistanceType"],
        invitationToken: row.invitationToken,
        invitationUrl: `${appUrl.replace(/\/$/, "")}/i/${row.invitationToken}`,
        pinVersion: row.pinVersion,
        status: row.status as OrganizerEvent["status"],
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
        assistanceType: row.assistanceType as OrganizerEventListItem["assistanceType"],
        status: row.status as OrganizerEventListItem["status"],
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
        dietaryPreferences: row.dietaryPreferences,
        assistanceType: row.assistanceType as ParticipantEvent["assistanceType"],
        status: row.status as ParticipantEvent["status"],
    };
}
