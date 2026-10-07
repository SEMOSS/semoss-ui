import { PanelRightClose, PanelRightOpen, Settings2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@semoss/ui/next";
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
import { DailyChatHeader } from "./daily-chat-header";
import { DraftChatComposer } from "./draft-chat-composer";
import type { NewChatPanel } from "./use-new-chat-controller";

interface NewChatWorkspaceProps {
	/** Local draft identity retained across browser history entries. */
	draftId: string;
	/** The unified session remains unallocated until sending or opening room files. */
	session: RoomSession;
	snapshot: RoomSessionSnapshot;
	userName: string;
	/** A panel explicitly requested from the overview composer. */
	requestedPanel?: NewChatPanel;
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
	requestedPanel,
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
	const hasOpenedRequestedPanel = useRef(false);
	const [filesError, setFilesError] = useState("");
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
	const openSettings = useCallback(() => {
		store
			.getState()
			.layout.actions.selectPanel(
				ROOM_SETTINGS_PANEL_TYPE,
				{},
				{ name: "Settings" },
			);
		openWorkbench(undefined, actionsTriggerId);
	}, [store, openWorkbench, actionsTriggerId]);
	const openFiles = useCallback(async (): Promise<void> => {
		setFilesError("");
		const release = session.retain();
		try {
			await session.create("New chat");
			if (active.current)
				openToolWorkbenchFiles(workbench, session.insight.insightId);
		} finally {
			release();
		}
	}, [session, workbench]);
	const openRequestedFiles = useCallback(async (): Promise<void> => {
		try {
			await openFiles();
		} catch (cause) {
			if (active.current)
				setFilesError(
					cause instanceof Error
						? cause.message
						: "Could not open chat files.",
				);
		}
	}, [openFiles]);
	useEffect(() => {
		if (
			!requestedPanel ||
			!snapshot.isReady ||
			hasOpenedRequestedPanel.current
		)
			return;
		hasOpenedRequestedPanel.current = true;
		if (requestedPanel === "settings") openSettings();
		else {
			openWorkbench(undefined, actionsTriggerId);
			void openRequestedFiles();
		}
	}, [
		requestedPanel,
		snapshot.isReady,
		openSettings,
		openRequestedFiles,
		openWorkbench,
		actionsTriggerId,
	]);
	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:p-8">
			<div className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col">
				{filesError && (
					<Alert variant="destructive" className="mb-4">
						<AlertDescription>
							{snapshot.isCreationUncertain
								? "Room creation could not be confirmed. Check your chat history before starting another room."
								: filesError}
						</AlertDescription>
						{!snapshot.isCreationUncertain && (
							<Button
								type="button"
								variant="outline"
								disabled={snapshot.isPreparing}
								onClick={() => void openRequestedFiles()}
							>
								Retry opening files
							</Button>
						)}
					</Alert>
				)}
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
								<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
									<DailyChatHeader userName={userName} />
									<DraftChatComposer
										draftId={draftId}
										session={session}
										snapshot={snapshot}
										agentError={agentError}
										onInitialize={onInitialize}
										onSend={onSend}
										onSaveSettings={onSaveSettings}
										onSelectAgent={onSelectAgent}
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
									/>
								</div>
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
				</div>
			</div>
		</div>
	);
}
