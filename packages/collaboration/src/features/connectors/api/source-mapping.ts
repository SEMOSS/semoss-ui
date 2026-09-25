import type { z } from "@semoss/ui/next";
import type { ImportedSource, SourceParticipant } from "../types";
import { safeSourceUrl } from "./microsoft";
import type {
	CalendarEvent,
	chatMessagesSchema,
	OutlookMail,
	TeamsChat,
} from "./microsoft-schemas";

/** Map a mail header address list without inventing display names or identities. */
function mailParticipants(
	value: string | undefined,
	role: string,
): SourceParticipant[] {
	return (value ?? "")
		.split(",")
		.map((address) => address.trim())
		.filter(Boolean)
		.map((address) => ({ address, role }));
}

/** One Outlook UID is one source entry; subject similarity is not conversation identity. */
export function importOutlookMail(
	mail: OutlookMail,
	folder: string,
): ImportedSource {
	if (mail.body === undefined)
		throw new Error("Read this email before adding it to Work.");
	return {
		sourceKind: "outlook",
		nativeId: mail.uid,
		title: mail.subject || "Untitled email",
		body: mail.body,
		messages: [
			{
				id: mail.uid,
				text: mail.body,
				senderAddress: mail.from,
				at: mail.receivedDate ?? mail.sentDate,
				isTruncated: mail.bodyTruncated,
			},
		],
		participants: [
			...mailParticipants(mail.from, "from"),
			...mailParticipants(mail.to, "to"),
			...mailParticipants(mail.cc, "cc"),
		],
		receivedAt: mail.receivedDate ?? mail.sentDate,
		attachments: mail.attachments ?? [],
		folder,
		isTruncated: mail.bodyTruncated,
	};
}

/** Preserve chat/member/message identities and keep the visible conversation chronological. */
export function importTeamsChat(
	chat: TeamsChat,
	page: z.infer<typeof chatMessagesSchema>,
): ImportedSource {
	if (page.chatId !== chat.id)
		throw new Error("Microsoft returned a different chat.");
	const messages = page.messages
		.filter((message) => !message.isDeleted)
		.map((message) => ({
			id: message.id,
			text: message.body,
			senderId: message.fromId,
			senderName: message.fromName,
			at: message.createdDateTime,
			isTruncated: message.bodyTruncated,
		}))
		.sort((left, right) => (left.at ?? "").localeCompare(right.at ?? ""));
	return {
		sourceKind: "teams",
		nativeId: chat.id,
		title: chat.displayName || chat.topic || "Teams chat",
		body: messages
			.map(
				(message) =>
					`${message.senderName ?? "Participant"}: ${message.text}`,
			)
			.join("\n\n"),
		messages,
		participants: chat.members.map((member) => ({
			nativeId: member.userId,
			name: member.name,
			address: member.email,
			role: "member",
		})),
		receivedAt: messages.at(-1)?.at ?? chat.lastUpdatedDateTime,
		attachments: [],
		sourceUrl: safeSourceUrl(chat.webUrl),
		isTruncated: messages.some((message) => message.isTruncated),
	};
}

/** Calendar reactors are requested in UTC; do not reinterpret another zone as browser local time. */
export function calendarUtc(
	value: string | undefined,
	zone: string | undefined,
): string | undefined {
	if (!value) return undefined;
	const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
	if (!hasOffset && zone && !["UTC", "Etc/UTC"].includes(zone))
		throw new Error("The calendar returned an unexpected time zone.");
	const normalized = hasOffset ? value : `${value}Z`;
	const timestamp = Date.parse(normalized);
	if (!Number.isFinite(timestamp))
		throw new Error("The calendar returned an invalid date.");
	return new Date(timestamp).toISOString();
}

/** Map the selected event, retaining provider participants and its native event ID. */
export function importCalendarEvent(event: CalendarEvent): ImportedSource {
	if (event.body === undefined)
		throw new Error("Read this event before adding it to Work.");
	const start = calendarUtc(event.start, event.startTimeZone);
	const body = [
		event.body,
		start ? `Starts: ${start}` : "",
		event.location ? `Location: ${event.location}` : "",
	]
		.filter(Boolean)
		.join("\n\n");
	const organizer =
		event.organizer || event.organizerName
			? [
					{
						address: event.organizer,
						name: event.organizerName,
						role: "organizer",
					},
				]
			: [];
	return {
		sourceKind: "calendar",
		nativeId: event.id,
		title: event.subject || "Untitled event",
		body,
		messages: [
			{
				id: event.id,
				text: body,
				senderAddress: event.organizer,
				senderName: event.organizerName,
				at: start,
				isTruncated: event.bodyTruncated,
			},
		],
		participants: [
			...organizer,
			...event.attendees.map((attendee) => ({
				address: attendee.address,
				name: attendee.name,
				role: attendee.type ?? "attendee",
			})),
		],
		receivedAt: start,
		attachments: [],
		sourceUrl: safeSourceUrl(event.webLink),
		isTruncated: event.bodyTruncated,
	};
}
