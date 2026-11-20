import { compactPlaygroundRoom } from "@semoss/sdk";
import type { PixelMessage } from "../../../types";
import type { RoomStore } from "./room.store";
import type { RoomMessageTree } from "./room-message-tree";

/** Which compaction to run; AUTO lets the backend pick. */
export type CompactionStrategy = "TOOL_PRUNE" | "SUMMARY" | "AUTO";

/**
 * Compact a room's conversation into its last real response
 * (CompactRoomMessages): each method that works adds its summary turn below
 * that response, which is then marked compacted above. A response is marked
 * only when some method worked.
 *
 * @param room - The room.
 * @param graftTurns - Hangs the summary turns below the response.
 * @param strategy - Which compaction to run; AUTO or none lets the backend pick.
 * @returns "compacted", or "skipped" when the backend had nothing to compact.
 * @throws Error when there is no response to compact, it holds tool calls,
 * or every method failed.
 */
export const compactConversation = async (
	room: RoomStore,
	graftTurns: RoomMessageTree["graftTurns"],
	strategy?: CompactionStrategy,
): Promise<"compacted" | "skipped"> => {
	const response = room.latestResponseMessage;
	if (!response) throw new Error("No response message to compact");
	if (response.hasTools) {
		throw new Error("Cannot compact a response that includes tool calls");
	}

	response.setIsCompacting(true);
	try {
		const output = await room.runRoomRequest((insightId) =>
			compactPlaygroundRoom<PixelMessage>(insightId, {
				roomId: room.roomId,
				parentMessageId: response.id,
				strategy: strategy === "AUTO" ? undefined : strategy,
			}),
		);
		if (!output) throw new Error();
		if (output.length === 0) {
			return "skipped";
		}
		for (const method of output) {
			if (!method.success) {
				console.warn(method.error || "Unknown error during compaction");
			}
		}
		const succeeded = output.filter((method) => method.success);
		if (succeeded.length === 0) {
			throw new Error();
		}

		response.setConversationCompactedAbove(true);
		graftTurns(
			response,
			succeeded.filter(
				(method) =>
					method.type === "SUMMARY" || method.type === "TOOL_PRUNE",
			),
		);
		return "compacted";
	} finally {
		response.setIsCompacting(false);
	}
};
