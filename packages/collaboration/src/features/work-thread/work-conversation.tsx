import { ArrowDown } from "lucide-react";
import type { ReactNode } from "react";
import { Button, P, Small } from "@semoss/ui/next";
import { ThreadMessage } from "@/features/collaboration/components/thread-message";
import type { Thread } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { MessageActivityPart } from "@/features/messages/components/message-activity-part";
import { MessageTimelineEntry } from "@/features/messages/components/message-timeline-entry";
import { useFollowScroll } from "@/features/messages/hooks/use-follow-scroll";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { WorkConversationGroup } from "./work-conversation-group";
import { groupWorkTimeline, type WorkTimelineEntry } from "./work-timeline";

export const WORK_ASSISTANT = {
	name: "Assistant",
	description: "",
	system_prompt: "",
	mcp: [],
	skills: [],
	prompts: [],
};

/** Source replies and assistant turns share one chronological, stable scroll area. */
export function WorkConversation({
	thread,
	entries,
	allowedSources,
	resumeSignal,
	turn,
	actions,
	showAssistant = true,
}: {
	actions?: ReactNode;
	showAssistant?: boolean;
	thread: Thread;
	entries: WorkTimelineEntry[];
	allowedSources: Set<string>;
	resumeSignal: number;
	turn: ReturnType<ThreadSession["getSnapshot"]>["turn"];
}) {
	const { state } = useCollaborationSession();
	const scroll = useFollowScroll({ resetKey: thread.id, resumeSignal });
	const groups = groupWorkTimeline(entries);
	const lastAssistantGroup = groups
		.filter((group) => group.kind === "assistant")
		.at(-1);
	const hasSources = entries.some((entry) => entry.kind === "source");
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
				className="min-h-0 flex-1 overflow-y-auto p-4 focus-visible:outline-2 focus-visible:outline-ring"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: the transcript supports keyboard scrolling
				tabIndex={0}
			>
				<div
					ref={scroll.contentRef}
					className="mx-auto flex w-full max-w-3xl flex-col gap-4"
				>
					{!hasSources && (
						<WorkConversationGroup
							kind="source"
							channel={thread.channel}
							count={0}
						>
							<P className="p-4 text-muted-foreground text-sm leading-6">
								No source messages are available.
							</P>
						</WorkConversationGroup>
					)}
					{groups.map((group) => (
						<WorkConversationGroup
							key={`${thread.id}:${group.id}`}
							anchorId={group.id}
							kind={group.kind}
							channel={thread.channel}
							count={group.entries.length}
						>
							{group.entries.map((entry) => {
								if (entry.kind === "assistant") {
									return (
										<div
											key={entry.id}
											data-scroll-anchor={entry.id}
											className="min-w-0"
										>
											{entry.presentation.message.role ===
												"user" && (
												<Small className="mb-2 block text-end text-muted-foreground">
													You
												</Small>
											)}
											<MessageTimelineEntry
												message={
													entry.presentation.message
												}
												parts={entry.presentation.parts}
												createdAt={
													entry.presentation.createdAt
												}
												agent={WORK_ASSISTANT}
												userMessageTone="muted"
											/>
										</div>
									);
								}
								const person = state.people.find(
									(candidate) =>
										candidate.id === entry.message.fromId,
								);
								return (
									<div
										key={entry.id}
										data-scroll-anchor={entry.id}
										className="min-w-0 p-4"
									>
										<ThreadMessage
											message={entry.message}
											name={
												person?.name ??
												thread.participants.find(
													(participant) =>
														participant.personId ===
														entry.message.fromId,
												)?.name ??
												"Participant"
											}
											initials={person?.initials}
											channel={thread.channel}
											isIncluded={allowedSources.has(
												entry.message.id,
											)}
											isEmpty={!entry.message.text}
										/>
									</div>
								);
							})}
							{group.id === lastAssistantGroup?.id && activity}
						</WorkConversationGroup>
					))}
					{actions}
					{hasAssistant && !hasConversation && (
						<WorkConversationGroup
							kind="assistant"
							channel={thread.channel}
							count={0}
						>
							<P className="text-muted-foreground text-sm leading-6">
								Ask a question or work on a reply.
							</P>
							{activity}
						</WorkConversationGroup>
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
