import { z } from "@semoss/ui/next";

/** The calendar listing fields the meeting picker reads. */
const calendarSchema = z.object({
	hasMore: z.boolean().nullish(),
	events: z.array(
		z.object({
			subject: z.string().nullish(),
			start: z.string().nullish(),
			isCancelled: z.boolean().nullish(),
			isAllDay: z.boolean().nullish(),
			isRecurring: z.boolean().nullish(),
		}),
	),
});

/** One meeting title the owner can choose, with its next sitting in the window. */
export interface AgendaMeetingOption {
	/** The title as the calendar shows it, or as it was saved. */
	title: string;
	/** ISO start of the next sitting, or null when none is in the window. */
	next: string | null;
	/** How many sittings fall in the window. */
	count: number;
	/** Whether any sitting in the window belongs to a recurring series. */
	recurring: boolean;
	/** What tells this meeting apart in a list; its title when not set. */
	key?: string;
}

/** The list key of an option: its own key, else its title as the server matches it. */
export function optionKey(option: AgendaMeetingOption): string {
	return option.key ?? meetingKey(option.title);
}

/** Meeting titles compare like the server matches them: case and repeated spaces do not count. */
export function meetingKey(title: string): string {
	return title.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Distinct meetings in a calendar listing, soonest first, then saved meetings that have no sitting in it.
 * Cancelled and all-day events are left out, as the routine leaves them out. A listing that does not parse
 * contributes nothing, so saved meetings stay listed and selectable.
 */
export function agendaMeetingOptions(
	listing: unknown,
	saved: readonly string[],
): AgendaMeetingOption[] {
	const parsed = calendarSchema.safeParse(listing);
	const options = new Map<string, AgendaMeetingOption>();
	for (const event of parsed.success ? parsed.data.events : []) {
		const title = event.subject?.replace(/\s+/g, " ").trim();
		if (!title || event.isCancelled || event.isAllDay) {
			continue;
		}
		const existing = options.get(meetingKey(title));
		const recurring = event.isRecurring === true;
		options.set(
			meetingKey(title),
			existing
				? {
						...existing,
						count: existing.count + 1,
						recurring: existing.recurring || recurring,
					}
				: { title, next: event.start ?? null, count: 1, recurring },
		);
	}
	for (const title of saved) {
		if (!options.has(meetingKey(title))) {
			options.set(meetingKey(title), {
				title,
				next: null,
				count: 0,
				recurring: false,
			});
		}
	}
	return [...options.values()];
}

/** Whether the listing stopped at its page size, so later meetings are not shown. */
export function isPartialListing(listing: unknown): boolean {
	const parsed = calendarSchema.safeParse(listing);
	return parsed.success && parsed.data.hasMore === true;
}
