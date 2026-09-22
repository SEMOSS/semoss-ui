import type { ConversationMessage } from "../types/message";
import { messageActivityLabel } from "./message-activity";

function liveMessage(
	patch: Partial<ConversationMessage> = {},
): ConversationMessage {
	return {
		id: "live-playground-response",
		role: "assistant",
		parts: [],
		live: { phase: "streaming", hasObservationIssue: false },
		...patch,
	};
}

describe("messageActivityLabel", () => {
	it("covers thinking, writing, code, and tool phases", () => {
		expect(messageActivityLabel(liveMessage())).toBe("Thinking…");
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
								parentMessageId: "response-1",
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

	it("announces observation recovery and removes terminal activity", () => {
		expect(
			messageActivityLabel(
				liveMessage({
					live: { phase: "streaming", hasObservationIssue: true },
				}),
			),
		).toBe("Reconnecting to the response…");
		expect(
			messageActivityLabel(
				liveMessage({
					live: { phase: "completed", hasObservationIssue: false },
				}),
			),
		).toBeNull();
	});
});
