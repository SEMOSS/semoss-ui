import {
	CalendarDaysIcon,
	CalendarIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	RefreshCwIcon,
	RepeatIcon,
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
	parseGraphDay,
	startOfLocalDay,
	toWallClockString,
} from "../../core/connector.format";
import type { ConnectorViewerProps } from "../../core/connector.types";
import { runConnectorPixel } from "../../core/connector-pixel";
import { useConnectorQuery } from "../../core/use-connector-query";
import {
	type ConnectorSaveRequest,
	useConnectorSaver,
} from "../../core/use-connector-saver";
import { useReturnFocus } from "../../core/use-return-focus";
import { googleEventFileName, googleEventToMarkdown } from "../google.markdown";
import {
	parseGoogleCalendarDays,
	parseGoogleCalendarEvent,
} from "../google.parsers";
import { GOOGLE_PIXELS } from "../google.pixels";
import type { GoogleCalendarEventSummary } from "../google.types";
import { GoogleEventDetail } from "./google-event-detail";

/** How many days the viewer shows at once. */
const WINDOW_DAYS = 7;

/** Props for {@link GoogleCalendarViewer}. */
export type GoogleCalendarViewerProps = ConnectorViewerProps;

/**
 * The user's primary Google Calendar a week at a time: see what is coming,
 * open an event for its times and guests, and bring it into the insight.
 */
export const GoogleCalendarViewer = (props: GoogleCalendarViewerProps) => {
	const { onSignIn } = props;
	const { t, i18n } = useTranslation("connectors");
	const { insightId } = useInsight();
	const saver = useConnectorSaver("google-calendar", props);
	const [windowStart, setWindowStart] = useState(() =>
		startOfLocalDay(new Date()),
	);
	const [openEvent, setOpenEvent] =
		useState<GoogleCalendarEventSummary | null>(null);
	const { listRef, rememberItem } = useReturnFocus(openEvent !== null);
	const serviceName = t("services.googleCalendar");

	const windowEnd = addLocalDays(windowStart, WINDOW_DAYS);
	const isThisWeek =
		windowStart.getTime() === startOfLocalDay(new Date()).getTime();
	const query = useConnectorQuery(
		GOOGLE_PIXELS.calendarList({
			startDate: toWallClockString(windowStart),
			// the last second of the window, which the backend includes
			endDate: toWallClockString(new Date(windowEnd.getTime() - 1000)),
		}),
		parseGoogleCalendarDays,
	);

	const eventRequest = (
		event: GoogleCalendarEventSummary,
	): ConnectorSaveRequest => ({
		key: event.id,
		name: event.summary || t("calendar.noTitle"),
		source: {
			kind: "text",
			fileName: googleEventFileName(event.summary),
			// the list has only titles, so the event is read in full first
			getContent: async () => {
				if (!insightId) {
					throw new Error(t("errors.noInsight"));
				}
				return googleEventToMarkdown(
					parseGoogleCalendarEvent(event.id)(
						await runConnectorPixel(
							GOOGLE_PIXELS.calendarRead(event.id),
							insightId,
						),
					),
				);
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
					account="google"
					onSignIn={onSignIn}
					listRef={listRef}
					emptyText={t("calendar.empty")}
				>
					{(days) =>
						days.map((day) => {
							const date = parseGraphDay(day.date);
							return (
								<li key={day.date} className="flex flex-col">
									<H4 className="sticky top-0 z-10 bg-card px-2 pt-3 pb-1 font-medium text-muted-foreground text-xs">
										{date
											? formatDayHeading(
													date,
													i18n.language,
												)
											: day.date}
									</H4>
									<ul className="flex flex-col">
										{day.events.map((event) => {
											const request = eventRequest(event);
											const isBusy = saver.isBusy(
												request.key,
											);
											const title =
												event.summary ||
												t("calendar.noTitle");
											const isRepeating =
												!!event.recurringEventId;
											return (
												<ConnectorItemRow
													key={`${day.date}:${event.id}`}
													itemKey={`${day.date}:${event.id}`}
													icon={
														isRepeating ? (
															<RepeatIcon
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
													description={
														isRepeating
															? t(
																	"googleCalendar.repeating",
																)
															: undefined
													}
													openLabel={t(
														"googleCalendar.openEvent",
														{ title: title },
													)}
													isBusy={isBusy}
													onOpen={() => {
														rememberItem(
															`${day.date}:${event.id}`,
														);
														setOpenEvent(event);
													}}
													actions={{
														itemName: title,
														serviceName:
															serviceName,
														saveLabel:
															saver.saveLabel,
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
							);
						})
					}
				</ConnectorList>
			</div>

			{openEvent ? (
				<GoogleEventDetail
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
