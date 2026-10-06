import { CheckCheck } from "lucide-react";
import { Link } from "react-router";
import { Button, cn, H2, P } from "@semoss/ui/next";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import { selectWorkItems } from "@/features/collaboration/state/collaboration.selectors";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { BriefActionCard } from "./brief-action-card";
import { DashboardResourceStatus } from "./dashboard-resource-status";

/** Fixed daily priorities, ordered by deadline then priority, with a distinct filtered-empty state. */
export function BriefNeeds({
	topicId,
	compact = false,
}: {
	topicId?: string;
	compact?: boolean;
}) {
	const { state } = useCollaborationSession();
	const updates = useWorkUpdates();
	const items = selectWorkItems(state, {
		view: "needs_me",
		topicId,
	}).items.sort(
		(left, right) =>
			(left.due ?? "9999").localeCompare(right.due ?? "9999") ||
			(left.priority ?? "P4").localeCompare(right.priority ?? "P4"),
	);
	return (
		<section aria-label="Needs you" className="min-w-0">
			<header
				className={cn(
					"mb-4 flex min-h-12 items-center justify-between gap-2 border-b px-1 pb-3",
					compact && "min-h-0 border-0 pb-0",
				)}
			>
				<H2 className="font-mono font-normal text-muted-foreground text-xs uppercase tracking-widest">
					Needs you{compact ? ` ${items.length}` : ""}
				</H2>
				{!compact && (
					<span className="font-mono text-muted-foreground text-xs">
						by deadline
					</span>
				)}
			</header>
			<DashboardResourceStatus
				error={updates?.error}
				loading={updates?.isRefreshing && !state.items.length}
				onRetry={updates?.refresh}
			/>
			<div
				className={cn(
					"space-y-3",
					compact &&
						items.length > 0 &&
						"space-y-0 overflow-hidden rounded-xl border bg-card",
				)}
			>
				{items.slice(0, compact ? 4 : 8).map((item, index) => (
					<BriefActionCard
						key={item.id}
						item={item}
						featured={index === 0}
						compact={compact}
					/>
				))}
			</div>
			{!items.length && !updates?.isRefreshing && !updates?.error && (
				<div className="rounded-xl border bg-card p-6">
					<CheckCheck
						aria-hidden="true"
						className="mb-3 size-6 text-muted-foreground"
					/>
					<P className="mb-4 text-sm">
						{topicId
							? "Nothing needs you in this topic."
							: "You're all caught up. Nothing needs you right now."}
					</P>
					<Button asChild size="sm" variant="outline">
						<Link to="/work/waiting">
							See who you're waiting on
						</Link>
					</Button>
				</div>
			)}
			{items.length > (compact ? 4 : 8) && (
				<Button
					asChild
					variant="link"
					className="mt-3 h-auto p-0 font-mono font-normal text-foreground text-sm"
				>
					<Link
						to={
							topicId
								? `/work/topic/${encodeURIComponent(topicId)}`
								: "/work"
						}
					>
						See all {items.length} →
					</Link>
				</Button>
			)}
		</section>
	);
}
