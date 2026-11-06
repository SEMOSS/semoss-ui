import { chatPixels, exportMarkdown, runPixel } from "@semoss/sdk";
import { download } from "@semoss/sdk/react";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import type {
	AbstractPixelMessage,
	PixelMessageTextPart,
	PixelMessageToolCallPart,
} from "../../types";

/**
 * A room's conversation as markdown: each visible turn with its time, and the
 * tools a response used. Messages with nothing to show are left out.
 *
 * @param messages - The room's messages, as `GetPlaygroundMessages` returns them.
 * @returns The markdown; empty when there is nothing to export.
 */
export const formatConversation = (messages: AbstractPixelMessage[]): string =>
	messages
		.map((message) => {
			const timestamp = message.dateCreated
				? parseTimestampWithUtcDefault(message.dateCreated).format(
						"MMM D, YYYY h:mm A",
					)
				: null;
			const ts = timestamp ? `\n*${timestamp}*` : "";
			const text = message.parts
				?.filter((p): p is PixelMessageTextPart => p?.type === "TEXT")
				.map((p) => p.text)
				.join("");

			if (message.io === "INPUT") {
				return text ? `**You:**${ts}\n\n${text}` : null;
			}
			if (message.io === "OUTPUT") {
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

/**
 * Download a room's conversation as a Word or PDF document. The messages are
 * read in a fresh insight, and the file is made in and downloaded from that
 * same insight.
 *
 * @param roomId - The room.
 * @param format - Word or PDF.
 * @param appName - Names the file (`<appName> Room Export`).
 * @throws When the messages cannot be read, there is nothing to export, or
 * the file could not be made.
 */
export const downloadConversation = async (
	roomId: string,
	format: "word" | "pdf",
	appName: string,
): Promise<void> => {
	// a fresh insight, so the export does not touch the room's own
	const { errors, insightId, pixelReturn } = await runPixel<
		[AbstractPixelMessage[]]
	>(chatPixels.getMessages(roomId), "new");
	const messages = pixelReturn[0]?.output;
	if (errors.length > 0 || !messages) {
		throw new Error("Failed to fetch conversation messages");
	}

	const markdown = formatConversation(messages);
	if (!markdown) {
		throw new Error("No conversation content to download");
	}

	const fileKey = await exportMarkdown(insightId, {
		markdown: markdown,
		fileName: `${appName || "Chat"} Room Export`,
		format: format,
	});
	download(insightId, fileKey);
};
