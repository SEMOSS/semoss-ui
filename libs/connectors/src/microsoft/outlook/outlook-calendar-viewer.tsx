import {
	CalendarDaysIcon,
	CalendarIcon,
	RefreshCwIcon,
	VideoIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { cn } from "@semoss/ui/next";
import { ConnectorCalendar } from "../../components/connector-calendar";
import { ConnectorIconButton } from "../../components/connector-icon-button";
import { ConnectorItemRow } from "../../components/connector-item-row";
import { ConnectorViewerHeader } from "../../components/connector-viewer-header";
import { parseGraphDate, parseGraphDay } from "../../core/connector.format";
import type { ConnectorViewerProps } from "../../core/connector.types";
import {
	calendarDayKey,
	groupCalendarEvents,
} from "../../core/connector-calendar";
import { runConnectorPixel } from "../../core/connector-pixel";
import { useCalendarWindow } from "../../core/use-calendar-window";
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

const MAX_EVENTS = 100;

/** Props for the Outlook calendar. */
export type OutlookCalendarViewerProps = ConnectorViewerProps;

/** Browse a month or agenda, open events, and save them into the insight. */
export const OutlookCalendarViewer = (props: OutlookCalendarViewerProps) => {
	const { onSignIn, showHeader = true } = props;
	const { t } = useTranslation("connectors");
	const { insightId } = useInsight();
	const saver = useConnectorSaver("outlook-calendar", props);
	const describeTime = useCalendarEventTime();
	const calendar = useCalendarWindow();
	const [openEvent, setOpenEvent] = useState<CalendarEvent | null>(null);
	const { listRef, rememberItem } = useReturnFocus<HTMLDivElement>(
		openEvent !== null,
	);
	const serviceName = t("services.outlookCalendar");
	const query = useConnectorQuery(
		MICROSOFT_PIXELS.calendarListEvents({
			start: calendar.range.start.toISOString(),
			end: calendar.range.end.toISOString(),
			limit: MAX_EVENTS,
		}),
		parseCalendarEvents,
	);
	const days = groupCalendarEvents(
		query.data ?? [],
		calendar.range,
		(event) => ({
			start: event.isAllDay
				? parseGraphDay(event.start)
				: parseGraphDate(event.start, event.startTimeZone),
			end: event.isAllDay
				? parseGraphDay(event.end)
				: parseGraphDate(event.end, event.endTimeZone),
		}),
	);
	const eventTitle = (event: CalendarEvent): string => {
		const title = event.subject || t("calendar.noTitle");
		return event.isCancelled
			? t("calendar.cancelledTitle", { title })
			: title;
	};
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

	// in the header, or at the end of the toolbar when the host leaves
	// the header out
	const refreshButton = (
		<ConnectorIconButton
			icon={RefreshCwIcon}
			label={t("common.refresh")}
			isSpinning={query.isRefreshing}
			onClick={query.reload}
		/>
	);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div
				className={cn(
					"flex h-full min-h-0 flex-col",
					openEvent !== null && "hidden",
				)}
			>
				{showHeader ? (
					<ConnectorViewerHeader
						icon={CalendarDaysIcon}
						brand="outlook-calendar"
						title={serviceName}
					>
						{refreshButton}
					</ConnectorViewerHeader>
				) : null}
				<ConnectorCalendar
					calendar={calendar}
					actions={showHeader ? undefined : refreshButton}
					query={{ ...query, data: days }}
					serviceName={serviceName}
					onSignIn={onSignIn}
					focusRef={listRef}
					limitNote={
						(query.data?.length ?? 0) >= MAX_EVENTS
							? t("calendar.limitReached", { count: MAX_EVENTS })
							: undefined
					}
					getSchedule={(event) => ({
						start: event.isAllDay
							? parseGraphDay(event.start)
							: parseGraphDate(event.start, event.startTimeZone),
						end: event.isAllDay
							? parseGraphDay(event.end)
							: parseGraphDate(event.end, event.endTimeZone),
						isAllDay: event.isAllDay,
					})}
					getEventLabel={(event) =>
						`${eventTitle(event)}, ${describeTime(event, true)}`
					}
					getTitle={eventTitle}
					getEventKey={(event) => event.id}
					onOpenEvent={(event, itemKey) => {
						rememberItem(itemKey);
						setOpenEvent(event);
					}}
					renderEvent={(event, day) => {
						const request = eventRequest(event);
						const title = eventTitle(event);
						const itemKey = `${calendarDayKey(day)}:${event.id}`;
						const Icon = event.isOnlineMeeting
							? VideoIcon
							: CalendarIcon;
						return (
							<ConnectorItemRow
								key={itemKey}
								itemKey={itemKey}
								icon={<Icon aria-hidden className="size-4" />}
								title={title}
								description={[
									describeTime(event),
									event.location,
								]
									.filter(Boolean)
									.join(", ")}
								openLabel={t("calendar.openEvent", {
									title,
									time: describeTime(event, true),
								})}
								isBusy={saver.isBusy(request.key)}
								onOpen={() => {
									rememberItem(itemKey);
									setOpenEvent(event);
								}}
								actions={{
									itemName: title,
									serviceName: t("services.outlook"),
									webUrl: event.webLink,
									saveLabel: saver.saveLabel,
									isBusy: saver.isBusy(request.key),
									onAddToContext: saver.addToContext
										? () => saver.addToContext?.(request)
										: undefined,
									onSave: () => saver.save(request),
								}}
							/>
						);
					}}
				/>
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
