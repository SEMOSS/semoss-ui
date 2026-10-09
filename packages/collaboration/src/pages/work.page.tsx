import { Navigate, useLocation, useParams } from "react-router";
import { TopicWork } from "@/features/collaboration/components/topic-work";
import { WorkFeed } from "@/features/collaboration/components/work-feed";
import { WorkTopics } from "@/features/collaboration/components/work-topics";
import { useCollaborationResource } from "@/features/collaboration/live/work-updates.context";

/** Preserve legacy bookmarks while routing task entry points into their topics. */
export function WorkPage() {
	const { topicId } = useParams();
	const { pathname, search, hash } = useLocation();
	const path = pathname.replace(/\/$/, "");
	const params = new URLSearchParams(search);
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
	const selected = params.get("topic");
	const resource = useCollaborationResource(
		selected && selected !== "__none__"
			? `topic-work:${selected}`
			: "items",
		!!status && !topicId,
	);
	if (topicId) return <TopicWork key={topicId} topicId={topicId} />;
	if (path.endsWith("/topics")) return <WorkTopics />;
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
		<>
			{resource.isLoading && (
				<output className="block p-4">Loading tasks…</output>
			)}
			{resource.error && (
				<p role="alert" className="p-4">
					{resource.error}{" "}
					<button type="button" onClick={resource.refresh}>
						Retry
					</button>
				</p>
			)}
			<WorkFeed
				key={`${status}:${params.get("topic") ?? ""}`}
				initialFilter={status ?? "needs_me"}
				topicId={params.get("topic") || undefined}
				search={params.get("q") || undefined}
			/>
		</>
	);
}
