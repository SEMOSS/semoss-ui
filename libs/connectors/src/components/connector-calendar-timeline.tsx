import { useEffect, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, cn, ScrollArea } from "@semoss/ui/next";
import {
	addLocalDays,
	calendarDayKey,
	isSameLocalDay,
} from "@semoss/utility/date";
import { layoutCalendarEvents } from "../core/calendar-event-layout";
import { formatDayHeading, formatTimeOfDay } from "../core/connector.format";
import type {
	CalendarEventSchedule,
	ConnectorCalendarDay,
} from "../core/connector-calendar";
import type { CalendarWindow } from "../core/use-calendar-window";

/** Shared day, three-day, and week event canvas. */
export interface ConnectorCalendarTimelineProps<T> {
	calendar: CalendarWindow;
	days: ConnectorCalendarDay<T>[];
	getTitle: (event: T) => string;
	getEventKey: (event: T) => string;
	getEventLabel?: (event: T) => string;
	getSchedule?: (event: T) => CalendarEventSchedule;
	onOpenEvent: (event: T, itemKey: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/** Timed events use a time grid; providers without times use dated columns. */
export const ConnectorCalendarTimeline = <T,>({
	calendar,
	days,
	getTitle,
	getEventKey,
	getEventLabel = getTitle,
	getSchedule,
	onOpenEvent,
}: ConnectorCalendarTimelineProps<T>) => {
	const { t, i18n } = useTranslation("connectors");
	const viewportRef = useRef<HTMLDivElement | null>(null);
	const startTime = calendar.range.start.getTime();
	const isTimed = !!getSchedule;
	useEffect(() => {
		// Start the time grid around the working day; midnight remains reachable.
		if (viewportRef.current && Number.isFinite(startTime))
			viewportRef.current.scrollTop = isTimed ? 8 * 48 : 0;
	}, [startTime, isTimed]);
	const dates: Date[] = [];
	for (
		let day = calendar.range.start;
		day < calendar.range.end;
		day = addLocalDays(day, 1)
	)
		dates.push(day);
	const columns = dates.map((day) => {
		const events =
			days.find((group) => isSameLocalDay(group.day, day))?.events ?? [];
		const layout = getSchedule
			? layoutCalendarEvents(events, day, getSchedule)
			: [];
		return {
			day,
			events,
			layout,
			untimed: getSchedule
				? events.filter((event) => {
						const schedule = getSchedule(event);
						return schedule.isAllDay || !schedule.start;
					})
				: events,
		};
	});
	const columnWidths = columns.map(
		({ layout }) =>
			`minmax(${Math.max(72, ...layout.map((item) => item.columns * 32))}px, 1fr)`,
	);
	const template = `${isTimed ? "3rem " : ""}${columnWidths.join(" ")}`;
	const eventKey = (event: T, day: Date) =>
		`grid:${calendarDayKey(day)}:${getEventKey(event)}`;
	return (
		<ScrollArea
			className="[&>div>div]:block! min-h-0 flex-1"
			scrollOrientation="both"
			viewportRef={(element) => {
				viewportRef.current = element;
			}}
		>
			<div
				data-calendar-timeline
				className="grid min-h-full content-start"
				style={{ gridTemplateColumns: template }}
			>
				<div
					className="sticky top-0 z-20 col-span-full grid border-border border-b bg-background"
					style={{ gridTemplateColumns: "subgrid" }}
				>
					{isTimed ? <div aria-hidden /> : null}
					{columns.map(({ day }) => (
						<Button
							key={calendarDayKey(day)}
							variant="ghost"
							className={cn(
								"h-12 min-w-0 flex-col gap-0 rounded-none border-border border-s px-1 text-xs",
								isSameLocalDay(day, new Date()) &&
									"text-primary",
							)}
							aria-label={formatDayHeading(day, i18n.language)}
							aria-pressed={isSameLocalDay(
								day,
								calendar.selectedDay,
							)}
							onClick={() => calendar.selectDay(day)}
						>
							<span>
								{day.toLocaleDateString(i18n.language, {
									weekday: "short",
								})}
							</span>
							<span className="font-medium">
								{day.toLocaleDateString(i18n.language, {
									day: "numeric",
								})}
							</span>
						</Button>
					))}
					{isTimed ? (
						<span className="self-center px-1 py-2 text-center text-muted-foreground text-xs">
							{t("calendar.allDay")}
						</span>
					) : null}
					{columns.map(({ day, untimed }) => (
						<div
							key={calendarDayKey(day)}
							className="flex min-w-0 flex-col gap-1 border-border border-s p-1"
						>
							{untimed.map((event) => (
								<Button
									key={getEventKey(event)}
									variant="ghost"
									className="h-auto min-h-6 min-w-0 justify-start overflow-hidden rounded-sm border-primary/50 border-s-2 bg-accent px-1 py-1 text-start font-normal text-accent-foreground text-xs"
									title={getEventLabel(event)}
									aria-label={getEventLabel(event)}
									data-item-key={eventKey(event, day)}
									onClick={() =>
										onOpenEvent(event, eventKey(event, day))
									}
								>
									<span className="truncate">
										{getTitle(event)}
									</span>
								</Button>
							))}
						</div>
					))}
				</div>
				{isTimed ? (
					<>
						<div
							aria-hidden
							className="sticky start-0 z-10 bg-background"
						>
							{HOURS.map((hour) => (
								<div
									key={hour}
									className="h-12 border-border border-t px-1 pt-1 text-end text-muted-foreground text-xs"
								>
									{new Date(
										2026,
										0,
										1,
										hour,
									).toLocaleTimeString(i18n.language, {
										hour: "numeric",
									})}
								</div>
							))}
						</div>
						{columns.map(({ day, layout }) => (
							<section
								key={calendarDayKey(day)}
								aria-label={formatDayHeading(
									day,
									i18n.language,
								)}
								className="relative min-w-0 border-border border-s"
							>
								<div aria-hidden>
									{HOURS.map((hour) => (
										<div
											key={hour}
											className="h-12 border-border border-t"
										/>
									))}
								</div>
								{layout.map(
									({
										event,
										startMinute,
										endMinute,
										column,
										columns: count,
									}) => {
										const schedule = getSchedule?.(event);
										const label = getEventLabel(event);
										return (
											<Button
												key={getEventKey(event)}
												variant="ghost"
												title={label}
												aria-label={label}
												data-item-key={eventKey(
													event,
													day,
												)}
												onClick={() =>
													onOpenEvent(
														event,
														eventKey(event, day),
													)
												}
												className="absolute min-w-0 flex-col items-start justify-start gap-0 overflow-hidden rounded-sm border border-primary/30 border-s-2 border-s-primary bg-accent px-1 py-0.5 text-start font-normal text-accent-foreground text-xs hover:bg-accent focus-visible:z-20"
												style={{
													top:
														(startMinute / 60) * 48,
													height:
														((endMinute -
															startMinute) /
															60) *
														48,
													insetInlineStart: `calc(${(column / count) * 100}% + 2px)`,
													width: `calc(${100 / count}% - 4px)`,
												}}
											>
												<span className="w-full truncate font-medium">
													{getTitle(event)}
												</span>
												{endMinute - startMinute >=
													50 && schedule?.start ? (
													<span className="w-full truncate">
														{formatTimeOfDay(
															schedule.start,
															i18n.language,
														)}
													</span>
												) : null}
											</Button>
										);
									},
								)}
							</section>
						))}
					</>
				) : null}
			</div>
		</ScrollArea>
	);
};
