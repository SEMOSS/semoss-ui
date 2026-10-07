import { Small } from "@semoss/ui/next";
import { ThreadPresentation } from "@/features/work-thread/thread-presentation";
import type {
	Thread,
	ThreadContext,
	ThreadWorkspace,
} from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { ThreadActionItems } from "./thread-action-items";
import { ThreadMemory } from "./thread-memory";
import { ThreadSettings } from "./thread-settings";
import { ThreadSummary } from "./thread-summary";
import { TopicChip } from "./topic-chip";

/** Thread insights, with source controls kept separate from the email reader. */
export function ThreadInspector({
	thread,
	workspace,
	context,
}: {
	thread: Thread;
	workspace: ThreadWorkspace;
	context: ThreadContext;
}) {
	const { state } = useCollaborationSession();
	return (
		<div className="space-y-6">
			<ThreadSummary thread={thread} workspace={workspace} />
			<ThreadActionItems thread={thread} workspace={workspace} />
			<ThreadPresentation />
			<ThreadMemory thread={thread} />
			<details className="space-y-3">
				<summary className="min-h-9 cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-ring">
					Sources
					<Small className="block font-normal text-muted-foreground">
						{context.messages.length} included ·{" "}
						{context.hiddenCount} excluded messages
					</Small>
				</summary>
				<div className="space-y-4">
					{thread.topicLinks.length > 0 && (
						<fieldset
							className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0"
							aria-label="Thread topics"
						>
							{thread.topicLinks.map((link) => {
								const topic = state.topics.find(
									(item) => item.id === link.topicId,
								);
								return topic ? (
									<TopicChip
										key={topic.id}
										topic={topic}
										suggested={link.source === "suggested"}
									/>
								) : null;
							})}
						</fieldset>
					)}
					<ThreadSettings thread={thread} sections={["people"]} />
				</div>
			</details>
		</div>
	);
}
