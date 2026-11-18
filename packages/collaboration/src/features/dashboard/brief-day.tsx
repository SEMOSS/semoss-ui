import { useEffect, useState } from "react";
import { Button, cn, P } from "@semoss/ui/next";
import { TeamsIcon } from "@/components/common/app-icons";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { givenFirst } from "@/lib/person-name";
import { BriefPanel } from "./brief-panel";
import { useDashboard } from "./dashboard.context";
import { dashboardTimeZone, eventStart, isAllDay } from "./dashboard-calendar";
import { DashboardResourceStatus } from "./dashboard-resource-status";
import { dayKey } from "./dashboard-selectors";

/** Today's calendar, with a live time marker and source-backed meeting details. */
export function BriefDay() {
	const { state } = useCollaborationSession();
	const { calendar, setSource } = useDashboard();
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const timer = window.setInterval(() => setNow(new Date()), 60_000);
		return () => window.clearInterval(timer);
	}, []);
	const zone = dashboardTimeZone(state.profile.timezone);
	const today = dayKey(now, zone);
	const time = new Intl.DateTimeFormat(undefined, {
		timeZone: zone,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
	const events = (calendar.data ?? [])
		.flatMap((event) => {
			const start = eventStart(event);
			const allDay = isAllDay(event);
			return start &&
				(allDay ? event.start : dayKey(start, zone)) === today
				? [{ event, start, allDay }]
				: [];
		})
		// whole day events lead the day; east of UTC their UTC midnight would sort mid-morning
		.sort(
			(a, b) =>
				Number(b.allDay) - Number(a.allDay) ||
				a.start.getTime() - b.start.getTime(),
		);
	const nextIndex = events.findIndex(
		({ start, allDay }) => !allDay && start >= now,
	);
	const markerIndex = nextIndex === -1 ? events.length : nextIndex;
	const hasCalendar = Boolean(
		state.settings.sourcesJson.calendar && calendar.data && !calendar.error,
	);
	return (
		<BriefPanel
			title="Your day"
			detail={
				hasCalendar
					? `${events.length} ${events.length === 1 ? "meeting" : "meetings"}`
					: undefined
			}
		>
			<DashboardResourceStatus
				disconnected={
					!state.settings.sourcesJson.calendar
						? "Connect your calendar to see your day."
						: undefined
				}
				error={calendar.error}
				loading={calendar.isLoading && !calendar.data}
				onRetry={calendar.refresh}
			/>
			{hasCalendar && events.length > 0 && (
				<ol>
					{Array.from({ length: events.length + 1 }, (_, index) => {
						const entry = events[index];
						return (
							<li key={entry?.event.id ?? "end"}>
								{index === markerIndex && (
									<div className="flex items-center gap-4 py-3 text-primary">
										<time
											className="w-12 shrink-0 text-sm tabular-nums"
											dateTime={now.toISOString()}
										>
											{time.format(now)}
										</time>
										<span className="relative h-px flex-1 bg-primary">
											<span className="-top-1 absolute left-0 size-2 rounded-full bg-primary" />
										</span>
									</div>
								)}
								{entry && (
									<div
										className={cn(
											"flex gap-4 py-3",
											index > 0 &&
												index !== markerIndex &&
												"border-t",
											!entry.allDay &&
												entry.start < now &&
												"text-muted-foreground",
										)}
									>
										<time
											dateTime={
												entry.allDay
													? entry.event.start
													: entry.start.toISOString()
											}
											className="w-12 shrink-0 font-medium text-sm tabular-nums leading-6"
										>
											{entry.allDay
												? "All day"
												: time.format(entry.start)}
										</time>
										<div className="min-w-0 flex-1">
											<Button
												variant="link"
												className="wrap-anywhere h-auto max-w-full justify-start whitespace-normal p-0 text-left font-medium text-base text-current leading-6"
												title={
													entry.event.subject ||
													"Untitled meeting"
												}
												onClick={() =>
													setSource({
														kind: "calendar",
														id: entry.event.id,
													})
												}
											>
												{entry.event.subject ||
													"Untitled meeting"}
											</Button>
											<P className="wrap-anywhere line-clamp-2 text-muted-foreground text-sm">
												{entry.event.attendees
													.slice(0, 2)
													.map(
														(person) =>
															givenFirst(
																person.name,
															) || person.address,
													)
													.filter(Boolean)
													.join(", ")}
												{entry.event.attendees.length >
												2
													? ` +${entry.event.attendees.length - 2}`
													: ""}
												{entry.event.location
													? ` · ${entry.event.location}`
													: ""}
											</P>
											{index === nextIndex && (
												<Button
													size="sm"
													variant="outline"
													className="mt-3"
													onClick={() =>
														setSource({
															kind: "calendar",
															id: entry.event.id,
														})
													}
												>
													{/teams/i.test(
														entry.event.location ??
															"",
													) && (
														<TeamsIcon aria-hidden="true" />
													)}
													Prepare for meeting
												</Button>
											)}
										</div>
									</div>
								)}
							</li>
						);
					})}
				</ol>
			)}
			{hasCalendar && !events.length && (
				<P className="text-muted-foreground text-sm">
					No meetings today. A little room to focus.
				</P>
			)}
		</BriefPanel>
	);
}
