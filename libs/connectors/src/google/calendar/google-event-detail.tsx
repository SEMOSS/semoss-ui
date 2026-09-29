import { VideoIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button } from "@semoss/ui/next";
import { ConnectorActionBar } from "../../components/connector-action-bar";
import { ConnectorDetailView } from "../../components/connector-detail-view";
import { ConnectorTextBody } from "../../components/connector-text-body";
import { ConnectorViewerStatus } from "../../components/connector-viewer-status";
import { toPlainText } from "../../core/connector.format";
import { useConnectorQuery } from "../../core/use-connector-query";
import type {
	ConnectorSaveRequest,
	ConnectorSaver,
} from "../../core/use-connector-saver";
import { googleEventFileName, googleEventToMarkdown } from "../google.markdown";
import { parseGoogleCalendarEvent } from "../google.parsers";
import { GOOGLE_PIXELS } from "../google.pixels";
import type {
	GoogleCalendarEvent,
	GoogleCalendarEventSummary,
} from "../google.types";
import { useGoogleEventTime } from "./use-google-event-time";

/** Props for {@link GoogleEventDetail}. */
export interface GoogleEventDetailProps {
	/** The event as the list showed it, until the full one is read. */
	summary: GoogleCalendarEventSummary;
	/** Saves the event into the insight. */
	saver: ConnectorSaver;
	/** Goes back to the list. */
	onBack: () => void;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * One Google Calendar event: when it is, where, who organized it and who is
 * invited, a way to join its Google Meet, and its description.
 */
export const GoogleEventDetail = ({
	summary,
	saver,
	onBack,
	onSignIn,
}: GoogleEventDetailProps) => {
	const { t } = useTranslation("connectors");
	const describeTime = useGoogleEventTime();
	// the reactor does not repeat the id, so the parser is made for this one
	const parse = useMemo(
		() => parseGoogleCalendarEvent(summary.id),
		[summary.id],
	);
	const query = useConnectorQuery(
		GOOGLE_PIXELS.calendarRead(summary.id),
		parse,
	);
	const event = query.data;
	const serviceName = t("services.googleCalendar");
	const title = (event ?? summary).summary || t("calendar.noTitle");

	const request = (full: GoogleCalendarEvent): ConnectorSaveRequest => ({
		key: full.id,
		name: title,
		source: {
			kind: "text",
			fileName: googleEventFileName(full.summary),
			getContent: () => googleEventToMarkdown(full),
		},
	});

	return (
		<ConnectorDetailView
			title={title}
			backLabel={t("calendar.back")}
			onBack={onBack}
			fields={
				event
					? [
							{
								label: t("calendar.when"),
								value: describeTime(event),
							},
							{
								label: t("googleCalendar.repeats"),
								value: event.frequency
									? t(
											`googleCalendar.frequency.${event.frequency}`,
											{
												defaultValue:
													event.frequency.toLowerCase(),
											},
										)
									: "",
							},
							{
								label: t("calendar.location"),
								value: event.location ?? "",
							},
							{
								label: t("calendar.organizer"),
								value: event.organizer ?? "",
							},
							{
								label: t("calendar.attendees"),
								value: event.attendees
									.map((attendee) => attendee.email ?? "")
									.filter(Boolean)
									.join(", "),
							},
						]
					: []
			}
			actions={
				event ? (
					<ConnectorActionBar
						serviceName={serviceName}
						saveLabel={saver.saveLabel}
						webUrl={event.htmlLink}
						isBusy={saver.isBusy(event.id)}
						onAddToContext={
							saver.addToContext
								? () => saver.addToContext?.(request(event))
								: undefined
						}
						onSave={() => saver.save(request(event))}
					>
						{event.hangoutLink ? (
							<Button variant="ghost" size="sm" asChild>
								<a
									href={event.hangoutLink}
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
					text={
						event.description
							? toPlainText(event.description)
							: undefined
					}
					emptyText={t("calendar.noDescription")}
				/>
			) : (
				<ConnectorViewerStatus
					query={query}
					serviceName={serviceName}
					account="google"
					onSignIn={onSignIn}
					skeletonRows={3}
				/>
			)}
		</ConnectorDetailView>
	);
};
