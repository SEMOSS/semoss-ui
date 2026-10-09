import { Navigate, useLocation, useParams } from "react-router";
import { TopicWork } from "@/features/collaboration/components/topic-work";
import { WorkFeed } from "@/features/collaboration/components/work-feed";
import { WorkTopics } from "@/features/collaboration/components/work-topics";

/** Preserve legacy bookmarks while routing task entry points into their topics. */
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
	const selectedTopic = params.get("topic");
	const destination = status
		? `/tasks/${status}`
		: selectedTopic && selectedTopic !== "__none__"
			? `/tasks/topic/${encodeURIComponent(selectedTopic)}`
			: "/tasks/topics";
	if (!status) params.delete("topic");
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
