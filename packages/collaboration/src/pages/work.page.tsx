import { Navigate, useLocation, useParams } from "react-router";
import { TopicWork } from "@/features/collaboration/components/topic-work";
import { WorkFeed } from "@/features/collaboration/components/work-feed";
import { WorkTopics } from "@/features/collaboration/components/work-topics";

/** Preserve topic workspaces and status bookmarks while moving the queue to For you. */
export function WorkPage() {
	const { topicId } = useParams();
	const { pathname, search, hash } = useLocation();
	const path = pathname.replace(/\/$/, "");
	const params = new URLSearchParams(search);
	if (topicId) return <TopicWork key={topicId} topicId={topicId} />;
	if (path.endsWith("/topics")) return <WorkTopics />;
	const routeStatus = path.endsWith("/waiting")
		? "waiting"
		: path.endsWith("/done")
			? "done"
			: null;
	const queryStatus = params.get("status");
	const status =
		routeStatus ??
		(queryStatus === "waiting" || queryStatus === "done"
			? queryStatus
			: null);
	params.delete("status");
	const destination = status ? `/tasks/${status}` : "/for-you";
	if (path !== destination) {
		return (
			<Navigate
				replace
				to={{
					pathname: destination,
					search: params.toString() ? `?${params}` : "",
					hash,
				}}
			/>
		);
	}
	return (
		<WorkFeed
			key={`${status}:${params.get("topic") ?? ""}`}
			initialFilter={status ?? "needs_me"}
			topicId={params.get("topic") || undefined}
			search={params.get("q") || undefined}
		/>
	);
}
