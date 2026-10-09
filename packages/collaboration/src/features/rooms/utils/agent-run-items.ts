import { isRequestUserInputAction } from "@semoss/sdk";
import type {
	ConversationMessagePart,
	ConversationTool,
} from "@/features/messages/types/message";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { resolveToolUiUrl } from "@/features/tools/utils/tool-metadata";
import {
	type AgentAction,
	type AgentEvent,
	type AgentItem,
	agentItemSchema,
} from "../api/agent-run-api";

export interface RunItemState {
	item: AgentItem;
	complete: boolean;
}

/** Reduce full items, deltas, and patches without dropping non-streamed text. */
export function applyRunEvent(
	items: Map<string, RunItemState>,
	event: AgentEvent,
): void {
	if (event.type !== "item.updated") {
		items.set(event.item.id, {
			item: event.item,
			complete: event.type === "item.completed",
		});
		return;
	}
	const current = items.get(event.itemId);
	if (!current) return;
	let item = current.item;
	if (event.delta !== undefined) {
		if (item.kind === "message")
			item = { ...item, text: item.text + event.delta };
		if (item.kind === "reasoning")
			item = { ...item, summary: item.summary + event.delta };
	}
	if (event.patch) item = agentItemSchema.parse({ ...item, ...event.patch });
	items.set(event.itemId, { ...current, item });
}

/** Map a harness-owned tool onto the existing tool workbench. */
export function runItemTool(
	item: Extract<AgentItem, { kind: "tool" }>,
): ConversationTool {
	const originalName = item.metadata?.SMSS_ORIGINAL_TOOL_NAME;
	const tool: ConversationTool = {
		id: item.id,
		parentMessageId: "",
		name: item.name,
		title:
			item.title ||
			(typeof originalName === "string" ? originalName : item.name),
		arguments: item.arguments,
		metadata: item.metadata ?? undefined,
		status: item.status,
		output: item.output ?? undefined,
		error: item.error ?? undefined,
		durationMs: item.durationMs ?? undefined,
	};
	return { ...tool, uiUrl: resolveToolUiUrl(tool) };
}

export function runItemPart({
	item,
	complete,
}: RunItemState): ConversationMessagePart | null {
	const state = complete ? "complete" : "active";
	switch (item.kind) {
		case "message":
			return { type: "text", text: item.text, state, renderKey: item.id };
		case "reasoning":
			return {
				type: "thinking",
				text: item.summary,
				state,
				renderKey: item.id,
			};
		case "tool":
			return {
				type: "tool",
				tool: runItemTool(item),
				renderKey: item.id,
			};
		default:
			return null;
	}
}

/** Preserve action/run identity, including approvals raised by a child run. */
export function runActionApproval(action: AgentAction): PendingToolApproval {
	const name = action.toolName ?? "Tool";
	const requiresResponse = isRequestUserInputAction({
		toolName: action.toolName ?? null,
		toolMeta: action.toolMeta,
	});
	const tool = runItemTool({
		id: action.toolCallId || action.actionId,
		kind: "tool",
		name,
		arguments: action.editedArgs ?? action.toolArgs ?? {},
		metadata: action.toolMeta,
		status: "INPUT_REQUIRED",
	});
	return {
		toolId: tool.id,
		actionId: action.actionId,
		runId: action.runId,
		parentMessageId: action.parentMessageId ?? "",
		toolName: name,
		arguments: tool.arguments,
		metadata: tool.metadata,
		uiUrl: action.uiUrl || tool.uiUrl,
		requiresResponse,
	};
}
