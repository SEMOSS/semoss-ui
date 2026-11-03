import { useLocation } from "react-router";
import { WorkFeed } from "@/features/collaboration/components/work-feed";
import { WorkItemsList } from "@/features/collaboration/components/work-items-list";
import { WorkTopics } from "@/features/collaboration/components/work-topics";

/** Work items lead (D25); topics and the old action list stay one link away. */
export function WorkPage() {
	const { pathname } = useLocation();
	const path = pathname.replace(/\/$/, "");
	if (path === "/work") return <WorkItemsList />;
	if (path === "/work/review") return <WorkItemsList review />;
	if (path === "/work/topics") return <WorkTopics />;
	const initialFilter = path.endsWith("/waiting")
		? "waiting"
		: path.endsWith("/done")
			? "done"
			: "needs_me";
	return <WorkFeed initialFilter={initialFilter} />;
}
