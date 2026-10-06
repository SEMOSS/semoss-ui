import { CircleCheck } from "lucide-react";
import { Link } from "react-router";
import { Button, P } from "@semoss/ui/next";
import { selectWorkItems } from "@/features/collaboration/state/collaboration.selectors";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { BriefPanel } from "./brief-panel";

/** A compact history with explicit reopen, rather than a global undo of unrelated work. */
export function BriefHandled({ topicId }: { topicId?: string }) {
	const { state, dispatch } = useCollaborationSession();
	const items = selectWorkItems(state, {
		view: "done_today",
		topicId,
	}).items.sort((left, right) =>
		(right.completedAt ?? right.received).localeCompare(
			left.completedAt ?? left.received,
		),
	);
	return (
		<BriefPanel title="Handled" detail={`${items.length} completed`}>
			{items.length ? (
				<ul className="divide-y">
					{items.slice(0, 4).map((item) => (
						<li
							key={item.id}
							className="flex items-start gap-3 py-3 first:pt-0"
						>
							<CircleCheck
								aria-hidden="true"
								className="mt-1 size-4 shrink-0 text-muted-foreground"
							/>
							<div className="min-w-0 flex-1">
								<Link
									to={`/work/thread/${encodeURIComponent(item.threadId)}`}
									className="block truncate text-sm hover:underline"
									title={item.title}
								>
									{item.title}
								</Link>
								<P className="mt-1 truncate font-mono text-muted-foreground text-xs">
									{item.closedReason === "no_response_needed"
										? "no response needed"
										: "completed"}
									{item.completedAt
										? ` · ${new Date(item.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
										: ""}
								</P>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-1 font-mono font-normal text-muted-foreground text-xs"
								aria-label={`Undo: reopen ${item.title}`}
								onClick={() =>
									dispatch({
										type: "item.update",
										itemId: item.id,
										changes: { status: "open" },
									})
								}
							>
								undo
							</Button>
						</li>
					))}
				</ul>
			) : (
				<P className="py-4 text-muted-foreground text-sm">
					Completed work will appear here.
				</P>
			)}
			{items.length > 0 && (
				<Link
					to="/work/done"
					className="mt-3 inline-flex border-b pb-1 font-mono text-sm hover:text-muted-foreground"
				>
					See all {items.length} →
				</Link>
			)}
		</BriefPanel>
	);
}
