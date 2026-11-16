import type { SendButtonState } from "../composer/room-input";
import { isAskExecutionMode } from "../mcp/mcp-utils";
import { ResponseMessageStore } from "../messages/response-message.store";
import type { RoomStore } from "../room/room.store";

/** Where a room's current turn stands, as its messages and composer show it. */
export interface RoomTurnState {
	/** The turn is running: the room is loading, thinking, or auto-running tools. */
	readonly isBusy: boolean;
	/** The newest response is visibly arriving, so it shows its own progress. */
	readonly isStreamingContent: boolean;
	/** Ask-mode tools on the latest response that wait on the user. */
	readonly waitingAskToolCount: number;
	/** What the composer's send button does. */
	readonly sendState: SendButtonState;
}

/**
 * Read a room's turn state. Pure over the room, so it serves as a
 * `useRoomSelector` selector: the component re-renders only when a field of
 * the result changes.
 *
 * @param room - The room.
 * @returns The turn state.
 */
export const readRoomTurnState = (room: RoomStore): RoomTurnState => {
	const latest = room.latestResponseMessage;
	const toolCalls = latest
		? latest.parts.flatMap((part) =>
				part.type === "TOOL_CALL"
					? [room.getTool(part.toolCall.id)]
					: [],
			)
		: [];

	const isAutoExecutingTools = toolCalls.some(
		(tool) =>
			!!tool &&
			tool.json._meta?.SMSS_MCP_EXECUTION === "auto" &&
			(tool.status === "INITIAL" || tool.status === "LOADING"),
	);

	// not auto tools (they need no click), and not ask tools that already
	// resolved or are running after being clicked
	const waitingAskToolCount = toolCalls.filter(
		(tool) =>
			!!tool &&
			tool.status === "INITIAL" &&
			isAskExecutionMode(tool.json._meta?.SMSS_MCP_EXECUTION),
	).length;

	const isBusy =
		room.isLoading ||
		room.latestResponseMessage.isThinking ||
		isAutoExecutingTools;

	// Its last part is text or reasoning, or a tool call still coming in (which
	// shows its own spinner). Read off the tail rather than isThinking, which an
	// agent run turns off as soon as its first item arrives.
	const isStreamingContent = (() => {
		const tail = room.tail;
		if (!(tail instanceof ResponseMessageStore)) {
			return false;
		}
		const lastPart = tail.parts[tail.parts.length - 1];
		if (lastPart?.type === "TEXT") {
			return lastPart.text.trim().length > 0;
		}
		if (lastPart?.type === "THINKING") {
			return lastPart.thinking.length > 0;
		}
		if (lastPart?.type === "TOOL_CALL") {
			return !!room.getTool(lastPart.toolCall.id)?.isStreamingPlaceholder;
		}
		return false;
	})();

	// Agent-run turns can't be interrupted server-side yet, so they show a plain
	// spinner instead of a Stop button that would do nothing.
	const sendState: SendButtonState = room.isCancelling
		? "loading"
		: room.mode === "agent" && isBusy
			? "loading"
			: room.canCancel || isBusy
				? "stop"
				: "send";

	return { isBusy, isStreamingContent, waitingAskToolCount, sendState };
};
