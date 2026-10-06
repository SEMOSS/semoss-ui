import { ArrowDown, ShieldCheck } from "lucide-react";
import { Fragment, useContext } from "react";
import { Button, Muted, Separator, Spinner } from "@semoss/ui/next";
import { EmptyView } from "@/components/common/empty-view";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { MessageActivityPart } from "@/features/messages/components/message-activity-part";
import { MessageTimelineEntry } from "@/features/messages/components/message-timeline-entry";
import { useFollowScroll } from "@/features/messages/hooks/use-follow-scroll";
import type {
	ConversationMessage,
	PlaygroundTurnPhase,
} from "@/features/messages/types/message";
import { formatMessageDay } from "@/features/messages/utils/message-metadata";
import { presentMessages } from "@/features/messages/utils/message-presentation";
import { ToolWorkbenchContext } from "@/features/tools/tool-workbench.context";

/** Scrollable Playground-style transcript with loading and empty states. */
export function RoomThread({
	agent,
	thread,
	isLoadingHistory,
	roomId,
	resumeSignal = 0,
	phase = null,
	hasObservationIssue = false,
}: {
	agent: AgentConfiguration;
	thread: ConversationMessage[];
	isLoadingHistory: boolean;
	roomId: string;
	resumeSignal?: number;
	phase?: PlaygroundTurnPhase | null;
	hasObservationIssue?: boolean;
}) {
	const scroll = useFollowScroll({ resetKey: roomId, resumeSignal });
	const workbench = useContext(ToolWorkbenchContext);
	const entries = presentMessages(thread, workbench?.tools);
	const latestMessage = thread.at(-1);
	const liveMessage = latestMessage?.live ? latestMessage : undefined;
	const activityMessage: ConversationMessage = {
		id: "activity",
		role: "assistant",
		parts:
			liveMessage?.parts.map((part) =>
				part.type === "tool"
					? {
							...part,
							tool: workbench?.tools[part.tool.id] ?? part.tool,
						}
					: part,
			) ?? [],
		live: phase ? { phase, hasObservationIssue } : liveMessage?.live,
	};

	return (
		<div className="relative min-h-0 flex-1 overflow-hidden">
			<section
				className="focus-visible:-outline-offset-2 size-full overflow-y-auto px-4 py-4 focus-visible:outline-2 focus-visible:outline-ring sm:px-5 lg:px-7"
				ref={scroll.viewportRef}
				aria-label="Conversation messages"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: transcript must support keyboard scrolling
				tabIndex={0}
			>
				<div
					ref={scroll.contentRef}
					className="mx-auto flex w-full max-w-3xl flex-col"
				>
					{thread.length === 0 && isLoadingHistory && (
						<output className="flex items-center justify-center gap-2 px-5 py-12 text-muted-foreground">
							<Spinner
								aria-hidden="true"
								className="size-4 motion-reduce:animate-none"
							/>
							<Muted className="text-base">
								Loading this conversation…
							</Muted>
						</output>
					)}
					{thread.length === 0 && !isLoadingHistory && (
						<EmptyView
							title={`A fresh start with ${agent.name}`}
							action={
								<Muted className="flex items-center gap-2 text-base">
									<ShieldCheck
										aria-hidden="true"
										className="size-4"
									/>
									No previous conversation included
								</Muted>
							}
						>
							What would you like to work on?
						</EmptyView>
					)}
					{entries.map(
						({ message, parts, createdAt, dateSeparator }) => {
							return (
								<Fragment key={message.id}>
									{dateSeparator && (
										<div
											className="mt-6 flex items-center gap-4"
											data-scroll-anchor={`day-${message.id}`}
										>
											<Separator className="flex-1 bg-border/50" />
											<time
												dateTime={dateSeparator}
												className="text-muted-foreground text-xs"
											>
												{formatMessageDay(
													dateSeparator,
												)}
											</time>
											<Separator className="flex-1 bg-border/50" />
										</div>
									)}
									<MessageTimelineEntry
										message={message}
										parts={parts}
										agent={agent}
										createdAt={createdAt}
									/>
								</Fragment>
							);
						},
					)}
					<div className="min-h-10 pt-2">
						<MessageActivityPart message={activityMessage} />
					</div>
				</div>
			</section>
			{!scroll.isFollowing && scroll.hasMoreBelow && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={scroll.scrollToLatest}
					className="-translate-x-1/2 absolute bottom-2 left-1/2 shadow-sm"
				>
					<ArrowDown aria-hidden="true" />
					Latest activity
				</Button>
			)}
		</div>
	);
}
