import { cn } from "@semoss/ui/next";
import type { WorkItem } from "@/features/collaboration/state/collaboration.types";
import { dashboardTimeZone } from "./dashboard-calendar";
import { dayKey } from "./dashboard-selectors";

/** Keeps urgency readable in words as well as the reference's small status marker. */
export function BriefDeadline({
	item,
	timeZone,
}: {
	item: WorkItem;
	timeZone: string;
}) {
	const zone = dashboardTimeZone(timeZone);
	const due = item.due ? new Date(item.due) : null;
	const validDue = due && Number.isFinite(due.getTime()) ? due : null;
	const today =
		validDue && dayKey(validDue, zone) === dayKey(new Date(), zone);
	const label = validDue
		? today
			? `before ${validDue.toLocaleTimeString(undefined, { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: false })}`
			: `due ${validDue.toLocaleDateString(undefined, { timeZone: zone, month: "short", day: "numeric" })}`
		: item.priority === "P0"
			? "urgent"
			: item.priority === "P1"
				? "high priority"
				: "no deadline";
	return (
		<span className="inline-flex shrink-0 items-center gap-2 font-mono text-muted-foreground text-xs">
			<span
				aria-hidden="true"
				className={cn(
					"size-1.5 rounded-full",
					item.priority === "P0" || item.priority === "P1"
						? "bg-destructive"
						: item.priority === "P2"
							? "bg-warning"
							: "bg-muted-foreground/60",
				)}
			/>
			{label}
		</span>
	);
}
