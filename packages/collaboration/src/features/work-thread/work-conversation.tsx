import { ArrowDown } from "lucide-react";
import type { ReactNode } from "react";
import { Button, P } from "@semoss/ui/next";
import type { Thread } from "@/features/collaboration/state/collaboration.types";
import { MessageActivityPart } from "@/features/messages/components/message-activity-part";
import { MessageTimelineEntry } from "@/features/messages/components/message-timeline-entry";
import { useFollowScroll } from "@/features/messages/hooks/use-follow-scroll";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { WorkMessageAvatar } from "./work-message-avatar";
import type { WorkTimelineEntry } from "./work-timeline";

export const WORK_ASSISTANT = {
	name: "Assistant",
	description: "",
	system_prompt: "",
	mcp: [],
	skills: [],
	prompts: [],
};

/** Assistant turns have their own stable scroll area, independent of source history. */
export function WorkConversation({
	thread,
	entries,
	resumeSignal,
	turn,
	actions,
	showAssistant = true,
}: {
	actions?: ReactNode;
	showAssistant?: boolean;
	thread: Thread;
	entries: WorkTimelineEntry[];
	resumeSignal: number;
	turn: ReturnType<ThreadSession["getSnapshot"]>["turn"];
}) {
	const scroll = useFollowScroll({ resetKey: thread.id, resumeSignal });
	const hasConversation = entries.some((entry) => entry.kind === "assistant");
	const hasAssistant =
		showAssistant ||
		hasConversation ||
		turn.isRunning ||
		turn.pendingApprovals.length > 0;
	const activity = (
		<MessageActivityPart
			message={{
				id: "activity",
				role: "assistant",
				parts: [],
				...(turn.phase
					? {
							live: {
								phase: turn.phase,
								hasObservationIssue: Boolean(
									turn.transportError,
								),
							},
						}
					: {}),
			}}
		/>
	);
	return (
		<div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
			<section
				ref={scroll.viewportRef}
				aria-label="Conversation messages"
				className="min-h-0 flex-1 overflow-y-auto focus-visible:outline-2 focus-visible:outline-ring"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: the transcript supports keyboard scrolling
				tabIndex={0}
			>
				<div
					ref={scroll.contentRef}
					className="mx-auto flex w-full max-w-3xl flex-col gap-6 @md/conversation:px-6 px-4 py-6"
				>
					{entries.map((entry) => {
						if (entry.kind === "assistant")
							return (
								<div
									key={entry.id}
									data-scroll-anchor={entry.id}
									className="min-w-0"
								>
									<MessageTimelineEntry
										message={entry.presentation.message}
										parts={entry.presentation.parts}
										createdAt={entry.presentation.createdAt}
										agent={WORK_ASSISTANT}
										layout="bubbles"
										leadingVisual={
											<WorkMessageAvatar
												isUser={
													entry.presentation.message
														.role === "user"
												}
											/>
										}
									/>
								</div>
							);
						return null;
					})}
					{hasAssistant && activity}
					{actions}
					{hasAssistant && !hasConversation && (
						<P className="text-muted-foreground">
							Ask a question or work on a reply.
						</P>
					)}
				</div>
			</section>
			{!scroll.isFollowing && scroll.hasMoreBelow && (
				<Button
					variant="outline"
					size="sm"
					className="-translate-x-1/2 absolute bottom-2 left-1/2 shadow-sm"
					onClick={scroll.scrollToLatest}
				>
					<ArrowDown aria-hidden="true" />
					Latest activity
				</Button>
			)}
		</div>
	);
}
