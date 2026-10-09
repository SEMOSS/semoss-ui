import { useCollaborationResource } from "@/features/collaboration/live/work-updates.context";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";

/** Topic data is cached in the account session and loaded only for the selected tab. */
export function useTopicWork(topicId: string, tab = "overview") {
	const { state } = useCollaborationSession();
	const sample =
		state.topics.find((topic) => topic.id === topicId)?.isSample === true;
	const detail = useCollaborationResource(`topic:${topicId}`, !sample);
	const tasks = useCollaborationResource(
		`topic-work:${topicId}`,
		!sample && tab === "overview",
	);
	const context = useCollaborationResource(
		`topic-context:${topicId}`,
		!sample && tab === "context",
	);
	const selected =
		tab === "context" ? context : tab === "overview" ? tasks : detail;
	return {
		items: state.items.filter(
			(item) =>
				item.topicIds.includes(topicId) || item.linkTopicId === topicId,
		),
		hasDetails: sample || detail.complete,
		isDetailLoading: !sample && detail.isLoading,
		isLoading: !sample && (detail.isLoading || selected.isLoading),
		error: detail.error || selected.error || null,
		isComplete:
			sample ||
			(detail.complete &&
				selected.complete &&
				!detail.error &&
				!selected.error),
		refresh: () => {
			detail.refresh();
			if (tab === "context") context.refresh();
			else if (tab === "overview") tasks.refresh();
		},
	};
}
