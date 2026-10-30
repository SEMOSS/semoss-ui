import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { z } from "@semoss/ui/next";
import { callPixel, pixel } from "@/lib/pixel";

/** The calendar answers at most 100 events a call. */
const PAGE = 100;
/** Pages read before stopping; recurring sittings fill pages fast on a busy calendar. */
const MAX_PAGES = 6;

const pageSchema = z.object({
	hasMore: z.boolean().nullish(),
	events: z.array(z.unknown()),
});

export interface CalendarWindow {
	status: "LOADING" | "SUCCESS" | "ERROR";
	/** Every event read, with hasMore when the pages ran out first. */
	listing: { events: unknown[]; hasMore: boolean } | null;
}

/** The owner's events over the next days, read page by page so the whole window is covered. */
export function useCalendarWindow(days: number): CalendarWindow {
	const { actions } = useInsight();
	const [state, setState] = useState<CalendarWindow>({
		status: "LOADING",
		listing: null,
	});
	useEffect(() => {
		let cancelled = false;
		(async () => {
			const events: unknown[] = [];
			let hasMore = true;
			for (let page = 0; page < MAX_PAGES && hasMore; page++) {
				const result = await callPixel(
					actions,
					pixel("MicrosoftCalendarListEvents", {
						days,
						limit: PAGE,
						offset: page * PAGE,
					}),
					pageSchema,
				);
				events.push(...result.events);
				hasMore = result.hasMore === true;
			}
			if (!cancelled) {
				setState({ status: "SUCCESS", listing: { events, hasMore } });
			}
		})().catch(() => {
			if (!cancelled) setState({ status: "ERROR", listing: null });
		});
		return () => {
			cancelled = true;
		};
	}, [actions, days]);
	return state;
}
