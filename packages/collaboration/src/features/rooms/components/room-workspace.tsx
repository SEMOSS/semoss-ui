import { useId, useRef } from "react";
import {
	cn,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@semoss/ui/next";
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
}: RoomWorkspaceProps) {
	const {
		isOpen: isToolWorkbenchOpen,
		activeToolId,
		openWorkbench,
		closeWorkbench,
	} = useToolWorkbench();
	const workspaceId = useId();
	const threadBottom = useRef<HTMLDivElement>(null);

	function toggleToolWorkbench() {
		if (isToolWorkbenchOpen) {
			closeWorkbench();
			return;
		}
		if (activeToolId) openWorkbench(activeToolId);
	}

	function scrollToLatest() {
		requestAnimationFrame(() =>
			threadBottom.current?.scrollIntoView({
				block: "end",
				behavior: "smooth",
			}),
		);
	}

	return (
		<ResizablePanelGroup
			direction="horizontal"
			keyboardResizeBy={5}
			className="min-h-0 min-w-0 flex-1"
		>
			<ResizablePanel
				id={`${workspaceId}-conversation`}
				order={1}
				minSize={40}
				className={cn(
					"min-h-0 min-w-0",
					isToolWorkbenchOpen && "hidden md:block",
				)}
			>
				<section
					className="flex size-full min-h-0 min-w-0 flex-col"
					aria-label="Communication thread"
				>
					<RoomHeader
						agent={agent}
						agentId={agentId}
						session={session}
						isToolWorkbenchOpen={isToolWorkbenchOpen}
						canToggleToolWorkbench={activeToolId !== null}
						onToggleToolWorkbench={toggleToolWorkbench}
						onConfigure={onConfigure}
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
			</ResizablePanel>
			{isToolWorkbenchOpen && (
				<>
					<ResizableHandle
						aria-label="Resize tool workbench"
						className="hidden bg-transparent transition-colors focus-visible:bg-border data-[resize-handle-state=drag]:bg-border data-[resize-handle-state=hover]:bg-border md:flex"
					/>
					<ResizablePanel
						id={`${workspaceId}-tool-workbench`}
						order={2}
						defaultSize={30}
						minSize={20}
						maxSize={60}
						className="min-h-0 min-w-0"
					>
						<aside
							aria-label="Tool workbench"
							className="relative size-full min-h-0 bg-background"
						>
							<ToolWorkbench />
						</aside>
					</ResizablePanel>
				</>
			)}
		</ResizablePanelGroup>
	);
}
