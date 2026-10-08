import { useTranslation } from "@semoss/i18n";
import { ConnectorViewerStatus } from "../components/connector-viewer-status";
import { useConnectorQuery } from "../core/use-connector-query";
import { parseCalendarEventDetail } from "./calendar.parsers";
import type { CalendarApp } from "./calendar-apps";
import { useEventTime } from "./use-event-time";

/** Props for {@link CalendarEventSummary}. */
export interface CalendarEventSummaryProps {
	/** The calendar the event is on. */
	app: CalendarApp;
	/** The event. */
	eventId: string;
	/** Starts the sign in, when the host offers one. */
	onSignIn?: () => Promise<boolean>;
}

/**
 * Which event a call acts on, read from its calendar: its title, when and
 * where it is, and who organized it, so the user knows what they approve.
 */
export const CalendarEventSummary = ({
	app,
	eventId,
	onSignIn,
}: CalendarEventSummaryProps) => {
	const { t } = useTranslation("connectors");
	const describeTime = useEventTime();
	const query = useConnectorQuery(
		eventId ? app.pixels.getEvent(eventId) : null,
		parseCalendarEventDetail,
	);
	const event = query.data;

	if (!event) {
		return (
			<ConnectorViewerStatus
				query={query}
				serviceName={t(app.nameKey)}
				account={app.account}
				onSignIn={onSignIn}
				skeletonRows={2}
			/>
		);
	}

	const fields = [
		{
			label: t("toolViews.calendar.subject"),
			value: event.subject || t("calendar.noTitle"),
		},
		{ label: t("calendar.when"), value: describeTime(event, true) },
		{ label: t("calendar.location"), value: event.location ?? "" },
		{
			label: t("calendar.organizer"),
			value: event.organizerName ?? event.organizer ?? "",
		},
	].filter((field) => field.value.trim() !== "");

	return (
		<dl className="flex flex-col gap-1 rounded-md border border-border bg-muted/20 p-2 text-sm">
			{fields.map((field) => (
				<div key={field.label} className="flex min-w-0 gap-2">
					<dt className="shrink-0 text-muted-foreground">
						{field.label}
					</dt>
					<dd className="wrap-anywhere min-w-0">{field.value}</dd>
				</div>
			))}
		</dl>
	);
};
