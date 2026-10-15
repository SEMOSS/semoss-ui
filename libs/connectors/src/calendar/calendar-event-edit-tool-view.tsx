import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import type { ToolViewProps } from "@semoss/shared";
import { Muted } from "@semoss/ui/next";
import { ToolCallNotice } from "../components/tool-call-notice";
import { readToolAccount, readToolResult } from "../core/tool-view-call";
import { toViewerHost } from "../core/tool-view-host";
import { useConnectorSaver } from "../core/use-connector-saver";
import { parseCalendarEventDetail } from "./calendar.parsers";
import type { CalendarEvent } from "./calendar.types";
import { CALENDAR_APPS } from "./calendar-apps";
import { CalendarEventForm } from "./calendar-event-form";
import { CalendarEventView } from "./calendar-event-view";

/**
 * The event a write returned, read.
 *
 * @param result - The call's parsed result.
 * @return The event, or null when the result is not one.
 */
const readCalendarEvent = (result: unknown): CalendarEvent | null => {
	try {
		return parseCalendarEventDetail(result);
	} catch {
		return null;
	}
};

/**
 * An event the agent creates (`intent=create`) or changes
 * (`intent=update`). While the call waits it is an editable form; once it
 * ran, it is the event as the calendar left it.
 */
export const CalendarEventEditToolView = ({
	call,
	params,
	mode,
	onApprove,
	onDecline,
	host,
}: ToolViewProps) => {
	const { t } = useTranslation("connectors");
	const app = CALENDAR_APPS[readToolAccount(params, call.functionName)];
	const viewerHost = useMemo(() => toViewerHost(host), [host]);
	const saver = useConnectorSaver(app.service, viewerHost);
	const result = useMemo(() => readToolResult(call), [call]);
	const intent = params.intent === "update" ? "update" : "create";

	if (mode === "approval") {
		return (
			<CalendarEventForm
				app={app}
				intent={intent}
				call={call}
				onApprove={onApprove}
				onDecline={onDecline}
				onSignIn={viewerHost.onSignIn}
			/>
		);
	}
	if (call.status !== "succeeded") {
		return <ToolCallNotice call={call} appName={t(app.appNameKey)} />;
	}

	const event = readCalendarEvent(result);
	if (!event) {
		return (
			<Muted className="block px-3 py-2">
				{t("toolViews.unreadable")}
			</Muted>
		);
	}
	return (
		<div className="flex h-full min-h-0 flex-col">
			<output className="block shrink-0 border-border border-b px-3 py-2 text-sm">
				{t(
					intent === "update"
						? "toolViews.calendar.updated"
						: "toolViews.calendar.created",
					{ app: t(app.appNameKey) },
				)}
			</output>
			<div className="min-h-0 flex-1">
				<CalendarEventView
					app={app}
					summary={event}
					saver={saver}
					onSignIn={viewerHost.onSignIn}
					isSummaryComplete
				/>
			</div>
		</div>
	);
};
