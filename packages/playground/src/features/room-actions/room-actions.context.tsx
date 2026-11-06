import { observer } from "mobx-react-lite";
import {
	createContext,
	type ReactNode,
	useContext,
	useRef,
	useState,
} from "react";
import { SaveWorkspaceDialog } from "@/components/room/room-workspace-creation";
import type { RoomStore } from "@/stores/room/room.store";
import { DownloadConversationDialog } from "./download-conversation-dialog";
import { type RoomActions, useRoomActions } from "./use-room-actions";

/** One room's actions, shared by its header and the composer's slash menu. */
interface RoomActionsContextValue {
	/** The room the actions act on. */
	room: RoomStore;
	/** Favorite, rename, and delete. */
	actions: RoomActions;
	/** Whether the room's name is being edited in place. */
	isRenaming: boolean;
	/** Starts editing the name in place, from outside a menu. */
	startRenaming: () => void;
	/** Stops editing the name in place. */
	stopRenaming: () => void;
	/** Asks to edit the name in place once the menu that asked has closed. */
	requestRenaming: () => void;
	/**
	 * A header menu's `onCloseAutoFocus`: when a rename is waiting, keeps the
	 * menu from taking focus back, and starts it.
	 */
	handleMenuCloseAutoFocus: (event: Event) => void;
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
 * Shares one room's actions between its name, the header's More actions
 * menu, and the composer's slash menu, so either menu can rename the room in
 * place or open the publish and download dialogs. Wraps the whole room page.
 */
export const RoomActionsProvider = observer(
	({ room, children }: RoomActionsProviderProps) => {
		const actions = useRoomActions(room.roomId);
		const [isRenaming, setIsRenaming] = useState(false);
		const [isDownloadOpen, setIsDownloadOpen] = useState(false);
		const [isPublishOpen, setIsPublishOpen] = useState(false);
		// a menu hands focus back to its button as it closes; a rename it
		// asked for waits for that, so the field keeps focus
		const pendingRename = useRef(false);
		return (
			<RoomActionsContext.Provider
				value={{
					room: room,
					actions: actions,
					isRenaming: isRenaming,
					startRenaming: () => setIsRenaming(true),
					stopRenaming: () => setIsRenaming(false),
					requestRenaming: () => {
						pendingRename.current = true;
					},
					handleMenuCloseAutoFocus: (event) => {
						if (!pendingRename.current) return;
						pendingRename.current = false;
						event.preventDefault();
						setIsRenaming(true);
					},
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
