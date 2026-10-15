import {
	CalendarDaysIcon,
	CalendarIcon,
	ExternalLinkIcon,
	RefreshCwIcon,
	VideoIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import type { ConnectorBrand } from "@semoss/shared";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { formatLocalDateKey } from "@semoss/utility/date";
import { ConnectorCalendar } from "../components/connector-calendar";
import { ConnectorIconButton } from "../components/connector-icon-button";
import { ConnectorItemRow } from "../components/connector-item-row";
import { ConnectorViewerHeader } from "../components/connector-viewer-header";
import { parseGraphDate, parseGraphDay } from "../core/connector.format";
import type {
	ConnectorAccount,
	ConnectorFocusRequest,
	ConnectorViewerProps,
} from "../core/connector.types";
import { groupCalendarEvents } from "../core/connector-calendar";
import { runConnectorPixel } from "../core/connector-pixel";
import {
	type CalendarWindow,
	useCalendarWindow,
} from "../core/use-calendar-window";
import { useConnectorControls } from "../core/use-connector-controls";
import { useConnectorFocus } from "../core/use-connector-focus";
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
import type { CalendarEvent } from "./calendar.types";
import { CALENDAR_APPS } from "./calendar-apps";
import { CalendarEventView } from "./calendar-event-view";
import { useEventTime } from "./use-event-time";

const MAX_EVENTS = 100;

/** An event and the browser row that opened it. */
export interface CalendarEventSelection {
	event: CalendarEvent;
	itemKey: string;
}

/** Props for {@link CalendarAgendaView}. */
export interface CalendarAgendaViewProps extends ConnectorViewerProps {
	/** The account whose calendar is read: Outlook for `microsoft`, Google Calendar for `google`. */
	provider: ConnectorAccount;
	/** The logo the header shows. Defaults to the calendar's own. */
	brand?: ConnectorBrand;
	/** Share navigation between the host's agenda and full-calendar tab. */
	calendar?: CalendarWindow;
	/** Keep an agenda in a rail, or adapt a full calendar to its container. */
	presentation?: "default" | "agenda" | "calendar";
	/** Open the host's retained full-calendar tab. */
	onOpenCalendar?: () => void;
	/** Let the host open events in retained tabs instead of replacing the list. */
	onOpenEvent?: (selection: CalendarEventSelection) => void;
	/** Restore a row after returning from a retained event tab. */
	focusItem?: ConnectorFocusRequest;
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
		isVisible = true,
		onControlsChange,
		presentation = "default",
		onOpenCalendar,
		onOpenEvent,
		focusItem,
	} = props;
	const app = CALENDAR_APPS[provider];
	const { t } = useTranslation("connectors");
	const { insightId } = useInsight();
	const saver = useConnectorSaver(app.service, props);
	const describeTime = useEventTime();
	const localCalendar = useCalendarWindow();
	const calendar = props.calendar ?? localCalendar;
	const [openEvent, setOpenEvent] = useState<CalendarEvent | null>(null);
	const browserRef = useRef<HTMLElement>(null);
	const { listRef, rememberItem } = useReturnFocus<HTMLUListElement>(
		openEvent !== null,
	);
	const serviceName = t(app.nameKey);
	const query = useConnectorQuery(
		app.pixels.listEvents({
			start: calendar.range.start.toISOString(),
			end: calendar.range.end.toISOString(),
			limit: MAX_EVENTS,
		}),
		parseCalendarEvents,
	);
	const externalHref =
		provider === "google"
			? "https://calendar.google.com/calendar/"
			: undefined;
	const externalLabel = t("actions.openIn", { service: t(app.appNameKey) });
	useConnectorControls(
		{
			refresh: {
				onRefresh: query.reload,
				isRefreshing: query.isRefreshing,
			},
			onOpenCalendar,
			openIn: externalHref
				? { href: externalHref, label: externalLabel }
				: undefined,
		},
		onControlsChange,
		isVisible && openEvent === null,
	);
	useConnectorFocus(
		listRef,
		focusItem,
		isVisible && openEvent === null,
		query.status !== "loading",
		browserRef,
	);
	const handleOpenEvent = (event: CalendarEvent, itemKey: string): void => {
		if (onOpenEvent) {
			onOpenEvent({ event, itemKey });
			return;
		}
		rememberItem(itemKey);
		setOpenEvent(event);
	};
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
	const refreshButton = !onControlsChange ? (
		<ConnectorIconButton
			icon={RefreshCwIcon}
			label={t("common.refresh")}
			isSpinning={query.isRefreshing}
			onClick={query.reload}
		/>
	) : null;
	const externalLink =
		externalHref && !onControlsChange && presentation !== "default" ? (
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<Button variant="ghost" size="icon-sm" asChild>
						<a
							href={externalHref}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={externalLabel}
						>
							<ExternalLinkIcon aria-hidden className="size-4" />
						</a>
					</Button>
				</TooltipTrigger>
				<TooltipContent>{externalLabel}</TooltipContent>
			</Tooltip>
		) : null;

	return (
		<section
			ref={browserRef}
			tabIndex={-1}
			aria-label={serviceName}
			className="focus-visible:-outline-offset-2 flex h-full min-h-0 min-w-0 flex-col overflow-hidden focus-visible:outline-2 focus-visible:outline-ring"
		>
			<div
				className={cn(
					"flex h-full min-h-0 min-w-0 flex-col",
					openEvent !== null && "hidden",
				)}
			>
				{showHeader ? (
					<ConnectorViewerHeader
						icon={CalendarDaysIcon}
						brand={props.brand ?? app.brand}
						title={serviceName}
					>
						{refreshButton}
						{externalLink}
					</ConnectorViewerHeader>
				) : null}
				<ConnectorCalendar
					calendar={calendar}
					presentation={presentation}
					onOpenCalendar={
						onControlsChange ? undefined : onOpenCalendar
					}
					actions={
						showHeader ? undefined : (
							<>
								{refreshButton}
								{externalLink}
							</>
						)
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
					isVisible={isVisible}
					onControlsChange={onControlsChange}
					onBack={() => setOpenEvent(null)}
				/>
			) : null}
		</section>
	);
};
