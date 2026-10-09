import type { ReactNode } from "react";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { WorkbenchLayout } from "@semoss/workbench";
import { ROOM_SETTINGS_PANEL_COMPONENTS } from "@/features/rooms/components/room-settings-panel";
import { RoomSettingsPanelContext } from "@/features/rooms/components/room-settings-panel.context";
import type {
	RoomSession,
	RoomSessionSnapshot,
} from "@/features/rooms/room-session";
import type { RoomSettings } from "@/features/rooms/types/room";
import { ToolWorkbenchProvider } from "@/features/tools/components/tool-workbench-provider";
import { TOOL_WORKBENCH_COMPONENTS } from "@/features/tools/tool-workbench.components";
import { createToolWorkbenchLayout } from "@/features/tools/tool-workbench.constants";
import { WorkbenchConnectorProvider } from "@/features/workbench-connectors/workbench-connector-provider";

const NEW_CHAT_WORKBENCH_COMPONENTS = {
	...TOOL_WORKBENCH_COMPONENTS,
	...ROOM_SETTINGS_PANEL_COMPONENTS,
};
/** Defer the file rail until its explicit action binds the draft to a room. */
function createNewChatWorkbenchLayout(insightId: string): WorkbenchLayout {
	const layout = createToolWorkbenchLayout(insightId);
	const files = FILE_PANEL_TYPES.FILE_EXPLORER;
	return {
		...layout,
		panels: Object.fromEntries(
			Object.entries(layout.panels).filter(([id]) => id !== files),
		),
		borders: {
			...layout.borders,
			left: {
				...layout.borders?.left,
				panelIds: (layout.borders?.left?.panelIds ?? []).filter(
					(id) => id !== files,
				),
				activeId: null,
			},
		},
	};
}

interface NewChatWorkbenchProviderProps {
	/** The local draft owns the same room session before and after allocation. */
	session: RoomSession;
	snapshot: RoomSessionSnapshot;
	onSaveSettings: (settings: RoomSettings) => Promise<void>;
	children: ReactNode;
}

/** Share room panels without mounting a file explorer before the room is bound. */
export function NewChatWorkbenchProvider({
	session,
	snapshot,
	onSaveSettings,
	children,
}: NewChatWorkbenchProviderProps) {
	return (
		<RoomSettingsPanelContext.Provider
			value={{
				agentName: snapshot.agent?.name ?? "Assistant",
				agent: snapshot.agent ?? undefined,
				modelId: snapshot.modelId,
				modelName: snapshot.modelName,
				settings: snapshot.settings,
				inheritedMcp: snapshot.agent?.mcp ?? [],
				isReadOnly:
					!snapshot.isReady ||
					snapshot.isPreparing ||
					snapshot.isSavingSettings ||
					snapshot.turn.isSubmitting ||
					snapshot.turn.isRunning ||
					snapshot.turn.isRestoring ||
					snapshot.hasUnconfirmedSubmission ||
					snapshot.isCreationUncertain,
				onSave: onSaveSettings,
			}}
		>
			<ToolWorkbenchProvider
				roomId={snapshot.roomId}
				insightId={session.insight.insightId}
				components={NEW_CHAT_WORKBENCH_COMPONENTS}
				createLayout={createNewChatWorkbenchLayout}
				tools={{}}
				pendingApprovals={[]}
				onApproveTool={session.approve}
				onRejectTool={session.reject}
				autoReveal={false}
			>
				<WorkbenchConnectorProvider
					session={session}
					snapshot={snapshot}
				>
					{children}
				</WorkbenchConnectorProvider>
			</ToolWorkbenchProvider>
		</RoomSettingsPanelContext.Provider>
	);
}
