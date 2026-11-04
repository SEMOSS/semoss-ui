import type { ConversationMessage } from "../types/message";
import { messageHasVisiblePart } from "./message-presentation";
import { findStreamingCodeFence } from "./streaming-code";
import { thoughtHeading } from "./thought-heading";

/** Describe the assistant's current activity without announcing every text update. */
export function messageActivityLabel(
	message: ConversationMessage,
): string | null {
	const live = message.live;
	if (
		!live ||
		live.phase === "completed" ||
		live.phase === "failed" ||
		live.phase === "cancelled"
	)
		return null;
	if (live.hasObservationIssue) return null;
	if (live.phase === "awaiting_approval") return null;
	if (live.phase === "cancelling") return "Cancelling…";

	for (let index = message.parts.length - 1; index >= 0; index -= 1) {
		const part = message.parts[index];
		if (
			part.type === "thinking" &&
			part.state === "active" &&
			part.text.trim()
		) {
			const heading = thoughtHeading(part.text);
			return heading ? `${heading}\u2026` : "Thinking…";
		}
		if (
			part.type === "text" &&
			part.state === "active" &&
			part.text.trim()
		) {
			return findStreamingCodeFence(part.text)
				? "Writing code…"
				: "Writing response…";
		}
		if (
			part.type === "tool" &&
			messageHasVisiblePart(part) &&
			(part.tool.status === "QUEUED" || part.tool.status === "RUNNING")
		) {
			if (part.tool.title === "Loading tool…") return "Loading tool…";
			// parallel calls of one tool read as one step with a count
			const running = message.parts.filter(
				(other) =>
					other.type === "tool" &&
					other.tool.title === part.tool.title &&
					(other.tool.status === "QUEUED" ||
						other.tool.status === "RUNNING"),
			).length;
			return running > 1
				? `${part.tool.title} (${running} running)\u2026`
				: `${part.tool.title}\u2026`;
		}
	}
	return message.parts.some(messageHasVisiblePart) ||
		live.phase === "executing_tools"
		? "Working…"
		: "Waiting for response…";
}

/** The current visible thinking/tool already explains progress in context. */
export function hasInlineActivity(message: ConversationMessage): boolean {
	if (message.live?.phase === "cancelling") return false;
	for (let index = message.parts.length - 1; index >= 0; index -= 1) {
		const part = message.parts[index];
		if (!messageHasVisiblePart(part)) continue;
		if (
			(part.type === "text" || part.type === "thinking") &&
			part.state === "active"
		)
			return part.type === "thinking";
		if (
			part.type === "tool" &&
			(part.tool.status === "RUNNING" || part.tool.status === "QUEUED")
		)
			return true;
	}
	return false;
}
