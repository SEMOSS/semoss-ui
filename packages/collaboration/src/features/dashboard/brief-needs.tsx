import { CheckCheck } from "lucide-react";
import { Link } from "react-router";
import { Button, H2, P } from "@semoss/ui/next";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import { selectWorkItems } from "@/features/collaboration/state/collaboration.selectors";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { lexicon } from "@/lib/lexicon";
import { BriefActionCard } from "./brief-action-card";
import { DashboardResourceStatus } from "./dashboard-resource-status";
import { selectToday } from "./today-selectors";

/** A short list of what to do today; the full queue stays behind See everything. */
export function BriefNeeds() {
	const { state } = useCollaborationSession();
	const updates = useWorkUpdates();
	const { items, total } = selectToday(state);
	const done = selectWorkItems(state, { view: "done_today" }).total;
	return (
		<section aria-label={lexicon.doToday} className="min-w-0">
			<header className="mb-3 flex min-h-8 items-center justify-between gap-2 px-1">
				<H2 className="font-display font-semibold text-lg">
					{lexicon.doToday}
				</H2>
				<div className="flex items-center gap-3 text-sm">
					{done > 0 && (
						<Link
							to="/work/done"
							className="text-muted-foreground hover:text-foreground hover:underline"
						>
							{done} done
						</Link>
					)}
					<Link
						to="/work/all"
						className="text-foreground hover:underline"
					>
						{lexicon.everything}
						{total > items.length ? ` (${total})` : ""}
					</Link>
				</div>
			</header>
			<DashboardResourceStatus
				error={updates?.error}
				loading={updates?.isRefreshing && !state.items.length}
				onRetry={updates?.refresh}
			/>
			{items.length > 0 && (
				<div className="overflow-hidden rounded-xl border bg-card">
					{items.map((item) => (
						<BriefActionCard key={item.id} item={item} />
					))}
				</div>
			)}
			{!items.length && !updates?.isRefreshing && !updates?.error && (
				<div className="rounded-xl border bg-card p-6">
					<CheckCheck
						aria-hidden="true"
						className="mb-3 size-6 text-muted-foreground"
					/>
					<P className="mb-4 text-sm">
						You're all caught up. Nothing needs you right now.
					</P>
					<Button
						asChild
						size="sm"
						variant="outline"
						className="pointer-coarse:min-h-11"
					>
						<Link to="/work/waiting">
							See who you're waiting on
						</Link>
					</Button>
				</div>
			)}
		</section>
	);
}
