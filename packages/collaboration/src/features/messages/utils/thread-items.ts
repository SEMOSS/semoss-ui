import type { PendingToolApproval } from "@/features/rooms/types/room";
import {
	delegationReplySchema,
	delegationRequestSchema,
	roomMessagePartSchema,
	type ValidatedRoomMessage,
	type ValidatedRoomMessagePart,
} from "../api/message-schemas";
import type {
	ConversationMessage,
	ConversationMessagePart,
	ConversationTool,
	ConversationToolStates,
	ConversationToolStatus,
	DelegationReply,
	DelegationRequest,
} from "../types/message";

type ToolResultPart = Extract<
	ValidatedRoomMessagePart,
	{ type: "TOOL_RESULT" }
>;

function parseMessageParts(
	message: ValidatedRoomMessage,
): ValidatedRoomMessagePart[] {
	return (message.parts ?? []).flatMap((part) => {
		const parsed = roomMessagePartSchema.safeParse(part);
		return parsed.success ? [parsed.data] : [];
	});
}

function isUserMessage(message: ValidatedRoomMessage): boolean {
	if (message.role) return message.role.toLowerCase() === "user";
	if (message.io) return message.io.toUpperCase() === "INPUT";
	return (message.type ?? "").toUpperCase().startsWith("INPUT");
}

function statusFromResult(
	result: ToolResultPart["toolResult"] | undefined,
): ConversationToolStatus {
	switch (result?.toolStatus) {
		case "error":
			return "FAILED";
		case "cancelled":
			return "CANCELLED";
		case "paused":
			return "INPUT_REQUIRED";
		default:
			return result ? "COMPLETED" : "QUEUED";
	}
}

function persistedPartToConversationPart(
	part: ValidatedRoomMessagePart,
	parentMessageId: string,
	toolResults: Map<string, ToolResultPart["toolResult"]>,
): ConversationMessagePart | null {
	switch (part.type) {
		case "TEXT": {
			const text = (part.uiText ?? part.text ?? "").trim();
			return text ? { type: "text", text } : null;
		}
		case "THINKING":
			return part.thinking.trim()
				? { type: "thinking", text: part.thinking }
				: null;
		case "MEDIA":
			return {
				type: "media",
				fileName: part.mediaInfo.fileName,
				fileLocation: part.mediaInfo.fileLocation ?? undefined,
				mimeType: part.mediaInfo.mimeType ?? undefined,
			};
		case "TOOL_CALL": {
			const result = toolResults.get(part.toolCall.id);
			return {
				type: "tool",
				tool: {
					id: part.toolCall.id,
					parentMessageId,
					name: part.toolCall.name,
					title:
						part.toolCall.title ??
						part.toolCall.original_name ??
						part.toolCall.name,
					description: part.toolCall.description ?? undefined,
					arguments:
						part.toolCall.arguments ??
						result?.toolParameterValues ??
						{},
					metadata: part.toolCall._meta ?? undefined,
					serverTool: part.toolCall.server_tool ?? undefined,
					status: statusFromResult(result),
					output: result?.output ?? undefined,
					error:
						result?.toolStatus === "error"
							? (result.output ?? undefined)
							: undefined,
				},
			};
		}
		case "TOOL_RESULT":
			return null;
	}
}

function delegationReply(
	message: ValidatedRoomMessage,
): DelegationReply | undefined {
	const ornaments = message.ornaments as { delegation?: unknown } | undefined;
	const parsed = delegationReplySchema.safeParse(ornaments?.delegation);
	if (!parsed.success) return undefined;
	const { question, text, files, ...rest } = parsed.data;
	return {
		...rest,
		question: question ?? undefined,
		text: text ?? undefined,
		files: files?.map(({ size, ...file }) => ({
			...file,
			size: size ?? undefined,
		})),
	};
}

function delegationRequest(
	message: ValidatedRoomMessage,
): DelegationRequest | undefined {
	const ornaments = message.ornaments as
		| { delegationRequest?: unknown }
		| undefined;
	const parsed = delegationRequestSchema.safeParse(
		ornaments?.delegationRequest,
	);
	if (!parsed.success) return undefined;
	const { context, responseFormat, dueAt, files, links, ...rest } =
		parsed.data;
	return {
		...rest,
		context: context ?? undefined,
		responseFormat: responseFormat ?? undefined,
		dueAt: dueAt ?? undefined,
		files: files?.map(({ size, ...file }) => ({
			...file,
			size: size ?? undefined,
		})),
		links: links?.map(({ title, ...link }) => ({
			...link,
			title: title ?? undefined,
		})),
	};
}

