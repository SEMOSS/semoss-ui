import { useEffect, useState } from "react";
import { CollaborationHeroHeader } from "@/features/collaboration/components/collaboration-hero-header";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useDashboard } from "./dashboard.context";
import { dashboardTimeZone, eventStart, isAllDay } from "./dashboard-calendar";
import { dayKey } from "./dashboard-selectors";
import { MailCheckStatus } from "./mail-check-status";
import { selectToday } from "./today-selectors";

/** One line: what is due today and when the next meeting starts. */
export function BriefHeader() {
	const { state } = useCollaborationSession();
	const { calendar } = useDashboard();
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const timer = window.setInterval(() => setNow(new Date()), 60_000);
		return () => window.clearInterval(timer);
	}, []);
	const zone = dashboardTimeZone(state.profile.timezone);
	const hour = Number(
		new Intl.DateTimeFormat("en", {
			timeZone: zone,
			hour: "numeric",
			hourCycle: "h23",
		}).format(now),
	);
	// Directory names are often "Last, First"; greet by the given name.
	const [family, given] = state.profile.name.split(",", 2);
	const name = (given?.trim() || family).trim().split(/\s+/)[0];
	const greeting =
		hour < 12
			? "Good morning"
			: hour < 18
				? "Good afternoon"
				: "Good evening";
	const { due } = selectToday(state, now);
	const next = (calendar.data ?? [])
		.flatMap((event) => {
			const start = eventStart(event);
			// a whole day event has no time to meet at
			return start &&
				!isAllDay(event) &&
				start >= now &&
				dayKey(start, zone) === dayKey(now, zone)
				? [start]
				: [];
		})
		.sort((a, b) => a.getTime() - b.getTime())[0];
	const at = next?.toLocaleTimeString(undefined, {
		timeZone: zone,
		hour: "numeric",
		minute: "2-digit",
	});
	// facts first, said gently; the ask box below is the invitation
	const dueLine =
		due === 0
			? "Nothing is due today."
			: due === 1
				? "One thing is due today."
				: `${due} things are due today.`;
	return (
		<CollaborationHeroHeader
			eyebrow={
				<span className="font-medium text-xs uppercase tracking-widest">
					Welcome to Collaboration
				</span>
			}
			title={`${greeting}${name ? `, ${name}` : ""}.`}
			description={`${dueLine}${at ? ` Your next meeting is at ${at}.` : ""}`}
		>
			<MailCheckStatus />
		</CollaborationHeroHeader>
	);
}
