import { Link } from "react-router";
import { WorkItems } from "@/features/collaboration/components/work-items-list";
import { BriefPanel } from "./brief-panel";

/** Today's view of Work: the owner's top work items, not a list of mail to answer (D25). */
export function BriefWork() {
	return (
		<BriefPanel
			title="Your work"
			detail={
				<Link to="/work" className="text-foreground hover:underline">
					All work items
				</Link>
			}
		>
			<WorkItems limit={6} />
		</BriefPanel>
	);
}