/** Convert one validated playground message into its UI representation. */
function conversationMessageFromPersisted(
	message: ValidatedRoomMessage,
	toolResults: Map<string, ToolResultPart["toolResult"]> = new Map(),
): ConversationMessage | null {
	if (message.visible === false) return null;
	const parts = parseMessageParts(message).flatMap((part) => {
		const converted = persistedPartToConversationPart(
			part,
			message.messageId,
			toolResults,
		);
		return converted ? [converted] : [];
	});
	const fallback = (
		isUserMessage(message) ? message.inputPrompt : message.content
	)?.trim();
	if (parts.length === 0 && fallback)
		parts.push({ type: "text", text: fallback });
	if (parts.length === 0) return null;

	return {
		id: message.messageId,
		role: isUserMessage(message) ? "user" : "assistant",
		parts,
		createdAt: message.dateCreated ?? undefined,
		parentMessageId: message.parentMessageId ?? undefined,
		visible: message.visible ?? true,
		delegationReply: delegationReply(message),
		delegationRequest: delegationRequest(message),
	};
}

/** Convert persisted room messages into ordered Playground-style messages. */
export function threadFromMessages(
	messages: ValidatedRoomMessage[],
): ConversationMessage[] {
	const parsedByMessage = messages.map(parseMessageParts);
	const toolResults = new Map<string, ToolResultPart["toolResult"]>();
	for (const parts of parsedByMessage) {
		for (const part of parts) {
			if (part.type === "TOOL_RESULT") {
				toolResults.set(part.toolResult.toolCallId, part.toolResult);
			}
		}
	}

	return messages.flatMap((message) => {
		const converted = conversationMessageFromPersisted(
			message,
			toolResults,
		);
		return converted ? [converted] : [];
	});
}

/** The user's own message, shown immediately while its agent run is submitted. */
export function optimisticUserMessage(
	text: string,
	files: File[] = [],
): ConversationMessage {
	return {
		id: `pending-user-${Date.now()}`,
		role: "user",
		parts: [
			{ type: "text", text },
			...files.map((file) => ({
				type: "media" as const,
				fileName: file.name,
				mimeType: file.type || undefined,
			})),
		],
		createdAt: new Date().toISOString(),
	};
}

/** Apply controller-owned tool states over durable/live transcript tools. */
export function mergeToolStates(
	messages: ConversationMessage[],
	states: ConversationToolStates,
): ConversationMessage[] {
	return messages.map((message) => ({
		...message,
		parts: message.parts.map((part) =>
			part.type === "tool" && states[part.tool.id]
				? {
						type: "tool" as const,
						tool: { ...part.tool, ...states[part.tool.id] },
					}
				: part,
		),
	}));
}

function toolFromApproval(approval: PendingToolApproval): ConversationTool {
	const originalName = approval.metadata?.SMSS_ORIGINAL_TOOL_NAME;
	const title = approval.metadata?.title;
	return {
		id: approval.toolId,
		roomId: approval.roomId,
		parentMessageId: approval.parentMessageId,
		name: approval.toolName,
		title:
			typeof title === "string"
				? title
				: typeof originalName === "string"
					? originalName
					: approval.toolName,
		arguments: approval.arguments,
		metadata: approval.metadata,
		uiUrl: approval.uiUrl,
		status: "INPUT_REQUIRED",
	};
}

export function pendingActionToolId(action: PendingToolApproval): string {
	return action.toolId;
}

/** Index every tool visible in the transcript for the workbench. */
export function toolsFromMessages(
	messages: ConversationMessage[],
	pendingApprovals: PendingToolApproval[] = [],
	states: ConversationToolStates = {},
): Record<string, ConversationTool> {
	const tools: Record<string, ConversationTool> = {};
	for (const message of messages) {
		for (const part of message.parts) {
			if (part.type === "tool") {
				tools[part.tool.id] = {
					...part.tool,
					...states[part.tool.id],
				};
			}
		}
	}
	for (const approval of pendingApprovals) {
		const existing = tools[approval.toolId];
		tools[approval.toolId] = {
			...toolFromApproval(approval),
			...existing,
			arguments: approval.arguments,
			metadata: approval.metadata ?? existing?.metadata,
			uiUrl: approval.uiUrl ?? existing?.uiUrl,
			roomId: approval.roomId ?? existing?.roomId,
			parentMessageId:
				approval.parentMessageId || existing?.parentMessageId || "",
			status: "INPUT_REQUIRED",
		};
	}
	return tools;
}
