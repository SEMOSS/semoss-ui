import { useCallback } from "react";
import { useTranslation } from "@semoss/i18n";
import { addLocalDays, isSameLocalDay } from "@semoss/utility/date";
import {
	formatShortDay,
	formatTimeOfDay,
	parseGraphDate,
	parseGraphDay,
} from "../core/connector.format";
import type { CalendarEvent } from "./calendar.types";

/**
 * Describes when an event happens.
 *
 * @param event - The event.
 * @param hasDate - Also names the day, for where the day is not shown already.
 * @return The description, such as `9:00 AM to 9:30 AM`.
 */
export type DescribeEventTime = (
	event: Pick<CalendarEvent, "start" | "end" | "isAllDay">,
	hasDate?: boolean,
) => string;

/**
 * A function that says when an event happens in the user's language and
 * local time: `All day`, `9:00 AM to 9:30 AM`, or with the day named.
 *
 * All day events are read as calendar days, since every calendar ends them on
 * the day after their last day; timed events, which the reactors answer with
 * in UTC, are converted to local time.
 *
 * @return The describing function.
 */
export const useEventTime = (): DescribeEventTime => {
	const { t, i18n } = useTranslation("connectors");
	const locale = i18n.language;

	return useCallback(
		(
			event: Pick<CalendarEvent, "start" | "end" | "isAllDay">,
			hasDate = false,
		): string => {
			if (event.isAllDay) {
				const firstDay = parseGraphDay(event.start);
				const endDay = parseGraphDay(event.end);
				const lastDay = endDay ? addLocalDays(endDay, -1) : firstDay;
				if (!hasDate || !firstDay) {
					return t("calendar.allDay");
				}
				if (!lastDay || lastDay.getTime() <= firstDay.getTime()) {
					return t("calendar.allDayOn", {
						day: formatShortDay(firstDay, locale),
					});
				}
				return t("calendar.allDayRange", {
					start: formatShortDay(firstDay, locale),
					end: formatShortDay(lastDay, locale),
				});
			}

			const start = parseGraphDate(event.start);
			const end = parseGraphDate(event.end);
			if (!start) {
				return event.start ?? "";
			}
			const startText = hasDate
				? start.toLocaleString(locale, {
						month: "short",
						day: "numeric",
						hour: "numeric",
						minute: "2-digit",
					})
				: formatTimeOfDay(start, locale);
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
