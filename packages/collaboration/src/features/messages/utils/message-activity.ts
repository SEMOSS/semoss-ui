import { getToolLoadingMessage } from "@/features/tools/utils/tool-metadata";
import type { ConversationMessage } from "../types/message";
import { messageHasVisiblePart } from "./message-presentation";
import { findStreamingCodeFence } from "./streaming-code";

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

	// Model activity is authoritative when a prior tool event is still reconciling.
	if (live.activity !== "model") {
		const activeTools = message.parts.flatMap((part) =>
			part.type === "tool" &&
			messageHasVisiblePart(part) &&
			(part.tool.status === "QUEUED" || part.tool.status === "RUNNING")
				? [part.tool]
				: [],
		);
		if (activeTools.length === 1)
			return getToolLoadingMessage(activeTools[0]);
		if (activeTools.length > 1) {
			const running = activeTools.filter(
				(tool) => tool.status === "RUNNING",
			);
			const queued = activeTools.length - running.length;
			const descriptions = new Set(running.map(getToolLoadingMessage));
			const activity =
				descriptions.size === 1
					? [...descriptions][0]
					: running.length
						? "Running tool calls…"
						: "Preparing tool calls…";
			return `${activity} · ${running.length} running${queued ? ` · ${queued} queued` : ""}`;
		}
	}

	for (let index = message.parts.length - 1; index >= 0; index -= 1) {
		const part = message.parts[index];
		if (
			part.type === "thinking" &&
			part.state === "active" &&
			part.text.trim()
		) {
			return "Thinking…";
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
	}
	if (live.activity === "model") return "Preparing a response…";
	return message.parts.some(messageHasVisiblePart) ||
		live.phase === "executing_tools"
		? "Working…"
		: "Waiting for response…";
}

/** The current visible thinking/tool already explains progress in context. */
export function hasInlineActivity(message: ConversationMessage): boolean {
	if (
		message.live?.phase === "cancelling" ||
		message.live?.activity === "model"
	)
		return false;
	const activeTools = message.parts.filter(
		(part) =>
			part.type === "tool" &&
			messageHasVisiblePart(part) &&
			(part.tool.status === "RUNNING" || part.tool.status === "QUEUED"),
	);
	// A single row describes one call; concurrent calls need a visible aggregate.
	if (activeTools.length) return activeTools.length === 1;
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
