import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import type { ToolViewProps } from "@semoss/shared";
import { Muted } from "@semoss/ui/next";
import { ToolCallNotice } from "../components/tool-call-notice";
import { ToolViewCard } from "../components/tool-view-card";
import { readToolAccount, readToolResult } from "../core/tool-view-call";
import { parseCalendarSchedules } from "./calendar.parsers";
import type { CalendarBusyTime, CalendarSchedules } from "./calendar.types";
import { CALENDAR_APPS } from "./calendar-apps";
import { useEventTime } from "./use-event-time";

/** The name of each way a time can be taken. */
const STATUS_KEYS: Record<string, string> = {
	busy: "toolViews.calendar.status.busy",
	tentative: "toolViews.calendar.status.tentative",
	oof: "toolViews.calendar.status.oof",
	workingElsewhere: "toolViews.calendar.status.workingElsewhere",
};

/**
 * Someone's busy times, each once, by what tells them apart: two events can
 * take the same time.
 *
 * @param busy - The busy times.
 * @return Each distinct time and its key.
 */
const uniqueBusyTimes = (
	busy: CalendarBusyTime[],
): [string, CalendarBusyTime][] => [
	...new Map(
		busy.map((time): [string, CalendarBusyTime] => [
			[
				time.start,
				time.end,
				time.status,
				time.subject,
				time.location,
			].join("|"),
			time,
		]),
	).entries(),
];

/**
 * A schedule result, read.
 *
 * @param result - The call's parsed result.
 * @return The schedules, or null when the result is not one.
 */
const readSchedules = (result: unknown): CalendarSchedules | null => {
	try {
		return parseCalendarSchedules(result);
	} catch {
		return null;
	}
};

/**
 * When each person a `GetSchedule` call asked about is taken, in the user's
 * local time: their busy times, that they are free throughout, or why their
 * calendar could not be read.
 */
export const CalendarAvailabilityToolView = ({
	call,
	params,
}: ToolViewProps) => {
	const { t } = useTranslation("connectors");
	const describeTime = useEventTime();
	const app = CALENDAR_APPS[readToolAccount(params, call.functionName)];
	const schedules = useMemo(
		() => readSchedules(readToolResult(call)),
		[call],
	);

	if (call.status !== "succeeded") {
		return <ToolCallNotice call={call} appName={t(app.appNameKey)} />;
	}
	if (!schedules) {
		return (
			<Muted className="block px-3 py-2">
				{t("toolViews.unreadable")}
			</Muted>
		);
	}

	return (
		<ToolViewCard
			brand={app.brand}
			title={t("toolViews.calendar.availabilityTitle")}
			description={
				schedules.start
					? describeTime(
							{
								start: schedules.start,
								end: schedules.end,
								isAllDay: false,
							},
							true,
						)
					: undefined
			}
		>
			<ul className="flex flex-col gap-3">
				{schedules.schedules.map((schedule) => (
					<li
						key={schedule.address}
						className="flex min-w-0 flex-col gap-1"
					>
						<span className="wrap-anywhere font-medium text-sm">
							{schedule.address}
						</span>
						{schedule.error ? (
							<Muted className="text-sm">
								{t("toolViews.calendar.scheduleError", {
									message: schedule.error,
								})}
							</Muted>
						) : schedule.busy.length === 0 ? (
							<Muted className="text-sm">
								{t("toolViews.calendar.free")}
							</Muted>
						) : (
							<ul className="flex flex-col gap-0.5 text-sm">
								{uniqueBusyTimes(schedule.busy).map(
									([key, busy]) => (
										<li key={key} className="wrap-anywhere">
											{[
												describeTime(
													{
														start: busy.start,
														end: busy.end,
														isAllDay: false,
													},
													true,
												),
												t(
													STATUS_KEYS[busy.status] ??
														"toolViews.calendar.status.busy",
												),
												busy.subject,
												busy.location,
											]
												.filter(Boolean)
												.join(", ")}
										</li>
									),
								)}
							</ul>
						)}
					</li>
				))}
			</ul>
		</ToolViewCard>
	);
};
