import { createCommand } from "lexical";
import type { RoomStore } from "../room/room.store";

/** One user-authored prompt on the active conversation branch. */
export interface PromptHistoryEntry {
	/** The input message's id. */
	id: string;
	/** The prompt as the user saw it. */
	text: string;
}

/**
 * Ends prompt history browsing on submit, without restoring the saved draft
 * over the text that was just sent.
 */
export const RESET_PROMPT_HISTORY_COMMAND = createCommand<void>(
	"RESET_PROMPT_HISTORY",
);

/**
 * List the prompts the user wrote on the active branch, newest first. Only
 * text parts count (their displayed `uiText` when set), so tool and media
 * data are never recalled; empty prompts are skipped.
 *
 * @param messages - The room's history.
 * @returns The prompts, newest first.
 */
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
