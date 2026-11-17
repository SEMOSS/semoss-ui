import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import type {
	AbstractPixelMessage,
	PixelMessageTextPart,
	PixelMessageToolCallPart,
} from "../../../types";

/**
 * The text of a message's TEXT parts, joined.
 *
 * @param message - The message.
 * @returns Its text, or an empty string.
 */
const readText = (message: AbstractPixelMessage): string =>
	message.parts
		?.filter((p): p is PixelMessageTextPart => p?.type === "TEXT")
		.map((p) => p.text)
		.join("") ?? "";

/**
 * A room's conversation as markdown, for a Word or PDF download: each
 * message's text under who wrote it and when, and the tools a reply used.
 * Messages with neither text nor tools are left out.
 *
 * @param messages - The room's messages, as `GetPlaygroundMessages` returns them.
 * @returns The markdown, or an empty string when there is nothing to show.
 */
export const formatConversationMarkdown = (
	messages: readonly AbstractPixelMessage[],
): string =>
	messages
		.map((message) => {
			const timestamp = message.dateCreated
				? parseTimestampWithUtcDefault(message.dateCreated).format(
						"MMM D, YYYY h:mm A",
					)
				: null;
			const ts = timestamp ? `\n*${timestamp}*` : "";

			if (message.io === "INPUT") {
				const text = readText(message);
				return text ? `**You:**${ts}\n\n${text}` : null;
			}
			if (message.io === "OUTPUT") {
				const text = readText(message);
				const tools: string[] =
					message.parts
						?.filter(
							(p): p is PixelMessageToolCallPart =>
								p?.type === "TOOL_CALL",
						)
						.map((p) => p.toolCall.title || p.toolCall.name)
						.filter(Boolean) ?? [];
				const toolLine =
					tools.length > 0
						? `\n\n*Tools used: ${tools.join(", ")}*`
						: "";
				return text || tools.length > 0
					? `**Assistant:**${ts}\n\n${text}${toolLine}`
					: null;
			}
			return null;
		})
		.filter(Boolean)
		.join("\n\n---\n\n");
