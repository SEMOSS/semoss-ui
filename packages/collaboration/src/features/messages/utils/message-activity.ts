import type { ConversationMessage } from "../types/message";
import { findStreamingCodeFence } from "./streaming-code";

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "CANCELLED"]);

/** Describe the assistant's current activity without announcing every text update. */
export function messageActivityLabel(
	message: ConversationMessage,
): string | null {
	const live = message.live;
	if (!live || TERMINAL_STATUSES.has(live.status)) return null;
	if (live.hasStreamGap) return "Catching up with the run…";
	if (live.status === "INPUT_REQUIRED") return null;

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
		if (
			part.type === "subagent" &&
			(part.status === "SUBMITTED" || part.status === "RUNNING")
		) {
			return `Waiting for ${part.label}…`;
		}
	}

	if (live.progress?.activity === "tool") {
		return live.progress.currentTool
			? `Using ${live.progress.currentTool}…`
			: "Using a tool…";
	}
	if (live.progress?.activity === "model") return "Thinking…";
	if (live.status === "SUBMITTED") return "Starting…";
	return "Working…";
}
