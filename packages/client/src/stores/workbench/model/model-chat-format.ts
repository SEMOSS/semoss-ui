import type { PlaygroundMessage, PlaygroundMessagePart } from "@/api/rooms";
import type {
	ModelChatAttachment,
	ModelChatMessage,
	ModelChatToolCall,
} from "./model-chat.types";

/**
 * Flatten a persisted message's ordered parts into the flat shape the
 * transcript renders. TEXT parts are concatenated (a turn is often split
 * across several), THINKING parts likewise, TOOL_CALL/TOOL_RESULT parts are
 * paired up by tool call id, and MEDIA parts become the turn's attachments.
 *
 * @name flattenMessageParts
 * @param parts - Ordered parts off a persisted message.
 * @return The joined text, thinking, paired tool calls, and attachments.
 */
const flattenMessageParts = (
	parts: PlaygroundMessagePart[],
): Pick<
	ModelChatMessage,
	"text" | "thinking" | "toolCalls" | "attachments"
> => {
	let text = "";
	let thinking = "";
	const toolCalls: ModelChatToolCall[] = [];
	const attachments: ModelChatAttachment[] = [];

	for (const part of parts) {
		if (part.type === "TEXT") {
			text += part.uiText ?? part.text ?? "";
		} else if (part.type === "THINKING") {
			thinking += part.thinking ?? "";
		} else if (part.type === "MEDIA" && part.mediaInfo) {
			attachments.push({
				fileName: part.mediaInfo.fileName,
				fileLocation: part.mediaInfo.fileLocation,
				mimeType: part.mediaInfo.mimeType,
			});
		} else if (part.type === "TOOL_CALL" && part.toolCall) {
			toolCalls.push({
				id: part.toolCall.id ?? `tool-${toolCalls.length}`,
				name:
					part.toolCall.title ??
					part.toolCall.original_name ??
					part.toolCall.name ??
					"Tool",
				arguments: part.toolCall.arguments,
			});
		} else if (part.type === "TOOL_RESULT" && part.toolResult) {
			// Results arrive after their call, so the match is already in the
			// list; an unmatched result still surfaces rather than vanishing.
			const match = toolCalls.find(
				(call) => call.id === part.toolResult?.toolCallId,
			);
			if (match) {
				match.output = part.toolResult.output;
			} else {
				toolCalls.push({
					id:
						part.toolResult.toolCallId ??
						`tool-${toolCalls.length}`,
					name: part.toolResult.toolName ?? "Tool",
					output: part.toolResult.output,
				});
			}
		}
	}

	return {
		text,
		thinking: thinking || undefined,
		toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
		attachments: attachments.length > 0 ? attachments : undefined,
	};
};

/**
 * Project one persisted room message into a transcript message.
 *
 * @name toModelChatMessage
 * @param message - A message as returned by AskRoom or GetPlaygroundMessages.
 * @param fallbackId - Id to use when the backend did not stamp one.
 * @return The transcript message.
 */
export const toModelChatMessage = (
	message: PlaygroundMessage,
	fallbackId: string,
): ModelChatMessage => ({
	id: message.messageId ?? fallbackId,
	io: message.io === "INPUT" ? "INPUT" : "OUTPUT",
	tokens: message.tokens,
	modelName: message.ornaments?.modelName,
	dateCreated: message.dateCreated,
	...flattenMessageParts(message.parts ?? []),
});

/**
 * Project a room's persisted history into the transcript, dropping the
 * messages the backend marks invisible (system notes and the hidden
 * cancellation pairs) so only real turns are rendered.
 *
 * @name toModelChatTranscript
 * @param messages - The room's messages, oldest first.
 * @return The transcript, oldest first.
 */
export const toModelChatTranscript = (
	messages: PlaygroundMessage[],
): ModelChatMessage[] =>
	messages
		.filter((message) => message.visible !== false)
		.map((message, index) =>
			toModelChatMessage(message, `message-${index}`),
		);

/**
 * The id the next turn should branch from — the last assistant message in the
 * transcript. Returns undefined for an empty room, which tells AskRoom to
 * append to the room's own latest message.
 *
 * @name findParentMessageId
 * @param messages - The current transcript, oldest first.
 * @return The durable id to branch from, or undefined.
 */
export const findParentMessageId = (
	messages: ModelChatMessage[],
): string | undefined => {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message.io === "OUTPUT" && !message.id.startsWith("pending-")) {
			return message.id;
		}
	}

	return undefined;
};

/** Character budget for the room name derived from the first prompt. */
const AUTO_NAME_MAX_LENGTH = 60;

/**
 * A room name derived from the conversation's first prompt. The backend has no
 * name-generation step wired up for this surface, so the client supplies one.
 *
 * @name deriveRoomName
 * @param prompt - The first prompt sent in the room.
 * @return The trimmed, collapsed name, or an empty string when there is
 * nothing usable to name the room after.
 */
export const deriveRoomName = (prompt: string): string =>
	prompt.replace(/\s+/g, " ").trim().slice(0, AUTO_NAME_MAX_LENGTH);
