import { CheckCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@semoss/ui/next";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import { selectWorkItems } from "@/features/collaboration/state/collaboration.selectors";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { DashboardActionCard } from "./dashboard-action-card";
import type { DashboardWidget } from "./dashboard-layout";
import { DashboardResourceStatus } from "./dashboard-resource-status";
import { prioritizeItems } from "./dashboard-selectors";

/** Priorities and recency can be changed without mutating the underlying Work records. */
export function DashboardNeeds({ widget }: { widget: DashboardWidget }) {
	const { state } = useCollaborationSession();
	const updates = useWorkUpdates();
	const [sort, setSort] = useState<"priority" | "latest" | null>(null);
	const latest = sort ? sort === "latest" : widget.filter === "latest";
	const items = prioritizeItems(
		selectWorkItems(state, { view: "needs_me" }).items.filter(
			(item) =>
				widget.filter !== "urgent" ||
				item.priority === "P0" ||
				item.priority === "P1",
		),
		latest,
	);
	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-muted-foreground text-xs">
					{items.length} pending
				</p>
				<div className="flex rounded-lg bg-muted p-0.5">
					<Button
						variant={!latest ? "secondary" : "ghost"}
						size="sm"
						aria-pressed={!latest}
						onClick={() => setSort("priority")}
					>
						Priority
					</Button>
					<Button
						variant={latest ? "secondary" : "ghost"}
						size="sm"
						aria-pressed={latest}
						onClick={() => setSort("latest")}
					>
						Latest
					</Button>
				</div>
			</div>
			<DashboardResourceStatus
				error={updates?.error}
				loading={updates?.isRefreshing && !state.items.length}
				onRetry={updates?.refresh}
			/>
			{items.map((item, index) => (
				<DashboardActionCard
					key={item.id}
					item={item}
					featured={index === 0}
				/>
			))}
			{!items.length && !updates?.isRefreshing && (
				<div className="space-y-3 py-8 text-muted-foreground text-sm">
					<CheckCheck
						aria-hidden="true"
						className="size-6 text-primary"
					/>
					<p>
						{widget.filter === "urgent"
							? "No urgent actions in your available conversations."
							: "No pending decisions in your available conversations."}
					</p>
					<Button asChild variant="outline" size="sm">
						<Link to="/tasks/waiting">Waiting on others</Link>
					</Button>
				</div>
			)}
			<div className="flex flex-wrap gap-3 text-muted-foreground text-xs">
				<Link className="hover:underline" to="/tasks/waiting">
					Waiting on others
				</Link>
				<Link className="hover:underline" to="/tasks/done">
					Handled
				</Link>
				{state.items.length >= 5000 && (
					<span>Showing the first 5,000 imported items</span>
				)}
			</div>
		</div>
	);
}
