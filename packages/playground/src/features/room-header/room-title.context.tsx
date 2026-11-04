import { observer } from "mobx-react-lite";
import {
	createContext,
	type ReactNode,
	useContext,
	useRef,
	useState,
} from "react";
import { SaveWorkspaceDialog } from "@/components/room/room-workspace-creation";
import { DownloadConversationDialog } from "@/features/room-actions/download-conversation-dialog";
import {
	type RoomActions,
	useRoomActions,
} from "@/features/room-actions/use-room-actions";
import type { RoomStore } from "@/stores/room/room.store";

/** What the room header's menus share: the room, its actions, and renaming. */
export interface RoomTitleState {
	/** The room the header names. */
	room: RoomStore;
	/** Favorite, rename, and delete. */
	actions: RoomActions;
	/** Whether the room's name is being edited in place. */
	isRenaming: boolean;
	/** Starts editing the name in place, from anything but a menu. */
	startRename: () => void;
	/** Stops editing the name in place. */
	stopRenaming: () => void;
	/** Asks to edit the name in place once the menu that asked has closed. */
	requestRename: () => void;
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

const RoomTitleContext = createContext<RoomTitleState | null>(null);

/** The header's shared room state, or null outside a room. */
export const useRoomTitle = (): RoomTitleState | null =>
	useContext(RoomTitleContext);

export interface RoomTitleProviderProps {
	/** The room the header names. */
	room: RoomStore;
	children: ReactNode;
}

/**
 * Shares one room's actions between its name, the header's Other menu, and
 * the composer's slash menu, so either menu can rename the name in place or
 * open the publish and download dialogs. Wraps the whole room page.
 */
export const RoomTitleProvider = observer(
	({ room, children }: RoomTitleProviderProps) => {
		const actions = useRoomActions(room.roomId);
		const [isRenaming, setIsRenaming] = useState(false);
		const [isDownloadOpen, setIsDownloadOpen] = useState(false);
		const [isPublishOpen, setIsPublishOpen] = useState(false);
		// a menu hands focus back to its button as it closes; a rename it
		// asked for waits for that, so the field keeps focus
		const pendingRename = useRef(false);
		return (
			<RoomTitleContext.Provider
				value={{
					room: room,
					actions: actions,
					isRenaming: isRenaming,
					startRename: () => setIsRenaming(true),
					stopRenaming: () => setIsRenaming(false),
					requestRename: () => {
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
			</RoomTitleContext.Provider>
		);
	},
);
