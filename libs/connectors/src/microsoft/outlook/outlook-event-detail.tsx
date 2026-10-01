import { VideoIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { Button } from "@semoss/ui/next";
import { ConnectorActionBar } from "../../components/connector-action-bar";
import { ConnectorDetailView } from "../../components/connector-detail-view";
import { ConnectorTextBody } from "../../components/connector-text-body";
import { ConnectorViewerStatus } from "../../components/connector-viewer-status";
import { useConnectorQuery } from "../../core/use-connector-query";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../../core/use-connector-saver";
import {
	calendarEventFileName,
	calendarEventToMarkdown,
} from "../microsoft.markdown";
import { parseCalendarEventDetail } from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { CalendarEvent } from "../microsoft.types";
import { useCalendarEventTime } from "./use-calendar-event-time";

/** Props for {@link OutlookEventDetail}. */
export interface OutlookEventDetailProps {
	/** The event as the list showed it, until the full one is read. */
	summary: CalendarEvent;
	/** Saves the event into the insight. */
	saver: ConnectorSaver;
	/** Goes back to the list. */
	onBack: () => void;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * One calendar event: when and where it is, who organized it and who is
 * invited, a way to join its online meeting, and its description.
 */
export const OutlookEventDetail = ({
	summary,
	saver,
	onBack,
	onSignIn,
}: OutlookEventDetailProps) => {
	const { t } = useTranslation("connectors");
	const describeTime = useCalendarEventTime();
	const query = useConnectorQuery(
		MICROSOFT_PIXELS.calendarGetEvent(summary.id),
		parseCalendarEventDetail,
	);
	const event = query.data;
	const shown = event ?? summary;
	const serviceName = t("services.outlookCalendar");
	const title = shown.subject || t("calendar.noTitle");

	const request = (full: CalendarEvent): ConnectorSaveRequest => ({
		key: full.id,
		name: title,
		source: {
			kind: "text",
			fileName: calendarEventFileName(full),
			getContent: () => calendarEventToMarkdown(full),
		},
	});

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
			backLabel={t("calendar.back")}
			onBack={onBack}
			fields={[
				{ label: t("calendar.when"), value: describeTime(shown, true) },
				{
					label: t("calendar.status"),
					value: shown.isCancelled ? t("calendar.cancelled") : "",
				},
				{ label: t("calendar.location"), value: shown.location ?? "" },
				{ label: t("calendar.organizer"), value: organizer },
				{ label: t("calendar.attendees"), value: attendees },
			]}
			actions={
				event ? (
					<ConnectorActionBar
						serviceName={t("services.outlook")}
						saveLabel={saver.saveLabel}
						webUrl={event.webLink}
						isBusy={saver.isBusy(event.id)}
						onAddToContext={
							saver.addToContext
								? () => saver.addToContext?.(request(event))
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
					onSignIn={onSignIn}
					skeletonRows={3}
				/>
			)}
		</ConnectorDetailView>
	);
};
