import { useLocation } from "react-router";
import { WorkFeed } from "@/features/collaboration/components/work-feed";
import { WorkTopics } from "@/features/collaboration/components/work-topics";

/** Topic discovery and the complete action list share the Work entry point. */
export function WorkPage() {
	const { pathname } = useLocation();
	const path = pathname.replace(/\/$/, "");
	if (path === "/work") return <WorkTopics />;
	const initialFilter = path.endsWith("/waiting")
		? "waiting"
		: path.endsWith("/done")
			? "done"
			: "needs_me";
	return <WorkFeed initialFilter={initialFilter} />;
}
