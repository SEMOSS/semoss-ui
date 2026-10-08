import type { ReactNode } from "react";
import { cn } from "@semoss/ui/next";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { roomWorkbenchTriggerId } from "../room-workbench-trigger-id";
import type { RoomViewProps } from "../types/room";
import { RoomHeader } from "./room-header";
import { RoomThread } from "./room-thread";

interface RoomConversationProps {
	agent: AgentConfiguration;
	title: string;
	conversationId: string;
	thread: RoomViewProps["thread"];
	isLoadingHistory: boolean;
	phase: RoomViewProps["phase"];
	hasObservationIssue: boolean;
	resumeSignal: number;
	isToolWorkbenchOpen: boolean;
	showToolWorkbench?: boolean;
	onToggleToolWorkbench: () => void;
	/** Thread-specific actions retain their existing owners and permissions. */
	headerActions?: ReactNode;
	/** The chat's topic chips, beside its title. */
	headerTopics?: ReactNode;
	transcriptActions?: ReactNode;
	status: ReactNode;
	composer: ReactNode;
	/** Keep the editor mounted as the welcome screen becomes a conversation. */
	isLanding?: boolean;
	isHidden?: boolean;
}

/** Shared room view for direct rooms, saved chats, and source threads. */
export function RoomConversation({
	agent,
	title,
	conversationId,
	thread,
	isLoadingHistory,
	phase,
	hasObservationIssue,
	resumeSignal,
	isToolWorkbenchOpen,
	showToolWorkbench = true,
	onToggleToolWorkbench,
	headerActions,
	headerTopics,
	transcriptActions,
	status,
	composer,
	isLanding = false,
	isHidden = false,
}: RoomConversationProps) {
	return (
		<section
			hidden={isHidden}
			aria-label="Communication thread"
			className={cn(
				"@container/conversation size-full min-h-0 min-w-0 flex-col",
				isHidden ? "hidden" : "flex",
				isLanding && "overflow-y-auto",
			)}
		>
			{!isLanding && (
				<RoomHeader
					agent={agent}
					title={title}
					isToolWorkbenchOpen={isToolWorkbenchOpen}
					showToolWorkbench={showToolWorkbench}
					workbenchTriggerId={roomWorkbenchTriggerId(conversationId)}
					onToggleToolWorkbench={onToggleToolWorkbench}
					actions={headerActions}
					topics={headerTopics}
				/>
			)}
			<div
				hidden={isLanding}
				className={
					isLanding ? "hidden" : "flex min-h-0 flex-1 flex-col"
				}
			>
				<RoomThread
					agent={agent}
					thread={thread}
					isLoadingHistory={isLoadingHistory}
					roomId={conversationId}
					resumeSignal={resumeSignal}
					phase={phase}
					hasObservationIssue={hasObservationIssue}
				>
					{transcriptActions}
				</RoomThread>
			</div>
			{status}
			<div
				className={cn(
					"shrink-0",
					isLanding
						? "my-auto w-full px-1 py-6"
						: "px-4 pt-2 pb-4 sm:px-5 lg:px-7",
				)}
			>
				<div className="mx-auto w-full max-w-3xl">{composer}</div>
			</div>
		</section>
	);
}
