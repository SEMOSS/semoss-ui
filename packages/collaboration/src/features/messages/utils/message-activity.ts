import type { ConversationMessage } from "../types/message";
import { findStreamingCodeFence } from "./streaming-code";

/** Describe the assistant's current activity without announcing every text update. */
export function messageActivityLabel(
	message: ConversationMessage,
): string | null {
	const live = message.live;
	if (!live || live.phase === "completed" || live.phase === "failed")
		return null;
	if (live.hasObservationIssue) return "Reconnecting to the response…";
	if (live.phase === "awaiting_approval") return null;

	for (let index = message.parts.length - 1; index >= 0; index -= 1) {
		const part = message.parts[index];
		if (part.type === "thinking" && part.state === "active") {
			return "Thinking…";
		}
		if (part.type === "text" && part.state === "active") {
			return findStreamingCodeFence(part.text)
				? "Writing code…"
				: "Writing response…";
		}
		if (
			part.type === "tool" &&
			(part.tool.status === "QUEUED" || part.tool.status === "RUNNING")
		) {
			return part.tool.title === "Loading tool…"
				? "Loading tool…"
				: `Using ${part.tool.title}…`;
		}
	}
	if (live.phase === "executing_tools") return "Using tools…";
	if (live.phase === "cancelling") return "Cancelling…";
	return "Thinking…";
}
