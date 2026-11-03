import { Navigate, useLocation } from "react-router";
import { WorkItemsList } from "@/features/collaboration/components/work-items-list";
import { WorkTopics } from "@/features/collaboration/components/work-topics";

/** Work items lead (D25); topics stay one link away. */
export function WorkPage() {
	const { pathname } = useLocation();
	const path = pathname.replace(/\/$/, "");
	if (path === "/work") return <WorkItemsList />;
	if (path === "/work/review") return <WorkItemsList review />;
	if (path === "/work/topics") return <WorkTopics />;
	// retired feed paths land on the work items list
	return <Navigate to="/work" replace />;
}
