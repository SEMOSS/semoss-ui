import { useEffect, useState } from "react";
import { Button, cn, P } from "@semoss/ui/next";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { BriefPanel } from "./brief-panel";
import { useDashboard } from "./dashboard.context";
import { dashboardTimeZone, eventStart } from "./dashboard-calendar";
import { DashboardResourceStatus } from "./dashboard-resource-status";
import { dayKey } from "./dashboard-selectors";

/** Today's calendar, with a live time marker and source-backed meeting details. */
export function BriefDay({ compact = false }: { compact?: boolean }) {
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
			return start && dayKey(start, zone) === today
				? [{ event, start }]
				: [];
		})
		.sort((a, b) => a.start.getTime() - b.start.getTime());
	const nextIndex = events.findIndex(({ start }) => start >= now);
	const markerIndex = nextIndex === -1 ? events.length : nextIndex;
	return (
		<BriefPanel
			title="Your day"
			detail={`${events.length} ${events.length === 1 ? "meeting" : "meetings"}`}
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
			{events.length > 0 && (
				<ol>
					{Array.from({ length: events.length + 1 }, (_, index) => {
						const entry = events[index];
						return (
							<li key={entry?.event.id ?? "end"}>
								{index === markerIndex && (
									<div className="flex items-center gap-4 py-4 text-primary">
										<time
											className="w-12 shrink-0 font-mono text-xs"
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
											"flex gap-4 py-4",
											compact && "gap-3 py-3",
											index > 0 &&
												index !== markerIndex &&
												"border-t",
											entry.start < now &&
												"text-muted-foreground",
										)}
									>
										<time
											dateTime={entry.start.toISOString()}
											className="w-12 shrink-0 pt-0.5 font-mono text-sm"
										>
											{time.format(entry.start)}
										</time>
										<div className="min-w-0 flex-1">
											<Button
												variant="link"
												className={cn(
													"h-auto max-w-full justify-start whitespace-normal p-0 text-left font-medium text-current text-sm leading-5",
													compact &&
														"block truncate whitespace-nowrap",
												)}
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
											<P
												className={cn(
													"mt-1 font-mono text-muted-foreground text-xs leading-5",
													compact && "truncate",
												)}
											>
												{entry.event.attendees
													.slice(0, 2)
													.map(
														(person) =>
															person.name ||
															person.address,
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
											{index === nextIndex &&
												!compact && (
													<Button
														size="sm"
														variant="secondary"
														className="mt-2 h-7 rounded-md px-2 font-mono font-normal text-xs"
														onClick={() =>
															setSource({
																kind: "calendar",
																id: entry.event
																	.id,
															})
														}
													>
														Prepare for meeting →
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
			{calendar.data && !events.length && !calendar.error && (
				<P className="py-4 text-muted-foreground text-sm">
					No meetings today. A little room to focus.
				</P>
			)}
		</BriefPanel>
	);
}
