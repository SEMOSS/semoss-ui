import { useCallback } from "react";
import { useTranslation } from "@semoss/i18n";
import { isSameLocalDay, parseWallClock } from "@semoss/utility/date";
import { formatShortDay, formatTimeOfDay } from "../../core/connector.format";
import type { GoogleCalendarEvent } from "../google.types";

/** An event's start and end, as `GoogleCalendarReadEvent` reports them. */
type EventTimes = Pick<GoogleCalendarEvent, "startTime" | "endTime">;

/**
 * A function that says when a Google Calendar event happens, in the user's
 * language: `Sep 27, all day`, or `Sep 27, 9:00 AM to 9:30 AM`.
 *
 * The backend reports wall clock times in the user's own zone, and a bare
 * day for an all day event, so both are read as local time. Google ends an
 * all day event on the day after its last.
 *
 * @return The describing function.
 */
export const useGoogleEventTime = (): ((event: EventTimes) => string) => {
	const { t, i18n } = useTranslation("connectors");
	const locale = i18n.language;

	return useCallback(
		(event: EventTimes): string => {
			const start = parseWallClock(event.startTime);
			if (!start) {
				return event.startTime ?? "";
			}
			const end = parseWallClock(event.endTime);
			const isAllDay = (event.startTime ?? "").length <= 10;

			if (isAllDay) {
				const lastDay = end
					? new Date(
							end.getFullYear(),
							end.getMonth(),
							end.getDate() - 1,
						)
					: start;
				return lastDay.getTime() > start.getTime()
					? t("calendar.allDayRange", {
							start: formatShortDay(start, locale),
							end: formatShortDay(lastDay, locale),
						})
					: t("calendar.allDayOn", {
							day: formatShortDay(start, locale),
						});
			}

			const startText = start.toLocaleString(locale, {
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit",
			});
			if (!end) {
				return startText;
			}
			const endText = isSameLocalDay(start, end)
				? formatTimeOfDay(end, locale)
				: end.toLocaleString(locale, {
						month: "short",
						day: "numeric",
						hour: "numeric",
						minute: "2-digit",
					});
			return t("calendar.timeRange", { start: startText, end: endText });
		},
		[locale, t],
	);
};
