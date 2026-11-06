import { Link, useParams } from "react-router";
import { Button } from "@semoss/ui/next";
import { CollaborationSurface } from "@/features/collaboration/components/collaboration-surface";
import { WorkItemDetails } from "@/features/collaboration/components/work-item-details";

/** Opens the shared work-item pane; entering the route never opens a chat implicitly. */
export function WorkItemPage() {
	const { taskId = "" } = useParams();
	return (
		<CollaborationSurface
			header={
				<div className="pb-4">
					<Button asChild variant="outline" size="sm">
						<Link to="/work">Back to Work</Link>
					</Button>
				</div>
			}
		>
			<WorkItemDetails key={taskId} taskId={taskId} />
		</CollaborationSurface>
	);
}
