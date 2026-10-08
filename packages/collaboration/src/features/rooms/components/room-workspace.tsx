import { Brain, Mail, PanelRightOpen, Settings2, X } from "lucide-react";
import { useContext, useEffect, useId, useState } from "react";
import {
	Button,
	cn,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	toast,
} from "@semoss/ui/next";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import {
	guessMemoryKind,
	rememberCommand,
} from "@/features/collaboration/state/memory";
import { RoomEmailContext } from "@/features/room-email/room-email.context";
import { ToolWorkbench } from "@/features/tools/components/tool-workbench";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import type { Session } from "@/types/session";
import type { ComposerSubmission, RoomViewProps } from "../types/room";
import { RoomComposer } from "./room-composer";
import type { RoomSlashCommand } from "./room-composer-slash-plugin";
import { RoomConversation } from "./room-conversation";
import { RoomRunStatus } from "./room-run-status";
import { ROOM_SETTINGS_PANEL_TYPE } from "./room-settings-panel";

const ROOM_WORKSPACE_LAYOUT_ID = "collaboration-room-workspace-v1";
const CONVERSATION_PANEL_ID = "collaboration-room-conversation";
const TOOL_WORKBENCH_PANEL_ID = "collaboration-room-tool-workbench";

// typed out rather than run: the sentence after it is saved on send
const REMEMBER_COMMANDS: readonly RoomSlashCommand[] = [
	{
		id: "remember",
		label: "/remember",
		description: "Save the sentence you type to memory",
		icon: Brain,
		insertText: "/remember ",
		onSelect: () => undefined,
	},
];

interface RoomWorkspaceProps {
	roomSession?: RoomViewProps["roomSession"];
	roomSnapshot?: RoomViewProps["roomSnapshot"];
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
	roomSession,
	roomSnapshot,
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
	const roomEmail = useContext(RoomEmailContext);
	// /remember saves a memory as the owner's own, with no model call
	const memorySession = useOptionalCollaborationSession();
	const {
		isOpen: isToolWorkbenchOpen,
		store,
		openWorkbench,
		closeWorkbench,
	} = useToolWorkbench();
	const [resumeSignal, setResumeSignal] = useState(0);
	const actionsTriggerId = useId();
	const [hasOpenedWorkbench, setHasOpenedWorkbench] =
		useState(isToolWorkbenchOpen);
	useEffect(() => {
		if (isToolWorkbenchOpen) setHasOpenedWorkbench(true);
	}, [isToolWorkbenchOpen]);

	function openSettings() {
		store
			.getState()
			.layout.actions.selectPanel(ROOM_SETTINGS_PANEL_TYPE, {});
		openWorkbench(undefined, actionsTriggerId);
	}

	function toggleToolWorkbench() {
		if (isToolWorkbenchOpen) {
			closeWorkbench();
			return;
		}
		openWorkbench();
	}

	function handleSend(submission: ComposerSubmission): Promise<void> {
		const remembered = memorySession
			? rememberCommand(submission.text)
			: null;
		if (memorySession && remembered && !submission.files.length) {
			memorySession.dispatch({
				type: "memory.save",
				memory: {
					kind: guessMemoryKind(remembered),
					text: remembered,
					isSample: roomSnapshot?.source?.kind === "sample",
				},
			});
			toast.success("Saved to memory", { description: remembered });
			return Promise.resolve();
		}
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
						<>
							{roomSnapshot?.hasUnconfirmedSubmission && (
								<output className="flex items-center gap-3 border-t px-5 py-3 text-sm">
									<span>
										Reconnect to check whether your last
										message was received before sending
										again.
									</span>
									<Button
										type="button"
										variant="outline"
										disabled={isSending}
										onClick={() => void onReconnect()}
									>
										Reconnect
									</Button>
								</output>
							)}
							{roomSnapshot?.submissionNotice && (
								<output className="block px-5 py-2 text-sm">
									{roomSnapshot.submissionNotice}
								</output>
							)}
							<RoomRunStatus
								agent={agent}
								turnError={turnError}
								transportError={transportError}
								pendingApprovals={pendingApprovals}
								onReconnect={onReconnect}
							/>
						</>
					}
					composer={
						<RoomComposer
							key={`${session.id}:${roomSnapshot?.composerResetKey ?? 0}`}
							initialDraft={roomSnapshot?.composerDraft}
							onDraftChange={roomSession?.setComposerDraft}
							retainUntilSent
							extraCommands={
								memorySession ? REMEMBER_COMMANDS : undefined
							}
							actionsTriggerId={actionsTriggerId}
							hideSettingsAction={showToolWorkbench}
							panelActions={
								showToolWorkbench
									? [
											...(roomEmail?.hasSourceEmail
												? [
														{
															id: "source-email",
															label: "View email",
															icon: Mail,
															onSelect: () =>
																roomEmail.openSource(
																	actionsTriggerId,
																),
														},
													]
												: []),
											{
												id: "settings",
												label: "Settings",
												icon: Settings2,
												onSelect: openSettings,
											},
											{
												id: "workbench",
												label: "Open workbench",
												icon: PanelRightOpen,
												onSelect: () =>
													openWorkbench(
														undefined,
														actionsTriggerId,
													),
											},
										]
									: undefined
							}
							submissionError={
								roomSnapshot?.submissionError ||
								roomSnapshot?.settingsError ||
								undefined
							}
							isSendDisabled={Boolean(
								roomSnapshot?.hasUnconfirmedSubmission ||
									roomSnapshot?.settingsError ||
									roomSnapshot?.modelError,
							)}
							attachmentSummary={roomSnapshot?.contextFiles.map(
								(file) => (
									<div
										key={file.fileLocation}
										className="flex items-center gap-2 rounded-md border px-3 py-1 text-sm"
									>
										<span className="min-w-0 flex-1 truncate">
											{file.fileName}
										</span>
										<Button
											type="button"
											variant="ghost"
											size="icon-sm"
											aria-label={`Remove ${file.fileName} from context`}
											disabled={isSending || isRunning}
											onClick={() =>
												roomSession?.removeContextFile(
													file.fileLocation,
												)
											}
										>
											<X aria-hidden="true" />
										</Button>
									</div>
								),
							)}
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
			{showToolWorkbench &&
				(isToolWorkbenchOpen || hasOpenedWorkbench) && (
					<>
						<ResizableHandle
							aria-label="Resize tool workbench"
							className={cn(
								"hidden bg-transparent transition-colors focus-visible:bg-border data-[resize-handle-state=drag]:bg-border data-[resize-handle-state=hover]:bg-border",
								isToolWorkbenchOpen && "md:flex",
							)}
						/>
						<ResizablePanel
							id={TOOL_WORKBENCH_PANEL_ID}
							order={2}
							defaultSize={65}
							minSize={20}
							maxSize={80}
							className={cn(
								"min-h-0 min-w-0",
								!isToolWorkbenchOpen && "hidden",
							)}
						>
							<aside
								hidden={!isToolWorkbenchOpen}
								aria-label="Tool workbench"
								className="relative size-full min-h-0 bg-background"
							>
								<ToolWorkbench onOpenSettings={openSettings} />
							</aside>
						</ResizablePanel>
					</>
				)}
		</ResizablePanelGroup>
	);
}
