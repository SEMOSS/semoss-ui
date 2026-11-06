import {
	isFolderToolCall,
	type RoomEngine,
	type RoomToolCall,
} from "@semoss/sdk";
import { toRoomUiStore } from "../../workbench/room-ui.store";

/**
 * Whether a tool call gets the chat tool card (`ChatToolCard`) instead of the
 * generic tool view: a call to the room's folder tools, or one an
 * integration of the room owns, such as a connector's.
 *
 * @param room - The call's room.
 * @param call - The tool call.
 * @return True for folder and integration calls.
 */
export const isChatToolCall = (room: RoomEngine, call: RoomToolCall): boolean =>
	isFolderToolCall(call) ||
	toRoomUiStore(room).integrations.some((integration) =>
		integration.ownsToolCall?.(call),
	);
