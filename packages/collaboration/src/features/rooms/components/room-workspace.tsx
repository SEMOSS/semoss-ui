import { useRef } from "react";
import { cn } from "@semoss/ui/next";
import { ToolWorkbench } from "@/features/tools/components/tool-workbench";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import type { Session } from "@/types/session";
import type { RoomViewProps } from "../types/room";
import { RoomComposer } from "./room-composer";
import { RoomHeader } from "./room-header";
import { RoomRunStatus } from "./room-run-status";
import { RoomThread } from "./room-thread";

interface RoomWorkspaceProps {
	agent: RoomViewProps["agent"];
	agentId: string;
	session: Session;
	thread: RoomViewProps["thread"];
	isSending: boolean;
	isRunning: boolean;
	isCancelling: RoomViewProps["isCancelling"];
	isLoadingHistory: boolean;
	turnError: string | null;
	transportError: Error | null;
	pendingApprovals: RoomViewProps["pendingApprovals"];
	phase: RoomViewProps["phase"];
	modelId: RoomViewProps["modelId"];
	modelName: RoomViewProps["modelName"];
	isModelSaving: RoomViewProps["isModelSaving"];
	modelError: RoomViewProps["modelError"];
	roomInstructions: RoomViewProps["roomInstructions"];
	onSendMessage: RoomViewProps["onSendMessage"];
	onModelChange: RoomViewProps["onModelChange"];
	onOptimizePrompt: RoomViewProps["onOptimizePrompt"];
	onCancelTurn: RoomViewProps["onCancelTurn"];
	onReconnect: RoomViewProps["onReconnect"];
	onConfigure: RoomViewProps["onConfigure"];
	onNewRoom: RoomViewProps["onNewRoom"];
}

/** Conversation and its contextual tool dock. */
export function RoomWorkspace({
	agent,
	agentId,
	session,
	thread,
	isSending,
	isRunning,
	isCancelling,
	isLoadingHistory,
	turnError,
	transportError,
	pendingApprovals,
	phase,
	modelId,
	modelName,
	isModelSaving,
	modelError,
	roomInstructions,
	onSendMessage,
	onModelChange,
	onOptimizePrompt,
	onCancelTurn,
	onReconnect,
	onConfigure,
	onNewRoom,
}: RoomWorkspaceProps) {
	const { isOpen: isToolWorkbenchOpen } = useToolWorkbench();
	const threadBottom = useRef<HTMLDivElement>(null);

	function scrollToLatest() {
		requestAnimationFrame(() =>
			threadBottom.current?.scrollIntoView({
				block: "end",
				behavior: "smooth",
			}),
		);
	}

	return (
		<div className="flex min-h-0 flex-1">
			<section
				className={cn(
					"min-w-0 flex-1 flex-col",
					isToolWorkbenchOpen ? "hidden md:flex" : "flex",
				)}
				aria-label="Communication thread"
			>
				<RoomHeader
					agent={agent}
					agentId={agentId}
					session={session}
					onConfigure={onConfigure}
					onNewRoom={onNewRoom}
				/>
				<RoomThread
					agent={agent}
					thread={thread}
					isLoadingHistory={isLoadingHistory}
					bottomRef={threadBottom}
				/>
				<RoomRunStatus
					agent={agent}
					turnError={turnError}
					transportError={transportError}
					pendingApprovals={pendingApprovals}
					phase={phase}
					onReconnect={onReconnect}
				/>
				<RoomComposer
					key={session.id}
					agentName={agent.name}
					isSubmitting={isSending}
					isRunning={isRunning}
					isCancelling={isCancelling}
					modelId={modelId}
					modelName={modelName}
					isModelSaving={isModelSaving}
					modelError={modelError}
					roomInstructions={roomInstructions}
					onModelChange={onModelChange}
					onOptimizePrompt={onOptimizePrompt}
					onSend={onSendMessage}
					onStop={onCancelTurn}
					onSent={scrollToLatest}
				/>
			</section>
			<aside
				aria-label="Tool workbench"
				className={cn(
					"relative min-h-0 border-s bg-background md:w-2/5 md:shrink-0",
					isToolWorkbenchOpen
						? "block flex-1 md:flex-none"
						: "hidden",
				)}
			>
				<ToolWorkbench />
			</aside>
		</div>
	);
}
