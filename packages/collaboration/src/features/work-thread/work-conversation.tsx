import { ArrowDown } from "lucide-react";
import type { ReactNode } from "react";
import { Button, cn, P } from "@semoss/ui/next";
import { ThreadMessage } from "@/features/collaboration/components/thread-message";
import type { Thread } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import type { EmailDraftEditor } from "@/features/connectors/api/email-draft-editor";
import { MessageActivityPart } from "@/features/messages/components/message-activity-part";
import { MessageTimelineEntry } from "@/features/messages/components/message-timeline-entry";
import { useFollowScroll } from "@/features/messages/hooks/use-follow-scroll";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { WorkDraftCard } from "./work-draft-card";
import { WorkEmailCard } from "./work-email-card";
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

/** Source replies and assistant turns share one chronological, stable scroll area. */
export function WorkConversation({
	thread,
	entries,
	allowedSources,
	resumeSignal,
	turn,
	actions,
	showAssistant = true,
	onOpenEmail,
	emailDrafts = [],
}: {
	onOpenEmail: (messageId: string, trigger: HTMLElement) => void;
	emailDrafts?: EmailDraftEditor[];
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
				className="min-h-0 flex-1 overflow-y-auto focus-visible:outline-2 focus-visible:outline-ring"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: the transcript supports keyboard scrolling
				tabIndex={0}
			>
				<div
					ref={scroll.contentRef}
					className="mx-auto flex w-full max-w-3xl flex-col gap-6 @md/conversation:px-6 px-4 py-6"
				>
					{!hasSources && (
						<P className="text-muted-foreground">
							No source messages are available.
						</P>
					)}
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
									{emailDrafts
										.filter(
											(draft) =>
												draft.seed.assistantMessageId &&
												[
													entry.presentation.message,
													...entry.presentation.parts.map(
														(part) => part.message,
													),
												].some(
													(message) =>
														(message.runId ||
															message.id) ===
														draft.seed
															.assistantMessageId,
												),
										)
										.map((draft) => (
											<div
												key={draft.seed.id}
												className="mt-3"
											>
												<WorkDraftCard draft={draft} />
											</div>
										))}
								</div>
							);
						const person = state.people.find(
							(candidate) =>
								candidate.id === entry.message.fromId,
						);
						const name =
							person?.name ??
							thread.participants.find(
								(participant) =>
									participant.personId ===
									entry.message.fromId,
							)?.name ??
							"Participant";
						return (
							<div
								key={entry.id}
								data-scroll-anchor={entry.id}
								className={cn(
									"min-w-0",
									thread.channel !== "email" &&
										"rounded-xl border border-border bg-card @md/conversation:p-6 p-4",
								)}
							>
								{thread.channel === "email" ? (
									<WorkEmailCard
										thread={thread}
										message={entry.message}
										name={name}
										initials={person?.initials}
										subject={thread.subject}
										isIncluded={allowedSources.has(
											entry.message.id,
										)}
										onOpen={onOpenEmail}
									/>
								) : (
									<ThreadMessage
										message={entry.message}
										name={name}
										initials={person?.initials}
										channel={thread.channel}
										isIncluded={allowedSources.has(
											entry.message.id,
										)}
										isEmpty={!entry.message.text}
										isFlat
									/>
								)}
							</div>
						);
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
