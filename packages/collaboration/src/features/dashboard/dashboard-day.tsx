import { CalendarDays, MapPin } from "lucide-react";
import { useState } from "react";
import { Button, cn } from "@semoss/ui/next";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useDashboard } from "./dashboard.context";
import {
	agendaDays,
	dashboardTimeZone,
	eventStart,
} from "./dashboard-calendar";
import { DashboardResourceStatus } from "./dashboard-resource-status";
import { dayKey } from "./dashboard-selectors";

/** The agenda follows local calendar dates, including when UTC is already tomorrow. */
export function DashboardDay() {
	const { calendar, setSource } = useDashboard();
	const { state } = useCollaborationSession();
	const zone = dashboardTimeZone(state.profile.timezone);
	const now = new Date();
	const today = dayKey(now, zone);
	const [selected, setSelected] = useState<string | null>(null);
	const date = selected ?? today;
	const days = agendaDays(now, zone);
	const events = (calendar.data ?? [])
		.map((event) => ({ event, start: eventStart(event) }))
		.filter((entry) => entry.start && dayKey(entry.start, zone) === date)
		.sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0));
	const next = events.find(({ start }) => start && start >= now)?.event.id;
	const time = new Intl.DateTimeFormat(undefined, {
		timeZone: zone,
		hour: "numeric",
		minute: "2-digit",
	});
	return (
		<div className="space-y-4">
			<fieldset
				className="flex gap-1 overflow-x-auto pb-1"
				aria-label="Agenda date"
			>
				{days.map((day) => {
					const key = dayKey(day, "UTC");
					return (
						<Button
							key={key}
							size="sm"
							variant={key === date ? "default" : "ghost"}
							className="h-auto min-w-0 flex-1 flex-col gap-1 px-1 py-2"
							aria-pressed={key === date}
							aria-label={day.toLocaleDateString(undefined, {
								timeZone: "UTC",
								weekday: "long",
								month: "long",
								day: "numeric",
							})}
							onClick={() => setSelected(key)}
						>
							<span className="text-xs">
								{day
									.toLocaleDateString(undefined, {
										timeZone: "UTC",
										weekday: "short",
									})
									.slice(0, 2)}
							</span>
							<span>
								{day.toLocaleDateString(undefined, {
									timeZone: "UTC",
									day: "numeric",
								})}
							</span>
						</Button>
					);
				})}
			</fieldset>
			<p className="text-muted-foreground text-xs">
				{zone.replaceAll("_", " ")}
			</p>
			<DashboardResourceStatus
				disconnected={
					!state.settings.sourcesJson.calendar
						? "Connect your calendar to see your day and prepare for meetings."
						: undefined
				}
				error={calendar.error}
				loading={calendar.isLoading && !calendar.data}
				onRetry={calendar.refresh}
			/>
			{events.map(({ event, start }) => (
				<div
					key={event.id}
					className="dashboard-row space-y-2 border-border border-l-2 py-3 pl-3"
				>
					{next === event.id && date === today && (
						<p className="mb-3 flex items-center gap-2 font-medium text-primary text-xs">
							<span className="size-2 rounded-full bg-primary" />
							Now {time.format(now)}
							<span className="h-px flex-1 bg-primary/30" />
						</p>
					)}
					<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
						<time dateTime={start?.toISOString()}>
							{start ? time.format(start) : "Time unavailable"}
						</time>
						{next === event.id && (
							<span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
								Up next
							</span>
						)}
					</div>
					<button
						type="button"
						className={cn(
							"block text-left font-medium text-sm hover:underline focus-visible:outline-ring",
							start && start < now && "text-muted-foreground",
						)}
						onClick={() =>
							setSource({ kind: "calendar", id: event.id })
						}
					>
						{event.subject || "Untitled meeting"}
					</button>
					{event.attendees.length > 0 && (
						<p className="text-muted-foreground text-xs">
							{event.attendees
								.slice(0, 2)
								.map((person) => person.name || person.address)
								.filter(Boolean)
								.join(", ")}
							{event.attendees.length > 2
								? ` +${event.attendees.length - 2}`
								: ""}
						</p>
					)}
					{event.location && (
						<p className="flex items-start gap-1 text-muted-foreground text-xs">
							<MapPin
								aria-hidden="true"
								className="mt-0.5 size-3 shrink-0"
							/>
							{event.location}
						</p>
					)}
					{next === event.id && (
						<Button
							size="sm"
							variant="secondary"
							onClick={() =>
								setSource({ kind: "calendar", id: event.id })
							}
						>
							Prepare for meeting
						</Button>
					)}
				</div>
			))}
			{calendar.data && !events.length && (
				<div className="space-y-2 py-6 text-muted-foreground text-sm">
					<CalendarDays aria-hidden="true" className="size-6" />
					<p>No meetings returned for this day.</p>
				</div>
			)}
			{calendar.data && (
				<p className="text-muted-foreground text-xs">
					Upcoming week · up to 30 calendar entries
					{calendar.data.some((event) => !eventStart(event))
						? " · Some event times are unavailable"
						: ""}
				</p>
			)}
		</div>
	);
}
