import type { ConversationMessage } from "../types/message";
import { messageActivityLabel } from "./message-activity";

function liveMessage(
	patch: Partial<ConversationMessage> = {},
): ConversationMessage {
	return {
		id: "live-agent-response",
		role: "assistant",
		parts: [],
		live: {
			status: "RUNNING",
			hasStreamGap: false,
		},
		...patch,
	};
}

describe("messageActivityLabel", () => {
	it("covers starting, thinking, writing, code, and tool phases", () => {
		expect(
			messageActivityLabel(
				liveMessage({
					live: { status: "SUBMITTED", hasStreamGap: false },
				}),
			),
		).toBe("Starting…");
		expect(
			messageActivityLabel(
				liveMessage({
					parts: [
						{ type: "thinking", text: "Plan", state: "active" },
					],
				}),
			),
		).toBe("Thinking…");
		expect(
			messageActivityLabel(
				liveMessage({
					parts: [{ type: "text", text: "Answer", state: "active" }],
				}),
			),
		).toBe("Writing response…");
		expect(
			messageActivityLabel(
				liveMessage({
					parts: [
						{
							type: "text",
							text: "```ts\nconst value = 1;",
							state: "active",
						},
					],
				}),
			),
		).toBe("Writing code…");
		expect(
			messageActivityLabel(
				liveMessage({
					parts: [
						{
							type: "tool",
							tool: {
								id: "tool-1",
								name: "search",
								title: "Search documents",
								arguments: {},
								status: "RUNNING",
							},
						},
					],
				}),
			),
		).toBe("Using Search documents…");
	});

	it("announces reconciliation and removes terminal activity", () => {
		expect(
			messageActivityLabel(
				liveMessage({
					live: { status: "RUNNING", hasStreamGap: true },
				}),
			),
		).toBe("Catching up with the run…");
		expect(
			messageActivityLabel(
				liveMessage({
					live: { status: "CANCELLED", hasStreamGap: false },
				}),
			),
		).toBeNull();
	});
});
