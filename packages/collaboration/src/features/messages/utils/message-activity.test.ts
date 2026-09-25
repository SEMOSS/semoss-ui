import type { ConversationMessage } from "../types/message";
import { hasInlineActivity, messageActivityLabel } from "./message-activity";

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
		expect(messageActivityLabel(liveMessage())).toBe(
			"Waiting for response…",
		);
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

	it("leaves recovery to the actionable notice and removes terminal activity", () => {
		expect(
			messageActivityLabel(
				liveMessage({
					live: { phase: "streaming", hasObservationIssue: true },
				}),
			),
		).toBeNull();
		expect(
			messageActivityLabel(
				liveMessage({
					live: { phase: "completed", hasObservationIssue: false },
				}),
			),
		).toBeNull();
	});
});

it("prioritizes cancellation over an unfinished text part", () => {
	expect(
		messageActivityLabel(
			liveMessage({
				parts: [{ type: "text", text: "Partial", state: "active" }],
				live: { phase: "cancelling", hasObservationIssue: false },
			}),
		),
	).toBe("Cancelling…");
});

it("uses inline activity for visible thinking and tools, with a fallback between steps", () => {
	const thinking = liveMessage({
		parts: [{ type: "thinking", text: "Plan", state: "active" }],
	});
	expect(hasInlineActivity(thinking)).toBe(true);
	expect(
		hasInlineActivity({
			...thinking,
			parts: [{ type: "thinking", text: "Plan", state: "complete" }],
		}),
	).toBe(false);
	expect(
		messageActivityLabel({
			...thinking,
			parts: [{ type: "thinking", text: "Plan", state: "complete" }],
		}),
	).toBe("Working…");
	const tool = {
		id: "tool",
		parentMessageId: "response",
		name: "search",
		title: "Search",
		arguments: {},
		status: "RUNNING" as const,
	};
	expect(
		hasInlineActivity(liveMessage({ parts: [{ type: "tool", tool }] })),
	).toBe(true);
	expect(
		hasInlineActivity(
			liveMessage({
				parts: [
					{
						type: "tool",
						tool: {
							...tool,
							metadata: {
								SMSS_MCP_UI: { displayLocation: "hidden" },
							},
						},
					},
				],
			}),
		),
	).toBe(false);
	expect(
		hasInlineActivity(
			liveMessage({
				parts: [{ type: "text", text: "Answer", state: "active" }],
			}),
		),
	).toBe(false);
	expect(
		hasInlineActivity({
			...thinking,
			live: { phase: "cancelling", hasObservationIssue: false },
		}),
	).toBe(false);
});

it.each(["completed", "cancelled", "failed", "awaiting_approval"] as const)(
	"removes the fallback spinner during %s",
	(phase) => {
		expect(
			messageActivityLabel(
				liveMessage({ live: { phase, hasObservationIssue: false } }),
			),
		).toBeNull();
	},
);
