import type { AgentRunItemEvent } from "@semoss/sdk";
import { applyRunItemPhase } from "./run-stream-state";

const messageItem = {
	id: "message-1",
	kind: "message",
	role: "assistant",
	text: "Hello",
} as const;

describe("applyRunItemPhase", () => {
	it("tracks started, updated, and completed phases in place", () => {
		const started = applyRunItemPhase({}, {
			version: 1,
			eventId: "event-1",
			sequence: 1,
			runId: "run-1",
			timestamp: "2026-09-21T12:00:00.000Z",
			type: "item.started",
			item: messageItem,
		} satisfies AgentRunItemEvent);
		const updated = applyRunItemPhase(started, {
			version: 1,
			eventId: "event-2",
			sequence: 2,
			runId: "run-1",
			timestamp: "2026-09-21T12:00:01.000Z",
			type: "item.updated",
			itemId: messageItem.id,
			kind: "message",
			delta: " world",
		} satisfies AgentRunItemEvent);
		const completed = applyRunItemPhase(updated, {
			version: 1,
			eventId: "event-3",
			sequence: 3,
			runId: "run-1",
			timestamp: "2026-09-21T12:00:02.000Z",
			type: "item.completed",
			item: { ...messageItem, text: "Hello world" },
		} satisfies AgentRunItemEvent);

		expect(started[messageItem.id]).toBe("active");
		expect(updated).toBe(started);
		expect(completed[messageItem.id]).toBe("complete");
	});
});
