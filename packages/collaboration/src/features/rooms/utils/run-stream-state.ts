import type { AgentRunItemEvent } from "@semoss/sdk";
import type { ConversationPartStates } from "@/features/messages/types/message";

/** Fold one polled item event into the UI's active/completed phase map. */
export function applyRunItemPhase(
	current: ConversationPartStates,
	event: AgentRunItemEvent,
): ConversationPartStates {
	const itemId = event.type === "item.updated" ? event.itemId : event.item.id;
	const nextState = event.type === "item.completed" ? "complete" : "active";

	if (current[itemId] === nextState) return current;
	return { ...current, [itemId]: nextState };
}
