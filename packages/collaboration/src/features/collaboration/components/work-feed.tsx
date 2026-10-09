import { Link } from "react-router";
import { Button } from "@semoss/ui/next";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { WorkItemsFeed, type WorkStatusFilter } from "./work-items-feed";

interface WorkFeedProps {
	/** Initial status for the full work list or a preserved status route. */
	initialFilter?: WorkStatusFilter;
	/** Preserve the scope from a saved status link. */
	topicId?: string;
	/** Preserve search from a saved status link. */
	search?: string;
}

/** All loaded work, separate from the topic index and global landing overview. */
export function WorkFeed({
	initialFilter = "needs_me",
	topicId,
	search,
}: WorkFeedProps) {
	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					layoutClassName="flex-col sm:flex-row"
					title={
						initialFilter === "waiting"
							? "Waiting on others"
							: initialFilter === "done"
								? "Handled"
								: "Actions"
					}
					description="Review the status and source of your existing actions."
					actions={
						<Button
							asChild
							variant="outline"
							size="sm"
							className="pointer-coarse:min-h-11"
						>
							<Link to="/for-you">Back to For you</Link>
						</Button>
					}
				/>
			}
		>
			<WorkItemsFeed
				key={initialFilter}
				initialFilter={initialFilter}
				topicId={topicId}
				search={search}
			/>
		</CollaborationSurface>
	);
}
