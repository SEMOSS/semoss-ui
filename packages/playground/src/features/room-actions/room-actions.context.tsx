import { observer } from "mobx-react-lite";
import { createContext, type ReactNode, useContext, useState } from "react";
import { SaveWorkspaceDialog } from "@/components/room/room-workspace-creation";
import type { RoomStore } from "@/stores/room/room.store";
import { DownloadConversationDialog } from "./download-conversation-dialog";
import { type RoomActions, useRoomActions } from "./use-room-actions";

/** One room's actions, shared by its name, the More actions menu, and the composer's slash menu. */
interface RoomActionsContextValue {
	/** The room the actions act on. */
	room: RoomStore;
	/** Favorite, rename, and delete. */
	actions: RoomActions;
	/** Whether the room's name is being edited in place. */
	isRenaming: boolean;
	/** Starts editing the name in place, as a double-click or `/rename` does. */
	startRenaming: () => void;
	/** Stops editing the name in place. */
	stopRenaming: () => void;
	/** Opens the download dialog. */
	openDownload: () => void;
	/** Opens the dialog that publishes the room as an agent. */
	openPublish: () => void;
}

const RoomActionsContext = createContext<RoomActionsContextValue | null>(null);

/** The room's shared actions, or null outside a room. */
export const useRoomActionsContext = (): RoomActionsContextValue | null =>
	useContext(RoomActionsContext);

interface RoomActionsProviderProps {
	/** The room the actions act on. */
	room: RoomStore;
	/** The room page, whose header and composer use the actions. */
	children: ReactNode;
}

/**
 * Shares one room's actions between its name, the Workbench rail's More
 * actions menu, and the composer's slash menu, so the name can be edited in
 * place and either menu can open the publish and download dialogs. Wraps the
 * whole room page.
 */
export const RoomActionsProvider = observer(
	({ room, children }: RoomActionsProviderProps) => {
		const actions = useRoomActions(room.roomId);
		const [isRenaming, setIsRenaming] = useState(false);
		const [isDownloadOpen, setIsDownloadOpen] = useState(false);
		const [isPublishOpen, setIsPublishOpen] = useState(false);
		return (
			<RoomActionsContext.Provider
				value={{
					room: room,
					actions: actions,
					isRenaming: isRenaming,
					startRenaming: () => setIsRenaming(true),
					stopRenaming: () => setIsRenaming(false),
					openDownload: () => setIsDownloadOpen(true),
					openPublish: () => setIsPublishOpen(true),
				}}
			>
				{children}
				<SaveWorkspaceDialog
					systemPrompt={room.options.instructions}
					mcps={room.options.mcp}
					open={isPublishOpen}
					onOpenChange={setIsPublishOpen}
				/>
				<DownloadConversationDialog
					roomId={room.roomId}
					open={isDownloadOpen}
					onOpenChange={setIsDownloadOpen}
				/>
			</RoomActionsContext.Provider>
		);
	},
);
