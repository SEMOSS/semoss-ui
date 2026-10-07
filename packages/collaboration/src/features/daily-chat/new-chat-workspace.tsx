import {
	FolderOpen,
	PanelRightClose,
	PanelRightOpen,
	Settings2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, Button } from "@semoss/ui/next";
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
import { DraftChatComposer } from "./draft-chat-composer";

interface NewChatWorkspaceProps {
	/** Local draft identity retained across browser history entries. */
	draftId: string;
	/** The unified session remains unallocated until sending or opening room files. */
	session: RoomSession;
	snapshot: RoomSessionSnapshot;
	agentError: string;
	onInitialize: () => Promise<void>;
	onSend: (submission: ComposerSubmission) => Promise<void>;
	onSaveSettings: (settings: RoomSettings) => Promise<void>;
	onSelectAgent: (agentId: string) => Promise<void>;
}

/** Compact overview composer with its tools available without leaving the page. */
export function NewChatWorkspace({
	draftId,
	session,
	snapshot,
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
	return (
		<section
			aria-label="Start a chat"
			className="flex min-w-0 flex-col gap-3"
		>
			<DraftChatComposer
				draftId={draftId}
				session={session}
				snapshot={snapshot}
				agentError={agentError}
				onInitialize={onInitialize}
				onSend={onSend}
				onSaveSettings={onSaveSettings}
				onSelectAgent={onSelectAgent}
				isCompact
				panelActions={[
					{
						id: "settings",
						label: "Settings",
						icon: Settings2,
						onSelect: openSettings,
					},
					{
						id: "files",
						label: "Show chat files",
						icon: FolderOpen,
						onSelect: () => {
							openWorkbench(undefined, actionsTriggerId);
							void openRequestedFiles();
						},
					},
					{
						id: "workbench",
						label: isOpen ? "Hide workbench" : "Open workbench",
						icon: isOpen ? PanelRightClose : PanelRightOpen,
						onSelect: () =>
							isOpen
								? closeWorkbench()
								: openWorkbench(undefined, actionsTriggerId),
					},
				]}
			/>
			{filesError && (
				<Alert variant="destructive">
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
			{(isOpen || hasOpenedWorkbench) && (
				<aside
					hidden={!isOpen}
					aria-label="Workbench"
					className="relative h-128 min-h-0 min-w-0 bg-background"
				>
					<ToolWorkbench
						onOpenSettings={openSettings}
						onOpenFiles={openFiles}
						isOpeningFiles={snapshot.isPreparing}
						filesDisabled={
							!snapshot.isReady || snapshot.isCreationUncertain
						}
					/>
				</aside>
			)}
		</section>
	);
}
