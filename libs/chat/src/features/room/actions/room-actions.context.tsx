import { createContext, type ReactNode, useContext, useState } from "react";
import { useChatSession } from "../../chat/provider/chat-session.context";
import { listRoomTools } from "../../tools/mcp/mcp-utils";
import type { RoomStore } from "../store/room.store";
import { useRoomSelector } from "../store/use-room-selector";
import { DownloadDialog } from "./download-dialog";
import { SaveAgentDialog } from "./save-agent-dialog";
import { type RoomActions, useRoomActions } from "./use-room-actions";

/** One room's actions, shared by its name, the Workbench rail's cog menu, and the composer's slash menu. */
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

/** Holds the open room's actions; null outside a `RoomActionsProvider`. */
const RoomActionsContext = createContext<RoomActionsContextValue | null>(null);

/**
 * The room's shared actions.
 *
 * @returns The actions, or null outside a `RoomActionsProvider`.
 */
export const useRoomActionsContext = (): RoomActionsContextValue | null =>
	useContext(RoomActionsContext);

/** Props for {@link RoomActionsProvider}. */
interface RoomActionsProviderProps {
	/** The room the actions act on. */
	room: RoomStore;
	/** The room page, whose header and composer use the actions. */
	children: ReactNode;
}

/**
 * Shares one room's actions between its name, the Workbench rail's cog
 * menu, and the composer's slash menu, so the name can be edited in
 * place and either menu can open the publish and download dialogs, which it
 * renders. Wraps the whole room page.
 */
export const RoomActionsProvider = ({
	room,
	children,
}: RoomActionsProviderProps) => {
	const { roomId, instructions, roomTools, agentTools } = useRoomSelector(
		room,
		(current) => ({
			roomId: current.roomId,
			instructions: current.options.instructions,
			roomTools: current.options.mcp,
			agentTools: current.agentTools,
		}),
	);
	const actions = useRoomActions(roomId);
	const { chat } = useChatSession();
	const [isRenaming, setIsRenaming] = useState(false);
	const [isDownloadOpen, setIsDownloadOpen] = useState(false);
	const [isPublishOpen, setIsPublishOpen] = useState(false);
	return (
		<RoomActionsContext.Provider
			value={{
				room,
				actions,
				isRenaming,
				startRenaming: () => setIsRenaming(true),
				stopRenaming: () => setIsRenaming(false),
				openDownload: () => setIsDownloadOpen(true),
				openPublish: () => setIsPublishOpen(true),
			}}
		>
			{children}
			<SaveAgentDialog
				systemPrompt={instructions}
				mcps={listRoomTools(roomTools, agentTools)}
				open={isPublishOpen}
				onOpenChange={setIsPublishOpen}
			/>
			<DownloadDialog
				ns="sidebar"
				open={isDownloadOpen}
				onOpenChange={setIsDownloadOpen}
				onDownload={(format) =>
					chat.downloadConversation(roomId, format)
				}
			/>
		</RoomActionsContext.Provider>
	);
};
