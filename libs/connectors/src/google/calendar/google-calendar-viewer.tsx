import {
	CalendarDaysIcon,
	CalendarIcon,
	RefreshCwIcon,
	RepeatIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { cn } from "@semoss/ui/next";
import { formatLocalDateKey, formatLocalWallClock } from "@semoss/utility/date";
import { ConnectorCalendar } from "../../components/connector-calendar";
import { ConnectorIconButton } from "../../components/connector-icon-button";
import { ConnectorItemRow } from "../../components/connector-item-row";
import { ConnectorViewerHeader } from "../../components/connector-viewer-header";
import { parseGraphDay } from "../../core/connector.format";
import type { ConnectorViewerProps } from "../../core/connector.types";
import { runConnectorPixel } from "../../core/connector-pixel";
import { useCalendarWindow } from "../../core/use-calendar-window";
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

/** Props for the Google calendar. */
export type GoogleCalendarViewerProps = ConnectorViewerProps;

/** Browse the dates supplied by Google; opening an event loads its full times. */
export const GoogleCalendarViewer = (props: GoogleCalendarViewerProps) => {
	const { onSignIn, showHeader = true } = props;
	const { t } = useTranslation("connectors");
	const { insightId } = useInsight();
	const saver = useConnectorSaver("google-calendar", props);
	const calendar = useCalendarWindow();
	const [openEvent, setOpenEvent] =
		useState<GoogleCalendarEventSummary | null>(null);
	const { listRef, rememberItem } = useReturnFocus<HTMLDivElement>(
		openEvent !== null,
	);
	const serviceName = t("services.googleCalendar");
	const query = useConnectorQuery(
		GOOGLE_PIXELS.calendarList({
			startDate: formatLocalWallClock(calendar.range.start),
			endDate: formatLocalWallClock(
				new Date(calendar.range.end.getTime() - 1000),
			),
		}),
		parseGoogleCalendarDays,
	);
	const days = (query.data ?? []).flatMap((group) => {
		const day = parseGraphDay(group.date);
		return day ? [{ day, events: group.events }] : [];
	});
	const eventTitle = (event: GoogleCalendarEventSummary): string =>
		event.summary || t("calendar.noTitle");
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
						brand="google-calendar"
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
					account="google"
					onSignIn={onSignIn}
					focusRef={listRef}
					getTitle={eventTitle}
					getEventKey={(event) => event.id}
					onOpenEvent={(event, itemKey) => {
						rememberItem(itemKey);
						setOpenEvent(event);
					}}
					renderEvent={(event, day) => {
						const request = eventRequest(event);
						const title = eventTitle(event);
						const itemKey = `${formatLocalDateKey(day)}:${event.id}`;
						const Icon = event.recurringEventId
							? RepeatIcon
							: CalendarIcon;
						return (
							<ConnectorItemRow
								key={itemKey}
								itemKey={itemKey}
								icon={<Icon aria-hidden className="size-4" />}
								title={title}
								description={
									event.recurringEventId
										? t("googleCalendar.repeating")
										: undefined
								}
								openLabel={t("googleCalendar.openEvent", {
									title,
								})}
								isBusy={saver.isBusy(request.key)}
								onOpen={() => {
									rememberItem(itemKey);
									setOpenEvent(event);
								}}
								actions={{
									itemName: title,
									serviceName,
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
