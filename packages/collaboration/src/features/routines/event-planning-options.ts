import { z } from "@semoss/ui/next";
import { type MeetingPin, pinKey } from "./event-planning-schema";

/** The calendar listing fields the picker reads. */
const calendarSchema = z.object({
	hasMore: z.boolean().nullish(),
	events: z.array(
		z.object({
			id: z.string().nullish(),
			subject: z.string().nullish(),
			start: z.string().nullish(),
			isCancelled: z.boolean().nullish(),
			isAllDay: z.boolean().nullish(),
			seriesId: z.string().nullish(),
			attendees: z.array(z.unknown()).nullish(),
			attendeeCount: z.number().nullish(),
		}),
	),
});

/** One meeting the owner can pin, with its next sitting in the window. */
export interface MeetingPinOption {
	pin: MeetingPin;
	/** ISO start of the next sitting, or null when none is in the window. */
	next: string | null;
	/** How many sittings fall in the window. */
	count: number;
	/** The most people invited to any sitting, or null when not known. */
	people: number | null;
}

/** Event planning is for medium-sized meetings; smaller (1:1s) and larger ones are listed apart. */
export const MEDIUM_MEETING = { min: 3, max: 40 };

/** Whether a meeting's size suggests planning; unknown size counts as medium. */
export function isMediumMeeting(option: MeetingPinOption): boolean {
	return (
		option.people === null ||
		(option.people >= MEDIUM_MEETING.min &&
			option.people <= MEDIUM_MEETING.max)
	);
}

/**
 * Distinct meetings in a calendar listing, soonest first: a series once by its series id, a one-off by its event
 * id; then saved pins that have no sitting in it. Cancelled and all-day events are left out, as the routine does.
 */
export function meetingPinOptions(
	listing: unknown,
	saved: readonly MeetingPin[],
): MeetingPinOption[] {
	const parsed = calendarSchema.safeParse(listing);
	const options = new Map<string, MeetingPinOption>();
	for (const event of parsed.success ? parsed.data.events : []) {
		const title = event.subject?.replace(/\s+/g, " ").trim().slice(0, 120);
		if (!title || event.isCancelled || event.isAllDay) {
			continue;
		}
		const pin: MeetingPin | null = event.seriesId
			? { kind: "series", id: event.seriesId, title }
			: event.id
				? { kind: "event", id: event.id, title }
				: null;
		if (!pin) {
			continue;
		}
		const people = event.attendeeCount ?? event.attendees?.length ?? null;
		const existing = options.get(pinKey(pin));
		options.set(
			pinKey(pin),
			existing
				? {
						...existing,
						count: existing.count + 1,
						people:
							people === null
								? existing.people
								: Math.max(existing.people ?? 0, people),
					}
				: { pin, next: event.start ?? null, count: 1, people },
		);
	}
	for (const pin of saved) {
		// a saved pin keeps the title it was pinned with, which names its sheet
		const existing = options.get(pinKey(pin));
		options.set(
			pinKey(pin),
			existing
				? { ...existing, pin }
				: { pin, next: null, count: 0, people: null },
		);
	}
	return [...options.values()];
}

/** Whether the listing stopped at its page size, so later meetings are not shown. */
export function isPartialPinListing(listing: unknown): boolean {
	const parsed = calendarSchema.safeParse(listing);
	return parsed.success && parsed.data.hasMore === true;
}
