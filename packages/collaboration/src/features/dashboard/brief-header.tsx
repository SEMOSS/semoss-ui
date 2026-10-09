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
import { useAttention } from "@/features/attention/attention.context";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import { selectWorkItems } from "@/features/collaboration/state/collaboration.selectors";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { useDashboard } from "./dashboard.context";
import { dashboardTimeZone } from "./dashboard-calendar";

/** Greet the owner and retain navigation to handled and waiting work. */
export function BriefHeader() {
	const { state } = useCollaborationSession();
	const { calendar, mail } = useDashboard();
	const updates = useWorkUpdates();
	const queue = useAttention();
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
	const handled = selectWorkItems(state, {
		view: "done_today",
	}).total;
	const waiting = selectWorkItems(state, { view: "waiting" }).total;
	const checkedAt =
		updates?.lastUpdated ?? calendar.checkedAt ?? mail.checkedAt;
	const checked = checkedAt ? new Date(checkedAt) : null;
	const isRefreshing = Boolean(
		queue.isLoading || calendar.isLoading || mail.isLoading,
	);
	return (
		<header className="mb-4 space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
				<H1 className="min-w-0 max-w-3xl flex-1 font-medium text-2xl leading-snug tracking-tight 2xl:text-3xl">
					{greeting}
					{name ? `, ${name}` : ""}.
				</H1>
			</div>
			<div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-muted-foreground text-xs leading-5">
				<Link
					to="/tasks/done"
					className="inline-flex min-h-6 pointer-coarse:min-h-11 items-center gap-1 rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
				>
					<span className="text-foreground">{handled}</span> handled
				</Link>
				<span aria-hidden="true">·</span>
				<Link
					to="/tasks/waiting"
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
								queue.refresh();
								calendar.refresh();
								mail.refresh();
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
