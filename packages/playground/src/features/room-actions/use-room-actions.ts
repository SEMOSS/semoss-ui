import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { useChat } from "@/hooks/use-chat";

/** What a room's own menu can do to it. */
export interface RoomActions {
	/** Whether the room is among the user's favorites. */
	isPinned: boolean;
	/** Adds the room to the favorites, or takes it out. */
	togglePinned: () => Promise<void>;
	/**
	 * Renames the room.
	 *
	 * @param name - The new name; refused when blank.
	 * @return Whether the room was renamed.
	 */
	rename: (name: string) => Promise<boolean>;
	/** Deletes the room and leaves its page. */
	remove: () => Promise<void>;
}

/**
 * Favorite, rename, and delete for one room, through the chat store, so every
 * room list in the app refetches after each. Each reports its outcome in a
 * toast. Call it from an observer: the favorites are read again whenever the
 * chat store's room counter moves.
 *
 * @param roomId - The room.
 * @return The room's pinned state and its actions.
 */
export const useRoomActions = (roomId: string): RoomActions => {
	const { t } = useTranslation("sidebar");
	const { chat } = useChat();
	const navigate = useNavigate();
	const pinnedRooms = usePixel<{ ROOM_ID: string }[]>(
		`META | GetPlaygroundRooms(pinned=[true], sort=["DESC"]);`,
		{ data: [] },
	);
	const roomCounter = chat.keys.roomCounter;
	const seenCounter = useRef(roomCounter);
	const { refresh } = pinnedRooms;

	// The favorites change from any room list; read them again when one does.
	useEffect(() => {
		if (seenCounter.current === roomCounter) return;
		seenCounter.current = roomCounter;
		refresh();
	}, [roomCounter, refresh]);

	const isPinned = (pinnedRooms.data ?? []).some(
		(room) => room.ROOM_ID === roomId,
	);

	const togglePinned = async () => {
		try {
			await chat.pinRoom(roomId, !isPinned);
		} catch {
			toast.error(
				isPinned ? t("toasts.failedToUnpin") : t("toasts.failedToPin"),
			);
		}
	};

	const rename = async (name: string): Promise<boolean> => {
		if (!name.trim()) {
			toast.error(t("toasts.roomNameEmpty"));
			return false;
		}
		try {
			await chat.renameRoom(roomId, name);
			toast.success(t("toasts.roomRenamedSuccess"));
			return true;
		} catch {
			toast.error(t("toasts.failedToRename"));
			return false;
		}
	};

	const remove = async () => {
		try {
			await chat.closeRoom(roomId);
			toast.success(t("toasts.roomDeletedSuccess"));
			navigate("/");
		} catch (e) {
			toast.error(getErrorMessage(e) || t("toasts.failedToDelete"));
		}
	};

	return { isPinned, togglePinned, rename, remove };
};
