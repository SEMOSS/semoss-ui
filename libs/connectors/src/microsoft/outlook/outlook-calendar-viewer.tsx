import {
	CalendarDaysIcon,
	CalendarIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	RefreshCwIcon,
	VideoIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { Button, cn, H4 } from "@semoss/ui/next";
import { ConnectorIconButton } from "../../components/connector-icon-button";
import { ConnectorItemRow } from "../../components/connector-item-row";
import { ConnectorList } from "../../components/connector-list";
import { ConnectorViewerHeader } from "../../components/connector-viewer-header";
import {
	addLocalDays,
	formatDayHeading,
	formatShortDay,
	parseGraphDate,
	parseGraphDay,
	startOfLocalDay,
} from "../../core/connector.format";
import type { ConnectorViewerProps } from "../../core/connector.types";
import { runConnectorPixel } from "../../core/connector-pixel";
import { useConnectorQuery } from "../../core/use-connector-query";
import {
	type ConnectorSaveRequest,
	useConnectorSaver,
} from "../../core/use-connector-saver";
import { useReturnFocus } from "../../core/use-return-focus";
import {
	calendarEventFileName,
	calendarEventToMarkdown,
} from "../microsoft.markdown";
import {
	parseCalendarEventDetail,
	parseCalendarEvents,
} from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { CalendarEvent } from "../microsoft.types";
import { OutlookEventDetail } from "./outlook-event-detail";
import { useCalendarEventTime } from "./use-calendar-event-time";

/** How many days the viewer shows at once. */
const WINDOW_DAYS = 7;

/** The most events the backend reads at once. */
const MAX_EVENTS = 100;

/** The events of one day. */
interface EventDay {
	day: Date;
	events: CalendarEvent[];
}

/**
 * The local day an event is listed under. An event that began before the
 * window is listed on the window's first day.
 *
 * @param event - The event.
 * @param windowStart - The first day shown.
 * @return Local midnight of the day.
 */
const getListedDay = (event: CalendarEvent, windowStart: Date): Date => {
	const start = event.isAllDay
		? parseGraphDay(event.start)
		: parseGraphDate(event.start, event.startTimeZone);
	if (!start || start.getTime() < windowStart.getTime()) {
		return windowStart;
	}
	return startOfLocalDay(start);
};

/**
 * Group events by the day they are listed under, keeping their order.
 *
 * @param events - The events, earliest first.
 * @param windowStart - The first day shown.
 * @return The days that have events.
 */
const groupByDay = (events: CalendarEvent[], windowStart: Date): EventDay[] => {
	const days = new Map<number, EventDay>();
	for (const event of events) {
		const day = getListedDay(event, windowStart);
		const existing = days.get(day.getTime());
		if (existing) {
			existing.events.push(event);
		} else {
			days.set(day.getTime(), { day: day, events: [event] });
		}
	}
	return [...days.values()].sort((a, b) => a.day.getTime() - b.day.getTime());
};

/** Props for {@link OutlookCalendarViewer}. */
export type OutlookCalendarViewerProps = ConnectorViewerProps;

/**
 * The user's Outlook calendar a week at a time: see what is coming, open an
 * event, and bring it into the insight.
 */
export const OutlookCalendarViewer = (props: OutlookCalendarViewerProps) => {
	const { onSignIn } = props;
	const { t, i18n } = useTranslation("connectors");
	const { insightId } = useInsight();
	const saver = useConnectorSaver("outlook-calendar", props);
	const describeTime = useCalendarEventTime();
	const [windowStart, setWindowStart] = useState(() =>
		startOfLocalDay(new Date()),
	);
	const [openEvent, setOpenEvent] = useState<CalendarEvent | null>(null);
	const { listRef, rememberItem } = useReturnFocus(openEvent !== null);
	const serviceName = t("services.outlookCalendar");

	const windowEnd = addLocalDays(windowStart, WINDOW_DAYS);
	const isThisWeek =
		windowStart.getTime() === startOfLocalDay(new Date()).getTime();
	const query = useConnectorQuery(
		MICROSOFT_PIXELS.calendarListEvents({
			start: windowStart.toISOString(),
			end: windowEnd.toISOString(),
			limit: MAX_EVENTS,
		}),
		parseCalendarEvents,
	);

	const eventRequest = (event: CalendarEvent): ConnectorSaveRequest => ({
		key: event.id,
		name: event.subject || t("calendar.noTitle"),
		source: {
			kind: "text",
			fileName: calendarEventFileName(event),
			// the list is read without descriptions, so the event is read in full
			getContent: async () => {
				if (!insightId) {
					throw new Error(t("errors.noInsight"));
				}
				const full = parseCalendarEventDetail(
					await runConnectorPixel(
						MICROSOFT_PIXELS.calendarGetEvent(event.id),
						insightId,
					),
				);
				return calendarEventToMarkdown(full);
			},
		},
	});

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div
				className={cn(
					"flex h-full min-h-0 flex-col",
					openEvent !== null && "hidden",
				)}
			>
				<ConnectorViewerHeader
					icon={CalendarDaysIcon}
					title={serviceName}
					description={t("calendar.range", {
						start: formatShortDay(windowStart, i18n.language),
						end: formatShortDay(
							addLocalDays(windowEnd, -1),
							i18n.language,
						),
					})}
				>
					<ConnectorIconButton
						icon={ChevronLeftIcon}
						label={t("calendar.previous")}
						onClick={() =>
							setWindowStart((previous) =>
								addLocalDays(previous, -WINDOW_DAYS),
							)
						}
					/>
					<Button
						variant="ghost"
						size="sm"
						disabled={isThisWeek}
						onClick={() =>
							setWindowStart(startOfLocalDay(new Date()))
						}
					>
						{t("calendar.today")}
					</Button>
					<ConnectorIconButton
						icon={ChevronRightIcon}
						label={t("calendar.next")}
						onClick={() =>
							setWindowStart((previous) =>
								addLocalDays(previous, WINDOW_DAYS),
							)
						}
					/>
					<ConnectorIconButton
						icon={RefreshCwIcon}
						label={t("common.refresh")}
						isSpinning={query.isRefreshing}
						onClick={query.reload}
					/>
				</ConnectorViewerHeader>

				<ConnectorList
					query={query}
					serviceName={serviceName}
					emptyIcon={CalendarDaysIcon}
					onSignIn={onSignIn}
					listRef={listRef}
					limit={MAX_EVENTS}
					emptyText={t("calendar.empty")}
				>
					{(events) =>
						groupByDay(events, windowStart).map((group) => (
							<li
								key={group.day.getTime()}
								className="flex flex-col"
							>
								<H4 className="sticky top-0 z-10 bg-card px-2 pt-3 pb-1 font-medium text-muted-foreground text-xs">
									{formatDayHeading(group.day, i18n.language)}
								</H4>
								<ul className="flex flex-col">
									{group.events.map((event) => {
										const request = eventRequest(event);
										const isBusy = saver.isBusy(
											request.key,
										);
										const subject =
											event.subject ||
											t("calendar.noTitle");
										// the row reads out what it shows
										const title = event.isCancelled
											? t("calendar.cancelledTitle", {
													title: subject,
												})
											: subject;
										const time = describeTime(event);
										return (
											<ConnectorItemRow
												key={event.id}
												itemKey={event.id}
												icon={
													event.isOnlineMeeting ? (
														<VideoIcon
															aria-hidden
															className="size-4"
														/>
													) : (
														<CalendarIcon
															aria-hidden
															className="size-4"
														/>
													)
												}
												title={title}
												description={[
													time,
													event.location,
												]
													.filter(Boolean)
													.join(", ")}
												openLabel={t(
													"calendar.openEvent",
													{
														title: title,
														time: describeTime(
															event,
															true,
														),
													},
												)}
												isBusy={isBusy}
												onOpen={() => {
													rememberItem(event.id);
													setOpenEvent(event);
												}}
												actions={{
													itemName: title,
													serviceName:
														t("services.outlook"),
													webUrl: event.webLink,
													saveLabel: saver.saveLabel,
													isBusy: isBusy,
													onAddToContext:
														saver.addToContext
															? () =>
																	saver.addToContext?.(
																		request,
																	)
															: undefined,
													onSave: () =>
														saver.save(request),
												}}
											/>
										);
									})}
								</ul>
							</li>
						))
					}
				</ConnectorList>
			</div>

			{openEvent ? (
				<OutlookEventDetail
					key={openEvent.id}
					summary={openEvent}
					saver={saver}
					onSignIn={onSignIn}
					onBack={() => setOpenEvent(null)}
				/>
			) : null}
		</div>
	);
};
