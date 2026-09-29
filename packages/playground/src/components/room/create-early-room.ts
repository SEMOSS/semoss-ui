import { runPixel } from "@semoss/sdk/react";
import type { ChatStore } from "@/stores/chat/chat.store";
import { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_COMPONENTS } from "./panels/room-panel.components";

/** What {@link createEarlyRoom} needs to know. */
export interface CreateEarlyRoomOptions {
	/** The app's theme, which every room takes. */
	theme: RoomStore["theme"];
	/** The chat store, which the room is registered with. */
	chat: ChatStore;
	/** How the new chat will run. */
	mode: "chat" | "agent" | "workspace";
	/** The new chat's settings so far. */
	options: RoomStore["options"];
	/** Agent workspace selected before the first message, if any. */
	workspaceId?: string;
}

/**
 * Create the new chat's room before its first message, for a sidebar panel
 * that needs a room behind it: Chat Files, or a connector viewer that saves
 * into the chat's files. The room is registered, so it is the one the first
 * message goes to.
 *
 * @param options - The app's theme, the chat store, and the draft's mode and
 * settings.
 * @return The room, initialized and holding the draft's settings.
 * @throws Error when the backend cannot create the room.
 */
export const createEarlyRoom = async ({
	theme,
	chat,
	mode,
	options,
	workspaceId,
}: CreateEarlyRoomOptions): Promise<RoomStore> => {
	const { errors, pixelReturn, insightId } = await runPixel<
		[{ roomId: string }]
	>(
		`CreatePlaygroundRoom(${workspaceId ? `workspaceId=${JSON.stringify(workspaceId)}` : ""})`,
		"new",
	);
	if (errors.length > 0) {
		throw new Error(errors.join(""));
	}

	const room = new RoomStore({
		theme: theme,
		roomId: pixelReturn[0].output.roomId,
		insightId: insightId,
		panelComponents: ROOM_PANEL_COMPONENTS,
	});
	room.setModel(chat.models.selected);
	room.setMode(mode === "agent" ? "agent" : "chat");
	await room.initialize({ isNew: true });
	await room.updateRoomOptions(options);
	// registered so loadRoom finds it after navigation
	chat.registerRoom(room);
	return room;
};
