import { normalizeTimestamp } from "@semoss/shared";
import { toolCallDisplayName } from "./lib/utils";
import type {
	ChatMessage,
	ChatMessagePart,
	PixelMessageMediaPart,
	PixelMessageTextPart,
	PixelMessageThinkingPart,
	PixelMessageToolCallPart,
	PixelMessageToolResultPart,
	RawMessagePart,
	RawPixelMessage,
} from "./types";

export interface NormalizedRoomHistory {
	messages: ChatMessage[];
	/** id of the last assistant message in the active chain — seeds ChatSession's parentMessageId so the next sendMessage() continues the thread instead of branching from root. */
	parentMessageId?: string;
	/** last engine id seen on an INPUT message, walking the active chain in order — seeds ChatSession.engineId on resume. */
	lastModelId?: string;
}

// PixelMessageOtherPart's `type` field is a plain `string`, so it overlaps
// every other member of RawMessagePart from TypeScript's point of view —
// switching/comparing on `part.type` alone can't fully narrow away
// PixelMessageOtherPart. Explicit "does this real field exist" predicates
// sidestep that ambiguity instead of casting at every call site.
function isTextPart(part: RawMessagePart): part is PixelMessageTextPart {
	return part.type === "TEXT";
}
function isThinkingPart(
	part: RawMessagePart,
): part is PixelMessageThinkingPart {
	return part.type === "THINKING" && "thinking" in part;
}
function isToolCallPart(
	part: RawMessagePart,
): part is PixelMessageToolCallPart {
	return part.type === "TOOL_CALL" && "toolCall" in part;
}
function isToolResultPart(
	part: RawMessagePart,
): part is PixelMessageToolResultPart {
	return part.type === "TOOL_RESULT" && "toolResult" in part;
}

function isMediaPart(part: RawMessagePart): part is PixelMessageMediaPart {
	return part.type === "MEDIA" && "mediaInfo" in part;
}

function toChatMessagePart(
	messageId: string,
	index: number,
	part: RawMessagePart,
): ChatMessagePart | null {
	if (isTextPart(part)) {
		return {
			type: "text",
			id: `${messageId}-part-${index}`,
			text: part.text ?? part.uiText ?? "",
		};
	}
	if (isThinkingPart(part)) {
		return {
			type: "thinking",
			id: `${messageId}-part-${index}`,
			text: part.thinking,
		};
	}
	if (isMediaPart(part)) {
		return {
			type: "media",
			id: `${messageId}-part-${index}`,
			mediaInfo: {
				fileName: part.mediaInfo.fileName,
				...(part.mediaInfo.fileLocation
					? { fileLocation: part.mediaInfo.fileLocation }
					: {}),
				...(part.mediaInfo.base64Data
					? { base64Data: part.mediaInfo.base64Data }
					: {}),
				...(part.mediaInfo.mimeType
					? { mimeType: part.mediaInfo.mimeType }
					: {}),
				...(part.mediaInfo.fileFormat
					? { fileFormat: part.mediaInfo.fileFormat }
					: {}),
				...(part.mediaInfo.mediaInputType
					? { mediaInputType: part.mediaInfo.mediaInputType }
					: {}),
			},
		};
	}
	if (isToolCallPart(part)) {
		return {
			type: "tool_call",
			id: part.toolCall.id,
			name: toolCallDisplayName(part.toolCall),
			arguments: part.toolCall.arguments,
			originalName: part.toolCall.original_name,
			title: part.toolCall.title,
			_meta: part.toolCall._meta,
		};
	}
	if (isToolResultPart(part)) {
		// The wire shape has no id of its own for a result, only the call
		// it answers — derive a stable one from that.
		return {
			type: "tool_result",
			id: `${part.toolResult.toolCallId}-result`,
			toolCallId: part.toolResult.toolCallId,
			output: part.toolResult.output,
			// ChatToolResultPart only models success/error; a historical
			// cancelled/paused tool call collapses into "error" here — real,
			// minor information loss, accepted since there's no
			// finer-grained status in the flat message-part model.
			status:
				part.toolResult.toolStatus === "success" ? "success" : "error",
		};
	}
	// Anything unrecognized.
	return null;
}

function toParts(raw: RawPixelMessage): ChatMessagePart[] {
	return raw.parts
		.map((part, index) => toChatMessagePart(raw.messageId, index, part))
		.filter((part): part is ChatMessagePart => part !== null);
}

