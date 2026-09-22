import type {
	AgentRunItem,
	AgentRunItemsState,
	AgentRunProgress,
	AgentRunStatusValue,
	PendingAgentAction,
} from "@semoss/sdk";
import {
	roomMessagePartSchema,
	type ValidatedRoomMessage,
	type ValidatedRoomMessagePart,
} from "../api/message-schemas";
import type {
	ConversationMessage,
	ConversationMessagePart,
	ConversationPartStates,
	ConversationTool,
	ConversationToolStatus,
} from "../types/message";

type ToolResultPart = Extract<
	ValidatedRoomMessagePart,
	{ type: "TOOL_RESULT" }
>;

function parseParts(message: ValidatedRoomMessage): ValidatedRoomMessagePart[] {
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
		case "success":
			return "COMPLETED";
		case "error":
			return "FAILED";
		case "cancelled":
			return "CANCELLED";
		case "paused":
			return "INPUT_REQUIRED";
		default:
			return "QUEUED";
	}
}

function persistedPartToConversationPart(
	part: ValidatedRoomMessagePart,
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
					status: statusFromResult(result),
					output: result?.output ?? undefined,
					error:
						result?.toolStatus === "error"
							? (result.output ?? undefined)
							: undefined,
				},
			};
		}
		case "SUBAGENT":
			return {
				type: "subagent",
				id: part.subagent.id,
				label: part.subagent.alias ?? "Subagent",
				status: part.subagent.status,
				result: part.subagent.resultPreview ?? undefined,
				error: part.subagent.error ?? undefined,
			};
		case "TOOL_RESULT":
			return null;
	}
}

/** Convert persisted room messages into ordered Playground-style messages. */
export function threadFromMessages(
	messages: ValidatedRoomMessage[],
): ConversationMessage[] {
	const parsedByMessage = messages.map(parseParts);
	const toolResults = new Map<string, ToolResultPart["toolResult"]>();

	for (const parts of parsedByMessage) {
		for (const part of parts) {
			if (part.type === "TOOL_RESULT") {
				toolResults.set(part.toolResult.toolCallId, part.toolResult);
			}
		}
	}

	return messages.flatMap((message, index) => {
		const parts = parsedByMessage[index].flatMap((part) => {
			const converted = persistedPartToConversationPart(
				part,
				toolResults,
			);
			return converted ? [converted] : [];
		});
		const fallback = (
			isUserMessage(message) ? message.inputPrompt : message.content
		)?.trim();

		if (parts.length === 0 && fallback) {
			parts.push({ type: "text", text: fallback });
		}
		if (parts.length === 0) return [];

		return [
			{
				id: message.messageId,
				role: isUserMessage(message) ? "user" : "assistant",
				parts,
				createdAt: message.dateCreated ?? undefined,
			} satisfies ConversationMessage,
		];
	});
}

function liveItemToPart(
	item: AgentRunItem,
	pendingActions: PendingAgentAction[],
	itemPhases: ConversationPartStates,
): ConversationMessagePart | null {
	switch (item.kind) {
		case "message":
			return item.text.trim()
				? {
						type: "text",
						text: item.text,
						state: itemPhases[item.id] ?? "active",
					}
				: null;
		case "reasoning":
			return item.summary.trim()
				? {
						type: "thinking",
						text: item.summary,
						state: itemPhases[item.id] ?? "active",
					}
				: null;
		case "tool": {
			const isPending = pendingActions.some(
				(action) => action.toolCallId === item.id,
			);
			const originalName = item.metadata?.SMSS_ORIGINAL_TOOL_NAME;
			const displayName =
				item.title ??
				(typeof originalName === "string" ? originalName : undefined) ??
				(item.status === "QUEUED" || item.status === "RUNNING"
					? "Loading tool…"
					: item.name);
			return {
				type: "tool",
				tool: {
					id: item.id,
					name: item.name,
					title: displayName,
					arguments: item.arguments,
					metadata: item.metadata,
					status: isPending ? "INPUT_REQUIRED" : item.status,
					output: item.output,
					error: item.error,
					durationMs: item.durationMs,
				},
			};
		}
		case "subagent":
			return {
				type: "subagent",
				id: item.id,
				label: item.alias ?? "Subagent",
				status: item.status,
				result: item.resultPreview,
				error: item.error,
			};
		case "progress":
			return null;
	}
}

export interface LiveConversationRun {
	items: AgentRunItemsState;
	itemPhases: ConversationPartStates;
	pendingActions: PendingAgentAction[];
	status: AgentRunStatusValue | null;
	progress: AgentRunProgress | null;
	hasStreamGap: boolean;
}

function toolFromPendingAction(action: PendingAgentAction): ConversationTool {
	const id = pendingActionToolId(action);
	const metadataTitle = action.toolMeta?.title;
	const originalName = action.toolMeta?.SMSS_ORIGINAL_TOOL_NAME;
	return {
		id,
		name: action.toolName ?? "tool",
		title:
			typeof metadataTitle === "string"
				? metadataTitle
				: typeof originalName === "string"
					? originalName
					: (action.toolName ?? "Tool approval"),
		arguments: action.editedArgs ?? action.toolArgs ?? {},
		metadata: action.toolMeta ?? undefined,
		status: "INPUT_REQUIRED",
	};
}

/** Convert the current run's ordered items into one live assistant message. */
export function messageFromRunItems({
	items,
	itemPhases,
	pendingActions,
	status,
	progress,
	hasStreamGap,
}: LiveConversationRun): ConversationMessage | null {
	if (!status) return null;

	const parts = items.itemOrder.flatMap((id) => {
		const item = items.itemsById[id];
		if (!item) return [];
		const part = liveItemToPart(item, pendingActions, itemPhases);
		return part ? [part] : [];
	});
	const visibleToolIds = new Set(
		parts.flatMap((part) => (part.type === "tool" ? [part.tool.id] : [])),
	);
	for (const action of pendingActions) {
		const id = pendingActionToolId(action);
		if (!visibleToolIds.has(id)) {
			parts.push({ type: "tool", tool: toolFromPendingAction(action) });
		}
	}

	return {
		id: "live-agent-response",
		role: "assistant",
		parts,
		live: {
			status,
			progress: progress ?? undefined,
			hasStreamGap,
		},
	};
}

/** The user's own message, shown immediately while the run is submitted. */
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

/** Stable panel identity even when a durable action has no streamed tool id. */
export function pendingActionToolId(action: PendingAgentAction): string {
	return action.toolCallId ?? `pending-action:${action.actionId}`;
}

/** Index every tool currently visible in the transcript for the workbench. */
export function toolsFromMessages(
	messages: ConversationMessage[],
	pendingActions: PendingAgentAction[] = [],
): Record<string, ConversationTool> {
	const tools: Record<string, ConversationTool> = {};
	for (const message of messages) {
		for (const part of message.parts) {
			if (part.type === "tool") tools[part.tool.id] = part.tool;
		}
	}
	for (const action of pendingActions) {
		const id = pendingActionToolId(action);
		const existing = tools[id];
		tools[id] = {
			...toolFromPendingAction(action),
			...existing,
			id,
			name: action.toolName ?? existing?.name ?? "tool",
			arguments:
				action.editedArgs ??
				action.toolArgs ??
				existing?.arguments ??
				{},
			metadata: action.toolMeta ?? existing?.metadata ?? undefined,
			status: "INPUT_REQUIRED",
		};
	}
	return tools;
}
