import { PanelRightClose, PanelRightOpen, Settings2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	Spinner,
} from "@semoss/ui/next";
import { BriefContextRail } from "@/features/dashboard/brief-context-rail";
import { optimizePrompt } from "@/features/rooms/api/optimize-prompt";
import { RoomComposer } from "@/features/rooms/components/room-composer";
import { ROOM_SETTINGS_PANEL_TYPE } from "@/features/rooms/components/room-settings-panel";
import type {
	RoomSession,
	RoomSessionSnapshot,
} from "@/features/rooms/room-session";
import type {
	ComposerSubmission,
	RoomSettings,
} from "@/features/rooms/types/room";
import { ToolWorkbench } from "@/features/tools/components/tool-workbench";
import { openToolWorkbenchFiles } from "@/features/tools/open-tool-workbench-files";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { ThreadAgentSelect } from "@/features/work-thread/thread-agent-select";
import { DailyChatHeader } from "./daily-chat-header";

interface NewChatWorkspaceProps {
	/** Local draft identity retained while switching to Brief. */
	draftId: string;
	/** The unified session remains unallocated until sending or opening room files. */
	session: RoomSession;
	snapshot: RoomSessionSnapshot;
	userName: string;
	topicId?: string;
	agentError: string;
	onInitialize: () => Promise<void>;
	onSend: (submission: ComposerSubmission) => Promise<void>;
	onSaveSettings: (settings: RoomSettings) => Promise<void>;
	onSelectAgent: (agentId: string) => Promise<void>;
}

