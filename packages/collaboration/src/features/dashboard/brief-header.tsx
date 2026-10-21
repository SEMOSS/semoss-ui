import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	cn,
	H1,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { checkTime } from "@/features/collaboration/live/work-refresh-status";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useDashboard } from "./dashboard.context";
import { dashboardTimeZone, eventStart } from "./dashboard-calendar";
import { dayKey } from "./dashboard-selectors";
import { selectToday } from "./today-selectors";

/** One line: what is due today and when the next meeting starts. */
export function BriefHeader() {
	const { state } = useCollaborationSession();
	const { calendar, refreshSources } = useDashboard();
	const updates = useWorkUpdates();
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
			return start &&
				start >= now &&
				dayKey(start, zone) === dayKey(now, zone)
				? [start]
				: [];
		})
		.sort((a, b) => a.getTime() - b.getTime())[0];
	// the same check as Work's Refresh: when Microsoft 365 was last read, not when this page re-read
	const check = updates?.lastMailCheck ?? null;
	const isChecking = Boolean(
		updates?.isSyncing || check?.status === "running",
	);
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
		<header className="mb-6 flex flex-col items-center gap-2 text-center">
			<H1 className="font-display font-medium text-3xl leading-tight sm:text-[2.5rem]">
				{greeting}
				{name ? `, ${name}` : ""}.
			</H1>
			<P className="text-base text-muted-foreground">
				{dueLine}
				{at ? ` Your next meeting is at ${at}.` : ""}
			</P>
			<div className="flex items-center gap-1 text-muted-foreground/80 text-xs">
				<span>
					{isChecking
						? "Checking\u2026"
						: updates?.syncError || check?.status === "failed"
							? "Last check failed"
							: check?.at
								? `Updated ${checkTime(check.at)}`
								: ""}
				</span>
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Check for new mail"
							disabled={!updates || isChecking}
							className="pointer-coarse:size-11 size-7 text-muted-foreground"
							onClick={() => {
								updates?.syncMail();
								refreshSources();
							}}
						>
							<RefreshCw
								aria-hidden="true"
								className={cn(
									"size-3.5",
									isChecking && "animate-spin",
								)}
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Check for new mail</TooltipContent>
				</Tooltip>
			</div>
		</header>
	);
}
