import {
	ArrowLeftIcon,
	CalendarDaysIcon,
	CalendarIcon,
	RefreshCwIcon,
	VideoIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import type { ConnectorBrand } from "@semoss/shared";
import { cn } from "@semoss/ui/next";
import { formatLocalDateKey } from "@semoss/utility/date";
import { ConnectorCalendar } from "../components/connector-calendar";
import { ConnectorIconButton } from "../components/connector-icon-button";
import { ConnectorItemRow } from "../components/connector-item-row";
import { ConnectorViewerHeader } from "../components/connector-viewer-header";
import { parseGraphDate, parseGraphDay } from "../core/connector.format";
import type {
	ConnectorAccount,
	ConnectorViewerProps,
} from "../core/connector.types";
import { groupCalendarEvents } from "../core/connector-calendar";
import { runConnectorPixel } from "../core/connector-pixel";
import {
	type CalendarWindow,
	useCalendarWindow,
} from "../core/use-calendar-window";
import { useConnectorQuery } from "../core/use-connector-query";
import {
	type ConnectorSaveRequest,
	useConnectorSaver,
} from "../core/use-connector-saver";
import { useReturnFocus } from "../core/use-return-focus";
import {
	calendarEventFileName,
	calendarEventToMarkdown,
} from "./calendar.markdown";
import {
	parseCalendarEventDetail,
	parseCalendarEvents,
} from "./calendar.parsers";
import type { CalendarEvent, CalendarEventSelection } from "./calendar.types";
import { CALENDAR_APPS } from "./calendar-apps";
import { CalendarEventView } from "./calendar-event-view";
import { useEventTime } from "./use-event-time";

const MAX_EVENTS = 100;

/** The current calendar's actions and live state for host-owned controls. */
export interface CalendarAgendaViewControls {
	/** The account these controls belong to, including when providers are retained. */
	provider: ConnectorAccount;
	/** Reload the current date range without changing its selected view or date. */
	refresh: () => void;
	/** Whether the current calendar range is loading or refreshing. */
	isRefreshing: boolean;
	/** The provider's calendar home, independent of an individual event. */
	calendarUrl: string;
	/** The localized provider app name, such as Outlook or Google Calendar. */
	appName: string;
}

/** Props for {@link CalendarAgendaView}. */
export interface CalendarAgendaViewProps extends ConnectorViewerProps {
	/** The account whose calendar is read: Outlook for `microsoft`, Google Calendar for `google`. */
	provider: ConnectorAccount;
	/** The logo the header shows. Defaults to the calendar's own. */
	brand?: ConnectorBrand;
	/** Compact browsers show an agenda and open the calendar in the host. */
	presentation?: "full" | "compact";
	/** The host's provider selector, beside refresh in a compact browser. */
	providerControl?: ReactNode;
	/** Shared navigation for an agenda and its host-owned full calendar. */
	calendar?: CalendarWindow;
	/** Open the event in the host while retaining this browser's list. */
	onOpenEvent?: (selection: CalendarEventSelection) => void;
	/** Open the full calendar from a compact browser. */
	onOpenCalendar?: () => void;
	/** Fall back to an agenda below 640px of available width. Defaults to false. */
	responsive?: boolean;
	/** Return from a host-owned full calendar to its browser. */
	onBack?: () => void;
	/** Receives host-control state when it changes. Keep the receiver identity stable. */
	onControls?: (controls: CalendarAgendaViewControls) => void;
	/** Show the viewer's own Refresh action. Defaults to true. */
	showRefresh?: boolean;
}

/**
 * Browse a calendar, in Outlook or Google Calendar, by day, week, or month or as
 * an agenda, open events, and save them into the insight. Every calendar reads
 * the same way; only the reactors it calls and the names it shows differ.
 */
export const CalendarAgendaView = (props: CalendarAgendaViewProps) => {
	const {
		provider,
		onSignIn,
		showHeader = true,
		presentation = "full",
		providerControl,
		onOpenEvent,
		onOpenCalendar,
		responsive = false,
		onBack,
		onControls,
		showRefresh = true,
	} = props;
	const app = CALENDAR_APPS[provider];
	const { t } = useTranslation("connectors");
	const { insightId } = useInsight();
	const saver = useConnectorSaver(app.service, props);
	const describeTime = useEventTime();
	const ownCalendar = useCalendarWindow();
	const calendar = props.calendar ?? ownCalendar;
	const [openEvent, setOpenEvent] = useState<CalendarEvent | null>(null);
	const { listRef, rememberItem } = useReturnFocus<HTMLDivElement>(
		openEvent !== null,
	);
	const serviceName = t(app.nameKey);
	const isCompact = presentation === "compact";
	function handleOpenEvent(event: CalendarEvent, itemKey: string): void {
		if (onOpenEvent) {
			onOpenEvent({ event, itemKey });
			return;
		}
		rememberItem(itemKey);
		setOpenEvent(event);
	}
	const query = useConnectorQuery(
		app.pixels.listEvents({
			start: calendar.range.start.toISOString(),
			end: calendar.range.end.toISOString(),
			limit: MAX_EVENTS,
		}),
		parseCalendarEvents,
	);
	const refresh = query.reload;
	const isRefreshing = query.status === "loading" || query.isRefreshing;
	const calendarUrl = app.calendarUrl;
	const appName = t(app.appNameKey);
	// Hosts may publish controls into their own store. Primitive fields and the
	// query's stable reload callback prevent a host-render publication loop.
	useEffect(() => {
		onControls?.({
			provider,
			refresh,
			isRefreshing,
			calendarUrl,
			appName,
		});
	}, [onControls, provider, refresh, isRefreshing, calendarUrl, appName]);
	const events = query.data?.events ?? [];
	const days = groupCalendarEvents(events, calendar.range, (event) => ({
		start: event.isAllDay
			? parseGraphDay(event.start)
			: parseGraphDate(event.start),
		end: event.isAllDay
			? parseGraphDay(event.end)
			: parseGraphDate(event.end),
	}));
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
						app.pixels.getEvent(event.id),
						insightId,
					),
				);
				return calendarEventToMarkdown(app, full);
			},
		},
	});

	// in the header, or at the end of the toolbar when the host leaves
	// the header out
	const refreshButton = showRefresh ? (
		<ConnectorIconButton
			icon={RefreshCwIcon}
			label={t("common.refresh")}
			isSpinning={query.isRefreshing}
			onClick={query.reload}
		/>
	) : null;

	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col">
			<div
				className={cn(
					"flex h-full min-h-0 min-w-0 flex-col",
					openEvent !== null && "hidden",
				)}
			>
				{isCompact ? (
					<div className="flex min-w-0 shrink-0 items-center gap-2 border-border border-b px-3 py-2">
						<div className="min-w-0 flex-1">{providerControl}</div>
						{refreshButton}
					</div>
				) : showHeader ? (
					<ConnectorViewerHeader
						icon={CalendarDaysIcon}
						brand={props.brand ?? app.brand}
						title={serviceName}
					>
						{refreshButton}
					</ConnectorViewerHeader>
				) : null}
				{onBack ? (
					<div className="shrink-0 border-border border-b px-2 py-1">
						<ConnectorIconButton
							icon={ArrowLeftIcon}
							isDirectional
							label={t("calendar.back")}
							onClick={onBack}
						/>
					</div>
				) : null}
				<ConnectorCalendar
					calendar={calendar}
					presentation={presentation}
					responsive={responsive}
					onOpenCalendar={onOpenCalendar}
					actions={
						showHeader || isCompact ? undefined : refreshButton
					}
					query={{ ...query, data: days }}
					serviceName={serviceName}
					account={app.account}
					onSignIn={onSignIn}
					focusRef={listRef}
					limitNote={
						query.data?.hasMore === true
							? t("calendar.limitReached", {
									count: MAX_EVENTS,
									app: t(app.appNameKey),
								})
							: undefined
					}
					getSchedule={(event) => ({
						start: event.isAllDay
							? parseGraphDay(event.start)
							: parseGraphDate(event.start),
						end: event.isAllDay
							? parseGraphDay(event.end)
							: parseGraphDate(event.end),
						isAllDay: event.isAllDay,
					})}
					getEventLabel={(event) =>
						`${eventTitle(event)}, ${describeTime(event, true)}`
					}
					getTitle={eventTitle}
					getEventKey={(event) => event.id}
					onOpenEvent={handleOpenEvent}
					renderEvent={(event, day) => {
						const request = eventRequest(event);
						const title = eventTitle(event);
						const itemKey = `${formatLocalDateKey(day)}:${event.id}`;
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
									event.isRecurring
										? t("calendar.repeats")
										: undefined,
								]
									.filter(Boolean)
									.join(", ")}
								openLabel={t("calendar.openEvent", {
									title,
									time: describeTime(event, true),
								})}
								isBusy={saver.isBusy(request.key)}
								onOpen={() => handleOpenEvent(event, itemKey)}
								actions={{
									itemName: title,
									serviceName: t(app.appNameKey),
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
				<CalendarEventView
					key={openEvent.id}
					app={app}
					summary={openEvent}
					saver={saver}
					onSignIn={onSignIn}
					onBack={() => setOpenEvent(null)}
				/>
			) : null}
		</div>
	);
};
