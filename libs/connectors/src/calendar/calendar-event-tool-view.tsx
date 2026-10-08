import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import type { ToolViewProps } from "@semoss/shared";
import { Muted } from "@semoss/ui/next";
import { isRecord } from "@semoss/utility/object";
import { ToolApprovalActions } from "../components/tool-approval-actions";
import { ToolCallNotice } from "../components/tool-call-notice";
import { ToolViewCard } from "../components/tool-view-card";
import {
	readArgText,
	readToolAccount,
	readToolResult,
} from "../core/tool-view-call";
import { toViewerHost } from "../core/tool-view-host";
import { useConnectorSaver } from "../core/use-connector-saver";
import { useToolDecision } from "../core/use-tool-decision";
import { parseCalendarEventDetail } from "./calendar.parsers";
import type { CalendarEvent } from "./calendar.types";
import { CALENDAR_APPS } from "./calendar-apps";
import { CalendarEventSummary } from "./calendar-event-summary";
import { CalendarEventView } from "./calendar-event-view";
import { CalendarResponseForm } from "./calendar-response-form";

/** What each answer to an invitation reads as once sent. */
const ANSWERED_KEYS: Record<string, string> = {
	accept: "toolViews.calendar.accepted",
	tentative: "toolViews.calendar.tentativelyAccepted",
	decline: "toolViews.calendar.declined",
};

/**
 * An event a call returned, read.
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
 * One event in the conversation. For `GetEvent` it is the event the call
 * read; for an answer to an invitation (`intent=respond`) or a delete
 * (`intent=delete`) it asks first, naming the event, then says what was
 * done.
 */
export const CalendarEventToolView = ({
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
	const decision = useToolDecision();
	const result = useMemo(() => readToolResult(call), [call]);
	const intent =
		params.intent === "respond" || params.intent === "delete"
			? params.intent
			: null;

	if (intent === "respond" && mode === "approval") {
		return (
			<CalendarResponseForm
				app={app}
				call={call}
				onApprove={onApprove}
				onDecline={onDecline}
				onSignIn={viewerHost.onSignIn}
			/>
		);
	}
	if (intent === "delete" && mode === "approval") {
		return (
			<ToolViewCard
				brand={app.brand}
				title={t("toolViews.calendar.deleteTitle")}
			>
				<CalendarEventSummary
					app={app}
					eventId={readArgText(call.arguments, "id")}
					onSignIn={viewerHost.onSignIn}
				/>
				<ToolApprovalActions
					approveLabel={t("toolViews.calendar.delete")}
					isBusy={decision.pending !== null}
					isApproving={decision.pending === "approve"}
					error={decision.error}
					onApprove={() =>
						decision.decide("approve", () => onApprove())
					}
					onDeny={() => decision.decide("deny", onDecline)}
				/>
			</ToolViewCard>
		);
	}
	if (call.status !== "succeeded") {
		return <ToolCallNotice call={call} appName={t(app.appNameKey)} />;
	}
	if (intent === "respond") {
		const response = (
			isRecord(result) && typeof result.response === "string"
				? result.response
				: readArgText(call.arguments, "response")
		).toLowerCase();
		const wasSent = !(isRecord(result) && result.sendResponse === false);
		return (
			<ToolViewCard
				brand={app.brand}
				title={t("toolViews.calendar.respondTitle")}
			>
				<output className="block text-sm">
					{t(
						ANSWERED_KEYS[response] ??
							"toolViews.calendar.answered",
					)}{" "}
					{wasSent ? t("toolViews.calendar.organizerTold") : null}
				</output>
			</ToolViewCard>
		);
	}
	if (intent === "delete") {
		return (
			<ToolViewCard
				brand={app.brand}
				title={t("toolViews.calendar.deleteTitle")}
			>
				<output className="block text-sm">
					{t("toolViews.calendar.deleted")}
				</output>
			</ToolViewCard>
		);
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
		<CalendarEventView
			app={app}
			summary={event}
			saver={saver}
			onSignIn={viewerHost.onSignIn}
			isSummaryComplete
		/>
	);
};
