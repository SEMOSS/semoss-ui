import type { ReactNode } from "react";
import { InsightContext } from "@semoss/sdk/react";
import type { WorkbenchLayout } from "@semoss/workbench";
import { ROOM_CONNECTOR_COMPONENTS } from "@/features/room-connectors/room-connectors.components";
import { createRoomConnectorLayout } from "@/features/room-connectors/room-connectors.constants";
import { RoomConnectorsProvider } from "@/features/room-connectors/room-connectors-provider";
import { ROOM_SETTINGS_PANEL_COMPONENTS } from "@/features/rooms/components/room-settings-panel";
import { RoomSettingsPanelContext } from "@/features/rooms/components/room-settings-panel.context";
import type {
	RoomSession,
	RoomSessionSnapshot,
} from "@/features/rooms/room-session";
import type { RoomSettings } from "@/features/rooms/types/room";
import { ToolWorkbenchProvider } from "@/features/tools/components/tool-workbench-provider";
import { TOOL_WORKBENCH_COMPONENTS } from "@/features/tools/tool-workbench.components";

const NEW_CHAT_WORKBENCH_COMPONENTS = {
	...TOOL_WORKBENCH_COMPONENTS,
	...ROOM_CONNECTOR_COMPONENTS,
	...ROOM_SETTINGS_PANEL_COMPONENTS,
};
/** Defer the file rail until its explicit action binds the draft to a room. */
function createNewChatWorkbenchLayout(insightId: string): WorkbenchLayout {
	return createRoomConnectorLayout(insightId, false);
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
	const insight = session.insight;
	return (
		<InsightContext.Provider
			value={{
				isInitialized: insight.isInitialized,
				isReady: insight.isReady,
				isAuthorized: insight.isAuthorized,
				error: insight.error,
				system: insight.system,
				insightId: insight.insightId,
				actions: insight.actions,
			}}
		>
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
					<RoomConnectorsProvider session={session}>
						{children}
					</RoomConnectorsProvider>
				</ToolWorkbenchProvider>
			</RoomSettingsPanelContext.Provider>
		</InsightContext.Provider>
	);
}
