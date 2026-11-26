import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { z } from "@semoss/ui/next";
import { callPixel, pixel } from "@/lib/pixel";

/** The calendar answers at most 100 events a call. */
const PAGE = 100;
/** Pages read before stopping; a page can end well short of 100 once its output budget is used. */
const MAX_PAGES = 15;

const pageSchema = z.object({
	hasMore: z.boolean().nullish(),
	events: z.array(z.unknown()),
});

interface CalendarWindow {
	status: "LOADING" | "SUCCESS" | "ERROR";
	/** Every event read, with hasMore when the pages ran out first. */
	listing: { events: unknown[]; hasMore: boolean } | null;
}

/** The owner's events over the next days (from startDay days after today), read page by page. */
export function useCalendarWindow(days: number, startDay = 0): CalendarWindow {
	const { actions } = useInsight();
	const [state, setState] = useState<CalendarWindow>({
		status: "LOADING",
		listing: null,
	});
	useEffect(() => {
		let cancelled = false;
		setState({ status: "LOADING", listing: null });
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		start.setDate(start.getDate() + startDay);
		const end = new Date(start);
		end.setDate(end.getDate() + days);
		(async () => {
			const events: unknown[] = [];
			let hasMore = true;
			let offset = 0;
			for (let page = 0; page < MAX_PAGES && hasMore; page++) {
				const result = await callPixel(
					actions,
					pixel("MicrosoftCalendarListEvents", {
						start: start.toISOString(),
						end: end.toISOString(),
						limit: PAGE,
						offset,
					}),
					pageSchema,
				);
				events.push(...result.events);
				// the next page starts after what came back, never a full page further on
				offset += result.events.length;
				hasMore = result.hasMore === true && result.events.length > 0;
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
	}, [actions, days, startDay]);
	return state;
}
