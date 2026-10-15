import { CalendarDaysIcon, CalendarIcon, VideoIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import type { ToolViewProps } from "@semoss/shared";
import { ConnectorItemRow } from "../components/connector-item-row";
import { ConnectorList } from "../components/connector-list";
import { ConnectorViewerHeader } from "../components/connector-viewer-header";
import { ToolCallNotice } from "../components/tool-call-notice";
import { runConnectorPixel } from "../core/connector-pixel";
import { readToolAccount, readToolResult } from "../core/tool-view-call";
import { toViewerHost } from "../core/tool-view-host";
import type { ConnectorQuery } from "../core/use-connector-query";
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
import type { CalendarEvent, CalendarEventPage } from "./calendar.types";
import { CALENDAR_APPS } from "./calendar-apps";
import { CalendarEventView } from "./calendar-event-view";
import { useEventTime } from "./use-event-time";

/**
 * A listing's result, read.
 *
 * @param result - The call's parsed result.
 * @return The page, or null when the result is not one.
 */
const readEventPage = (result: unknown): CalendarEventPage | null => {
	try {
		return parseCalendarEvents(result);
	} catch {
		return null;
	}
};

/** Nothing to read again: the events are the call's result. */
const keepResult = (): void => undefined;

/**
 * The events a `ListEvents` call found, in the conversation, earliest first:
 * one row each, saying when and where, which opens the event in place, read
 * in full from its calendar.
 */
export const CalendarAgendaToolView = ({
	call,
	params,
	host,
}: ToolViewProps) => {
	const { t } = useTranslation("connectors");
	const { insightId } = useInsight();
	const describeTime = useEventTime();
	const app = CALENDAR_APPS[readToolAccount(params, call.functionName)];
	const viewerHost = useMemo(() => toViewerHost(host), [host]);
	const saver = useConnectorSaver(app.service, viewerHost);
	const [openEvent, setOpenEvent] = useState<CalendarEvent | null>(null);
	const { listRef, rememberItem } = useReturnFocus(openEvent !== null);
	const page = useMemo(() => readEventPage(readToolResult(call)), [call]);
	const serviceName = t(app.nameKey);

	if (call.status !== "succeeded") {
		return <ToolCallNotice call={call} appName={t(app.appNameKey)} />;
	}

	const query: ConnectorQuery<CalendarEvent[]> = {
		status: "ready",
		data: page?.events ?? [],
		error: null,
		isRefreshing: false,
		reload: keepResult,
	};
	const eventTitle = (event: CalendarEvent): string => {
		const title = event.subject || t("calendar.noTitle");
		return event.isCancelled
			? t("calendar.cancelledTitle", { title: title })
			: title;
	};
	const eventRequest = (event: CalendarEvent): ConnectorSaveRequest => ({
		key: event.id,
		name: event.subject || t("calendar.noTitle"),
		source: {
			kind: "text",
			fileName: calendarEventFileName(event),
			// a listing may leave descriptions out, so the event is read in full
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

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div
				className={
					openEvent ? "hidden" : "flex h-full min-h-0 flex-col"
				}
			>
				<ConnectorViewerHeader
					icon={CalendarDaysIcon}
					brand={app.brand}
					title={serviceName}
					description={t("calendar.eventCount", {
						count: query.data?.length ?? 0,
					})}
				/>
				<ConnectorList
					query={query}
					serviceName={serviceName}
					account={app.account}
					listRef={listRef}
					isFull={page?.hasMore === true}
					limitNote={t("toolViews.calendar.more")}
					emptyText={
						page
							? t("calendar.emptyRange")
							: t("toolViews.unreadable")
					}
				>
					{(events) =>
						events.map((event) => {
							const request = eventRequest(event);
							const title = eventTitle(event);
							const Icon = event.isOnlineMeeting
								? VideoIcon
								: CalendarIcon;
							return (
								<ConnectorItemRow
									key={event.id}
									itemKey={event.id}
									icon={
										<Icon aria-hidden className="size-4" />
									}
									title={title}
									description={[
										describeTime(event, true),
										event.location,
										event.isRecurring
											? t("calendar.repeats")
											: undefined,
									]
										.filter(Boolean)
										.join(", ")}
									openLabel={t("calendar.openEvent", {
										title: title,
										time: describeTime(event, true),
									})}
									isBusy={saver.isBusy(request.key)}
									onOpen={() => {
										rememberItem(event.id);
										setOpenEvent(event);
									}}
									actions={{
										itemName: title,
										serviceName: t(app.appNameKey),
										webUrl: event.webLink,
										saveLabel: saver.saveLabel,
										isBusy: saver.isBusy(request.key),
										onAddToContext: saver.addToContext
											? () =>
													saver.addToContext?.(
														request,
													)
											: undefined,
										onSave: () => saver.save(request),
									}}
								/>
							);
						})
					}
				</ConnectorList>
			</div>
			{openEvent ? (
				<CalendarEventView
					key={openEvent.id}
					app={app}
					summary={openEvent}
					saver={saver}
					onSignIn={viewerHost.onSignIn}
					onBack={() => setOpenEvent(null)}
				/>
			) : null}
		</div>
	);
};