function toChatMessage(raw: RawPixelMessage): ChatMessage {
	return {
		id: raw.messageId,
		role: raw.io === "INPUT" ? "user" : "assistant",
		parts: toParts(raw),
		// There's no persisted "this historical turn errored" signal in the
		// wire payload — playground's own data model has no such concept
		// either, so every historical message is "complete".
		status: "complete",
		timestamp: normalizeTimestamp(raw.dateCreated).toDate(),
		...(raw.feedback ? { feedback: { rating: raw.feedback.rating } } : {}),
	};
}

/**
 * The backend records a tool result as its own INPUT message
 * ("INPUT_TOOL_EXEC") rather than appending it onto the OUTPUT message that
 * made the call — but a live session accumulates thinking/tool_call/
 * tool_result/continuation-text all into one assistant ChatMessage per turn
 * (see ChatSession.executeToolRound). Resumed history has to fold the same
 * way, or MessageBubble's tool-status lookup (which only searches within one
 * message's own parts) never finds the matching tool_result, and the
 * tool-result-only message renders as an empty user bubble alongside a
 * ToolCallView stuck on "running" forever. Found by actually resuming a real
 * multi-round-trip room, not by inspection.
 */
function isToolResultOnlyContinuation(raw: RawPixelMessage): boolean {
	return raw.io === "INPUT" && raw.type === "INPUT_TOOL_EXEC";
}

function buildMessages(walked: RawPixelMessage[]): ChatMessage[] {
	const messages: ChatMessage[] = [];

	for (const raw of walked) {
		const last = messages[messages.length - 1];

		if (isToolResultOnlyContinuation(raw) && last?.role === "assistant") {
			// Folds into the assistant turn already in progress — never a
			// new bubble of its own.
			last.parts.push(...toParts(raw));
			continue;
		}

		if (raw.io === "OUTPUT" && last?.role === "assistant") {
			// A further OUTPUT with no genuine user message in between is
			// the same turn continuing (e.g. after a tool round) — same
			// message, not a new one.
			last.parts.push(...toParts(raw));
			// The rated response is the final OUTPUT in the merged turn —
			// carry its feedback onto the merged message too.
			if (raw.feedback) {
				last.feedback = { rating: raw.feedback.rating };
			}
			continue;
		}

		messages.push(toChatMessage(raw));
	}

	return messages;
}

/**
 * Flattens GetPlaygroundMessages' branching message tree into the linear
 * array @semoss/chat's ChatSession works with, walking only the "active"
 * branch at each fork — mirrors playground's real
 * `RoomStore.history`/`AbstractMessageStore.addChild` exactly (see
 * docs/chat-components/PLAN.md's room-history plan): a message links to its
 * parent via `parentMessageId`, falling back to `summaryLeafMessageId` for a
 * compacted thread, else it's root-level; and whichever child was linked
 * *last* at any node is that node's active branch (no timestamp comparison —
 * `addChild` unconditionally activates the newest child), so walking
 * "last child of last child..." from the last root-level message reproduces
 * the real active-thread walk without needing message-tree classes.
 */
export function normalizeRoomHistory(
	raw: RawPixelMessage[],
): NormalizedRoomHistory {
	const nodes = new Map<
		string,
		{ raw: RawPixelMessage; children: string[] }
	>();
	for (const message of raw) {
		nodes.set(message.messageId, { raw: message, children: [] });
	}

	const rootChildren: string[] = [];
	for (const message of raw) {
		const parent = message.parentMessageId
			? nodes.get(message.parentMessageId)
			: undefined;
		if (parent) {
			parent.children.push(message.messageId);
			continue;
		}

		const pseudoParent = message.summaryLeafMessageId
			? nodes.get(message.summaryLeafMessageId)
			: undefined;
		if (pseudoParent) {
			pseudoParent.children.push(message.messageId);
			continue;
		}

		rootChildren.push(message.messageId);
	}

	const walked: RawPixelMessage[] = [];
	let currentChildren = rootChildren;
	while (currentChildren.length > 0) {
		const activeId = currentChildren[currentChildren.length - 1];
		const node = activeId ? nodes.get(activeId) : undefined;
		if (!node) break;
		walked.push(node.raw);
		currentChildren = node.children;
	}

	let parentMessageId: string | undefined;
	for (let i = walked.length - 1; i >= 0; i--) {
		const message = walked[i];
		if (message?.io === "OUTPUT") {
			parentMessageId = message.messageId;
			break;
		}
	}

	let lastModelId: string | undefined;
	for (const message of walked) {
		if (message.io === "INPUT" && message.modelId) {
			lastModelId = message.modelId;
		}
	}

	return {
		messages: buildMessages(walked),
		parentMessageId,
		lastModelId,
	};
}
