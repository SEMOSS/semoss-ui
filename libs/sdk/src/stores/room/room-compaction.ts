import { chatPixels } from "../../api/chat-pixels";
import { InputMessageStore } from "./message/input-message.store";
import { ResponseMessageStore } from "./message/response-message.store";
import type { InputPixelMessage, ResponsePixelMessage } from "./room.types";
import type { RoomEngine } from "./room-engine.store";

/**
 * Compact a room's conversation into its last response, by summary or by
 * pruning tool calls, and splice what the backend wrote into the tree.
 *
 * @param room - The room.
 * @param strategy - Summarize, prune tool calls, or let the backend choose.
 * @returns Whether anything was compacted.
 * @throws When the last response made tool calls, or compaction failed.
 */
export const compactRoom = async (
	room: RoomEngine,
	strategy?: "TOOL_PRUNE" | "SUMMARY" | "AUTO",
): Promise<"compacted" | "skipped"> => {
	const curResponse = room.latestResponseMessage;
	if (!curResponse) {
		throw new Error("No response message to compact");
	}
	if (curResponse.hasTools) {
		throw new Error("Cannot compact a response that includes tool calls");
	}

	curResponse.setIsCompacting(true);

	type CompactionResult = {
		type: "SUMMARY" | "TOOL_PRUNE";
		success: boolean;
		inputMessage: InputPixelMessage;
		responseMessage: ResponsePixelMessage;
		error?: string;
	};

	try {
		const response = await room.runRoomPixel<CompactionResult[][]>(
			chatPixels.compactMessages({
				roomId: room.roomId,
				parentMessageId: curResponse.id,
				strategy: strategy,
			}),
			true,
		);
		const { output } = response.pixelReturn[0];
		if (!response || response.errors.length || !output) {
			throw new Error();
		}
		if (output.length === 0) {
			return "skipped";
		}

		curResponse.setConversationCompactedAbove(true);

		let success = false;
		for (const result of output) {
			if (!result.success) {
				console.warn(result.error || "Unknown error during compaction");
				continue;
			}
			success = true;
			if (result.type === "SUMMARY" || result.type === "TOOL_PRUNE") {
				const inputStore = new InputMessageStore(
					room,
					result.inputMessage,
				);
				const responseStore = new ResponseMessageStore(
					room,
					result.responseMessage,
				);
				inputStore.addChild(responseStore);
				curResponse.addChild(inputStore);
			}
		}

		if (!success) {
			throw new Error();
		}
		return "compacted";
	} finally {
		curResponse.setIsCompacting(false);
	}
};
