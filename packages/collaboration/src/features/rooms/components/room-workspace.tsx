import { useState } from "react";
import {
	cn,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@semoss/ui/next";
import { ToolWorkbench } from "@/features/tools/components/tool-workbench";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import type { Session } from "@/types/session";
import type { ComposerSubmission, RoomViewProps } from "../types/room";
import { RoomComposer } from "./room-composer";
import { RoomConversation } from "./room-conversation";
import { RoomRunStatus } from "./room-run-status";

const ROOM_WORKSPACE_LAYOUT_ID = "collaboration-room-workspace-v1";
const CONVERSATION_PANEL_ID = "collaboration-room-conversation";
const TOOL_WORKBENCH_PANEL_ID = "collaboration-room-tool-workbench";

interface RoomWorkspaceProps {
	agent: RoomViewProps["agent"];
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
	isModelLocked?: RoomViewProps["isModelLocked"];
	showToolWorkbench?: RoomViewProps["showToolWorkbench"];
	modelError: RoomViewProps["modelError"];
	roomInstructions: RoomViewProps["roomInstructions"];
	roomSettings: RoomViewProps["roomSettings"];
	onSendMessage: RoomViewProps["onSendMessage"];
	onModelChange: RoomViewProps["onModelChange"];
	onSaveRoomSettings: RoomViewProps["onSaveRoomSettings"];
	onOptimizePrompt: RoomViewProps["onOptimizePrompt"];
	onCancelTurn: RoomViewProps["onCancelTurn"];
	onReconnect: RoomViewProps["onReconnect"];
}

/** Conversation and its contextual tool dock. */
export function RoomWorkspace({
	agent,
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
	isModelLocked = false,
	showToolWorkbench = true,
	modelError,
	roomInstructions,
	roomSettings,
	onSendMessage,
	onModelChange,
	onSaveRoomSettings,
	onOptimizePrompt,
	onCancelTurn,
	onReconnect,
}: RoomWorkspaceProps) {
	const {
		isOpen: isToolWorkbenchOpen,
		activeToolId,
		openWorkbench,
		closeWorkbench,
	} = useToolWorkbench();
	const [resumeSignal, setResumeSignal] = useState(0);

	function toggleToolWorkbench() {
		if (isToolWorkbenchOpen) {
			closeWorkbench();
			return;
		}
		openWorkbench(activeToolId ?? undefined);
	}

	function handleSend(submission: ComposerSubmission): Promise<void> {
		setResumeSignal((value) => value + 1);
		return onSendMessage(submission);
	}

	return (
		<ResizablePanelGroup
			id={ROOM_WORKSPACE_LAYOUT_ID}
			autoSaveId={ROOM_WORKSPACE_LAYOUT_ID}
			direction="horizontal"
			keyboardResizeBy={5}
			className="min-h-0 min-w-0 flex-1"
		>
			<ResizablePanel
				id={CONVERSATION_PANEL_ID}
				order={1}
				defaultSize={35}
				minSize={20}
				className={cn(
					"min-h-0 min-w-0",
					showToolWorkbench &&
						isToolWorkbenchOpen &&
						"hidden md:block",
				)}
			>
				<RoomConversation
					agent={agent}
					title={session.title}
					conversationId={session.id}
					thread={thread}
					isLoadingHistory={isLoadingHistory}
					resumeSignal={resumeSignal}
					phase={phase}
					hasObservationIssue={Boolean(transportError)}
					isToolWorkbenchOpen={isToolWorkbenchOpen}
					showToolWorkbench={showToolWorkbench}
					onToggleToolWorkbench={toggleToolWorkbench}
					status={
						<RoomRunStatus
							agent={agent}
							turnError={turnError}
							transportError={transportError}
							pendingApprovals={pendingApprovals}
							onReconnect={onReconnect}
						/>
					}
					composer={
						<RoomComposer
							key={session.id}
							className="bg-transparent"
							agentName={agent.name}
							agent={agent}
							isSubmitting={isSending}
							isRunning={isRunning}
							isCancelling={isCancelling}
							modelId={modelId}
							modelName={modelName}
							isModelSaving={isModelSaving}
							isModelLocked={isModelLocked}
							modelError={modelError}
							roomInstructions={roomInstructions}
							roomSettings={roomSettings}
							inheritedMcp={agent.mcp}
							isSettingsDisabled={isModelSaving}
							onModelChange={onModelChange}
							onSaveRoomSettings={onSaveRoomSettings}
							onOptimizePrompt={onOptimizePrompt}
							onSend={handleSend}
							onStop={onCancelTurn}
						/>
					}
				/>
			</ResizablePanel>
			{showToolWorkbench && isToolWorkbenchOpen && (
				<>
					<ResizableHandle
						aria-label="Resize tool workbench"
						className="hidden bg-transparent transition-colors focus-visible:bg-border data-[resize-handle-state=drag]:bg-border data-[resize-handle-state=hover]:bg-border md:flex"
					/>
					<ResizablePanel
						id={TOOL_WORKBENCH_PANEL_ID}
						order={2}
						defaultSize={65}
						minSize={20}
						maxSize={80}
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