/** Welcome composer and an explicitly opened, persistent workbench. */
export function NewChatWorkspace({
	draftId,
	session,
	snapshot,
	userName,
	topicId,
	agentError,
	onInitialize,
	onSend,
	onSaveSettings,
	onSelectAgent,
}: NewChatWorkspaceProps) {
	const workbench = useToolWorkbench();
	const { isOpen, openWorkbench, closeWorkbench, store } = workbench;
	const [hasOpenedWorkbench, setHasOpenedWorkbench] = useState(false);
	const active = useRef(true);
	const actionsTriggerId = `new-chat-${draftId}-composer-actions`;
	useEffect(() => {
		active.current = true;
		return () => {
			active.current = false;
		};
	}, []);
	useEffect(() => {
		if (isOpen) setHasOpenedWorkbench(true);
	}, [isOpen]);
	const openSettings = () => {
		store
			.getState()
			.layout.actions.selectPanel(
				ROOM_SETTINGS_PANEL_TYPE,
				{},
				{ name: "Settings" },
			);
		openWorkbench(undefined, actionsTriggerId);
	};
	const openFiles = async (): Promise<void> => {
		const release = session.retain();
		try {
			await session.create("New chat");
			if (active.current)
				openToolWorkbenchFiles(workbench, session.insight.insightId);
		} finally {
			release();
		}
	};
	const isBusy = snapshot.isPreparing || snapshot.turn.isSubmitting;
	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:p-8">
			<div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col">
				<DailyChatHeader
					threadId={draftId}
					title="New chat"
					userName={userName}
					topicId={topicId}
					isWorkbenchOpen={isOpen}
					isNewChat
				/>
				<div className="flex min-h-0 min-w-0 flex-1 gap-6">
					<ResizablePanelGroup
						direction="horizontal"
						keyboardResizeBy={5}
						className="min-h-0 min-w-0 flex-1"
					>
						<ResizablePanel
							id={`${draftId}-composer`}
							order={1}
							defaultSize={40}
							minSize={20}
							className={cn(
								"min-h-0 min-w-0",
								isOpen && "hidden md:block",
							)}
						>
							<section
								aria-label="New chat"
								className="flex h-full min-h-0 min-w-0 flex-1 flex-col justify-center gap-4 overflow-y-auto p-1"
							>
								{snapshot.isLoading && (
									<output className="flex items-center gap-2 text-muted-foreground">
										<Spinner aria-hidden="true" /> Opening
										Assistant…
									</output>
								)}
								{snapshot.error && !snapshot.isReady && (
									<Alert variant="destructive">
										<AlertDescription>
											{snapshot.error.message}
										</AlertDescription>
										<Button
											type="button"
											variant="outline"
											onClick={() => void onInitialize()}
										>
											Retry connection
										</Button>
									</Alert>
								)}
								{snapshot.isCreationUncertain && (
									<Alert variant="destructive">
										<AlertDescription>
											Room creation could not be
											confirmed. Check your chat history
											before starting another room.
										</AlertDescription>
									</Alert>
								)}
								{agentError && (
									<Alert variant="destructive">
										<AlertDescription>
											{agentError}
										</AlertDescription>
									</Alert>
								)}
								<RoomComposer
									key={snapshot.composerResetKey}
									initialDraft={snapshot.composerDraft}
									onDraftChange={session.setComposerDraft}
									retainUntilSent
									submissionError={
										snapshot.submissionError ||
										snapshot.settingsError ||
										snapshot.error?.message
									}
									agentName={
										snapshot.agent?.name ?? "Assistant"
									}
									agent={snapshot.agent ?? undefined}
									isSubmitting={isBusy}
									isRunning={snapshot.turn.isRunning}
									isCancelling={snapshot.turn.isCancelling}
									modelId={snapshot.modelId}
									modelName={snapshot.modelName}
									isModelSaving={
										snapshot.isSavingSettings ||
										snapshot.isLoadingModel
									}
									isSendDisabled={
										!snapshot.isReady ||
										Boolean(
											snapshot.modelError ||
												snapshot.settingsError,
										) ||
										snapshot.hasUnconfirmedSubmission ||
										snapshot.isCreationUncertain
									}
									modelError={
										snapshot.modelError
											? new Error(snapshot.modelError)
											: null
									}
									roomInstructions={
										snapshot.settings.instructions
									}
									roomSettings={snapshot.settings}
									hideSettingsAction
									actionsTriggerId={actionsTriggerId}
									panelActions={[
										{
											id: "settings",
											label: "Settings",
											icon: Settings2,
											onSelect: openSettings,
										},
										{
											id: "workbench",
											label: isOpen
												? "Hide workbench"
												: "Open workbench",
											icon: isOpen
												? PanelRightClose
												: PanelRightOpen,
											onSelect: () =>
												isOpen
													? closeWorkbench()
													: openWorkbench(
															undefined,
															actionsTriggerId,
														),
										},
									]}
									inheritedMcp={snapshot.agent?.mcp ?? []}
									isSettingsDisabled={
										!snapshot.isReady || isBusy
									}
									onModelChange={(engine) =>
										session.selectModel(
											engine.engine_id,
											engine.engine_display_name ||
												engine.engine_name,
										)
									}
									onSaveRoomSettings={onSaveSettings}
									onOptimizePrompt={(text, instructions) =>
										optimizePrompt(
											session.insight.actions,
											{
												modelId: snapshot.modelId,
												draft: text,
												instructions,
											},
										)
									}
									onSend={onSend}
									onStop={session.cancel}
								>
									<div className="@md/composer:w-36 w-28 min-w-0 shrink-0">
										<ThreadAgentSelect
											compact
											value={snapshot.settings.agentId}
											name={
												snapshot.agent?.name ??
												"Assistant"
											}
											disabled={
												!snapshot.isReady ||
												isBusy ||
												snapshot.isSavingSettings
											}
											onChange={(agentId) =>
												void onSelectAgent(agentId)
											}
										/>
									</div>
								</RoomComposer>
							</section>
						</ResizablePanel>
						{(isOpen || hasOpenedWorkbench) && (
							<>
								<ResizableHandle
									aria-label="Resize workbench"
									className={cn(
										"hidden md:flex",
										!isOpen && "md:hidden",
									)}
								/>
								<ResizablePanel
									id={`${draftId}-workbench`}
									order={2}
									defaultSize={60}
									minSize={20}
									maxSize={80}
									className={cn(
										"min-h-0 min-w-0",
										!isOpen && "hidden",
									)}
								>
									<aside
										hidden={!isOpen}
										aria-label="Workbench"
										className="relative size-full min-h-0 bg-background"
									>
										<ToolWorkbench
											onOpenSettings={openSettings}
											onOpenFiles={openFiles}
											isOpeningFiles={
												snapshot.isPreparing
											}
											filesDisabled={
												!snapshot.isReady ||
												snapshot.isCreationUncertain
											}
										/>
									</aside>
								</ResizablePanel>
							</>
						)}
					</ResizablePanelGroup>
					{!isOpen && (
						<BriefContextRail
							topicId={topicId}
							className="hidden w-80 shrink-0 overflow-y-auto xl:block"
						/>
					)}
				</div>
			</div>
		</div>
	);
}
