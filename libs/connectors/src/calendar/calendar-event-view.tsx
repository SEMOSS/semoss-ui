import { VideoIcon } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button } from "@semoss/ui/next";
import { safeHttpsUrl } from "@semoss/utility/browser";
import { ConnectorActionBar } from "../components/connector-action-bar";
import { ConnectorDetailView } from "../components/connector-detail-view";
import { ConnectorTextBody } from "../components/connector-text-body";
import { ConnectorViewerStatus } from "../components/connector-viewer-status";
import type { ConnectorViewerProps } from "../core/connector.types";
import { useConnectorControls } from "../core/use-connector-controls";
import { useConnectorQuery } from "../core/use-connector-query";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../core/use-connector-saver";
import {
	calendarEventFileName,
	calendarEventToMarkdown,
} from "./calendar.markdown";
import { parseCalendarEventDetail } from "./calendar.parsers";
import type { CalendarEvent } from "./calendar.types";
import type { CalendarApp } from "./calendar-apps";
import { useEventTime } from "./use-event-time";

/** Props for {@link CalendarEventView}. */
export interface CalendarEventViewProps
	extends Pick<ConnectorViewerProps, "isVisible" | "onControlsChange"> {
	/** The calendar the event is on. */
	app: CalendarApp;
	/** The event as the list showed it, until the full one is read. */
	summary: CalendarEvent;
	/** Saves the event into the insight. */
	saver: ConnectorSaver;
	/** Goes back to the list. Without it the event is shown on its own. */
	onBack?: () => void;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
	/**
	 * Whether the summary is the whole event, as a call read or wrote it. It
	 * shows at once, the event is read again only to bring it up to date, and
	 * a read that fails, such as for an event since deleted, keeps it.
	 */
	isSummaryComplete?: boolean;
	/** Every explicit open, including selecting an existing tab, requests focus. */
	focusRequestId?: number;
}

/**
 * One calendar event: when and where it is, who organized it and who is
 * invited, a way to join its online meeting, and its description.
 */
export const CalendarEventView = ({
	app,
	summary,
	saver,
	onBack,
	onSignIn,
	isSummaryComplete = false,
	isVisible = true,
	onControlsChange,
	focusRequestId,
}: CalendarEventViewProps) => {
	const { t } = useTranslation("connectors");
	const describeTime = useEventTime();
	const query = useConnectorQuery(
		app.pixels.getEvent(summary.id),
		parseCalendarEventDetail,
	);
	const event =
		query.data?.id === summary.id
			? query.data
			: isSummaryComplete
				? summary
				: null;
	const shown = event ?? summary;
	const serviceName = t(app.nameKey);
	const title = shown.subject || t("calendar.noTitle");
	const webUrl = safeHttpsUrl(event?.webLink);
	const { addToContext } = saver;
	const isEventBusy = saver.isBusy(summary.id);

	const request = useCallback(
		(full: CalendarEvent): ConnectorSaveRequest => ({
			key: full.id,
			name: title,
			source: {
				kind: "text",
				fileName: calendarEventFileName(full),
				getContent: () => calendarEventToMarkdown(app, full),
			},
		}),
		[app, title],
	);
	const handleAddToContext = useCallback(() => {
		if (event) addToContext?.(request(event));
	}, [addToContext, event, request]);
	useConnectorControls(
		{
			openIn: webUrl
				? {
						href: webUrl,
						label: t("actions.openIn", {
							service: t(app.appNameKey),
						}),
					}
				: undefined,
			addToContext:
				event && addToContext
					? {
							onAddToContext: handleAddToContext,
							isBusy: isEventBusy,
						}
					: undefined,
		},
		onControlsChange,
		isVisible,
	);

	const organizer =
		shown.organizerName && shown.organizer
			? `${shown.organizerName} (${shown.organizer})`
			: (shown.organizerName ?? shown.organizer ?? "");
	const attendees = shown.attendees
		.map((attendee) => attendee.name ?? attendee.address ?? "")
		.filter(Boolean)
		.join(", ");

	return (
		<ConnectorDetailView
			title={title}
			isVisible={isVisible}
			focusRequestId={focusRequestId}
			backLabel={t("calendar.back")}
			onBack={onBack}
			fields={[
				{ label: t("calendar.when"), value: describeTime(shown, true) },
				{
					label: t("calendar.status"),
					value: [
						shown.isCancelled ? t("calendar.cancelled") : undefined,
						shown.isRecurring ? t("calendar.repeats") : undefined,
					]
						.filter(Boolean)
						.join(", "),
				},
				{ label: t("calendar.location"), value: shown.location ?? "" },
				{ label: t("calendar.organizer"), value: organizer },
				{ label: t("calendar.attendees"), value: attendees },
			]}
			actions={
				event ? (
					<ConnectorActionBar
						serviceName={t(app.appNameKey)}
						saveLabel={saver.saveLabel}
						webUrl={onControlsChange ? undefined : webUrl}
						isBusy={isEventBusy}
						onAddToContext={
							!onControlsChange && addToContext
								? handleAddToContext
								: undefined
						}
						onSave={() => saver.save(request(event))}
					>
						{event.joinUrl ? (
							<Button variant="ghost" size="sm" asChild>
								<a
									href={event.joinUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									<VideoIcon aria-hidden />
									{t("calendar.join")}
								</a>
							</Button>
						) : null}
					</ConnectorActionBar>
				) : null
			}
		>
			{event ? (
				<ConnectorTextBody
					text={event.body}
					isTruncated={event.isBodyTruncated}
					emptyText={t("calendar.noDescription")}
				/>
			) : (
				<ConnectorViewerStatus
					query={query}
					serviceName={serviceName}
					account={app.account}
					onSignIn={onSignIn}
					skeletonRows={3}
				/>
			)}
		</ConnectorDetailView>
	);
};
