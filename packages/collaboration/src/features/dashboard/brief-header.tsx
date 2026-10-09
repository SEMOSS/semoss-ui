import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
	Button,
	H1,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import { selectWorkItems } from "@/features/collaboration/state/collaboration.selectors";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useDashboard } from "./dashboard.context";
import { dashboardTimeZone, eventStart } from "./dashboard-calendar";
import { dayKey } from "./dashboard-selectors";

/** A factual, live headline for the available work and next meeting. */
export function BriefHeader() {
	const { state } = useCollaborationSession();
	const { calendar, mail, refreshSources } = useDashboard();
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
	const pending = selectWorkItems(state, { view: "needs_me" }).items;
	const handled = selectWorkItems(state, {
		view: "done_today",
	}).total;
	const waiting = selectWorkItems(state, { view: "waiting" }).total;
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
	const beforeMeeting = next
		? pending.filter(
				(item) =>
					item.due &&
					new Date(item.due) >= now &&
					new Date(item.due) <= next,
			).length
		: 0;
	const checkedAt =
		updates?.lastUpdated ?? calendar.checkedAt ?? mail.checkedAt;
	const checked = checkedAt ? new Date(checkedAt) : null;
	const isRefreshing = Boolean(
		updates?.isRefreshing || calendar.isLoading || mail.isLoading,
	);
	return (
		<header className="mb-4 space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
				<H1 className="min-w-0 max-w-3xl flex-1 font-medium text-2xl leading-snug tracking-tight 2xl:text-3xl">
					{greeting}
					{name ? `, ${name}` : ""}.{" "}
					<span className="text-muted-foreground">
						{pending.length}{" "}
						{pending.length === 1 ? "thing needs" : "things need"}{" "}
						you
						{beforeMeeting > 0 && next
							? `, ${beforeMeeting} before your ${next.toLocaleTimeString(undefined, { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: false })} meeting`
							: ""}
						.
					</span>
				</H1>
			</div>
			<div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-muted-foreground text-xs leading-5">
				<Link
					to="/work/all"
					className="inline-flex min-h-6 pointer-coarse:min-h-11 items-center gap-2 rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
				>
					<span
						aria-hidden="true"
						className="size-1.5 rounded-full bg-foreground"
					/>
					<span className="text-foreground">{pending.length}</span>{" "}
					open
				</Link>
				<span aria-hidden="true">·</span>
				<Link
					to="/work/done"
					className="inline-flex min-h-6 pointer-coarse:min-h-11 items-center gap-1 rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
				>
					<span className="text-foreground">{handled}</span> handled
				</Link>
				<span aria-hidden="true">·</span>
				<Link
					to="/work/waiting"
					className="inline-flex min-h-6 pointer-coarse:min-h-11 items-center gap-1 rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
				>
					<span className="text-foreground">{waiting}</span> waiting
					on others
				</Link>
				<span aria-hidden="true">·</span>
				<span>
					{isRefreshing
						? "checking…"
						: checked
							? `checked ${checked.toLocaleTimeString(undefined, { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: false })}`
							: "from your available conversations"}
				</span>
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Refresh your brief"
							disabled={isRefreshing}
							className="-ml-2 pointer-coarse:size-11 size-7 text-muted-foreground"
							onClick={() => {
								updates?.refresh();
								refreshSources();
							}}
						>
							<RefreshCw
								aria-hidden="true"
								className="size-3.5"
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Refresh your brief</TooltipContent>
				</Tooltip>
			</div>
		</header>
	);
}
