import { createCommand } from "lexical";
import type { RoomStore } from "@/stores/room/room.store";

/** One user-authored prompt on the active conversation branch. */
export interface PromptHistoryEntry {
	id: string;
	text: string;
}

/** Submission ends browsing without restoring the draft over the sent text. */
export const RESET_PROMPT_HISTORY_COMMAND = createCommand<void>(
	"RESET_PROMPT_HISTORY",
);

/** Extract displayed user text, newest first, without recalling tool or media data. */
export function getPromptHistory(
	messages: RoomStore["history"],
): PromptHistoryEntry[] {
	return messages
		.flatMap((message) => {
			if (message.type !== "INPUT") return [];
			const text = message.parts
				.flatMap((part) =>
					part.type === "TEXT" ? [part.uiText || part.text] : [],
				)
				.join("");
			return text.trim() ? [{ id: message.id, text }] : [];
		})
		.reverse();
}
