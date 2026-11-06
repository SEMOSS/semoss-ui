import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { useChat } from "@/hooks/use-chat";
import type { ChatStore } from "@/stores/chat/chat.store";

/** Translates a `sidebar` key. */
type Translate = (key: string) => string;

/**
 * Adds a room to the favorites, or takes it out, with a toast on failure.
 *
 * @param chat - The chat store, which refreshes every room list after.
 * @param roomId - The room.
 * @param isFavorite - Whether it is a favorite now.
 * @param t - Translates the `sidebar` toasts.
 */
export const toggleRoomFavorite = async (
	chat: ChatStore,
	roomId: string,
	isFavorite: boolean,
	t: Translate,
): Promise<void> => {
	try {
		await chat.pinRoom(roomId, !isFavorite);
	} catch {
		toast.error(
			isFavorite ? t("toasts.failedToUnpin") : t("toasts.failedToPin"),
		);
	}
};

/**
 * Renames a room, with a toast either way; a blank name is refused.
 *
 * @param chat - The chat store, which refreshes every room list after.
 * @param roomId - The room.
 * @param name - The new name, trimmed before it is saved.
 * @param t - Translates the `sidebar` toasts.
 * @return Whether the room was renamed.
 */
export const renameRoom = async (
	chat: ChatStore,
	roomId: string,
	name: string,
	t: Translate,
): Promise<boolean> => {
	const trimmed = name.trim();
	if (!trimmed) {
		toast.error(t("toasts.roomNameEmpty"));
		return false;
	}
	try {
		await chat.renameRoom(roomId, trimmed);
		toast.success(t("toasts.roomRenamedSuccess"));
		return true;
	} catch {
		toast.error(t("toasts.failedToRename"));
		return false;
	}
};

/** What a room's own menu can do to it. */
export interface RoomActions {
	/** Whether the room is among the user's favorites. */
	isFavorite: boolean;
	/** Adds the room to the favorites, or takes it out. */
	toggleFavorite: () => Promise<void>;
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
 * @return The room's favorite state and its actions.
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

	// the backend calls favorites pinned rooms
	const isFavorite = (pinnedRooms.data ?? []).some(
		(room) => room.ROOM_ID === roomId,
	);

	const toggleFavorite = () =>
		toggleRoomFavorite(chat, roomId, isFavorite, t);

	const rename = (name: string) => renameRoom(chat, roomId, name, t);

	const remove = async () => {
		try {
			await chat.closeRoom(roomId);
			toast.success(t("toasts.roomDeletedSuccess"));
			navigate("/");
		} catch (e) {
			toast.error(getErrorMessage(e) || t("toasts.failedToDelete"));
		}
	};

	return { isFavorite, toggleFavorite, rename, remove };
};
