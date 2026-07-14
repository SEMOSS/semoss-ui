import { describe, expect, it } from "vitest";
import { normalizeRoomHistory } from "./history";
import type { RawPixelMessage } from "./types";

function rawMessage(
	overrides: Partial<RawPixelMessage> & { messageId: string },
): RawPixelMessage {
	return {
		io: "INPUT",
		dateCreated: "2026-06-22 12:00:00",
		parts: [],
		...overrides,
	};
}

describe("normalizeRoomHistory", () => {
	it("walks a linear user -> assistant thread", () => {
		const raw = [
			rawMessage({
				messageId: "m1",
				io: "INPUT",
				modelId: "engine-1",
				parts: [{ type: "TEXT", text: "hello" }],
			}),
			rawMessage({
				messageId: "m2",
				io: "OUTPUT",
				parentMessageId: "m1",
				parts: [{ type: "TEXT", text: "hi there" }],
			}),
		];

		const result = normalizeRoomHistory(raw);

		expect(result.messages.map((m) => m.id)).toEqual(["m1", "m2"]);
		expect(result.messages[0]?.role).toBe("user");
		expect(result.messages[1]?.role).toBe("assistant");
		expect(result.messages[0]?.parts[0]).toMatchObject({
			type: "text",
			text: "hello",
		});
		expect(result.parentMessageId).toBe("m2");
		expect(result.lastModelId).toBe("engine-1");
	});

	it("follows the last-linked child as the active branch (regenerate)", () => {
		const raw = [
			rawMessage({ messageId: "m1", io: "INPUT" }),
			rawMessage({
				messageId: "m2a",
				io: "OUTPUT",
				parentMessageId: "m1",
				parts: [{ type: "TEXT", text: "first attempt" }],
			}),
			rawMessage({
				messageId: "m2b",
				io: "OUTPUT",
				parentMessageId: "m1",
				parts: [{ type: "TEXT", text: "regenerated" }],
			}),
		];

		const result = normalizeRoomHistory(raw);

		// m2a is linked before m2b under the same parent, so m2b -- the
		// last-linked child -- is the active branch; m2a is dropped.
		expect(result.messages.map((m) => m.id)).toEqual(["m1", "m2b"]);
		expect(result.messages[1]?.parts[0]).toMatchObject({
			text: "regenerated",
		});
	});

	it("normalizes a tool-call round trip across three turns into one assistant message", () => {
		// Real backend shape: the tool result is its own INPUT_TOOL_EXEC
		// message, not appended onto the OUTPUT that made the call — but a
		// live session accumulates the whole round into one assistant
		// ChatMessage, so resumed history must fold the same way (see
		// isToolResultOnlyContinuation's doc comment in history.ts).
		const raw = [
			rawMessage({ messageId: "m1", io: "INPUT", modelId: "engine-1" }),
			rawMessage({
				messageId: "m2",
				io: "OUTPUT",
				parentMessageId: "m1",
				parts: [
					{
						type: "TOOL_CALL",
						toolCall: {
							id: "call-1",
							name: "lookupClaimStatus",
							arguments: { claimId: "482" },
						},
					},
				],
			}),
			rawMessage({
				messageId: "m3",
				io: "INPUT",
				type: "INPUT_TOOL_EXEC",
				parentMessageId: "m2",
				modelId: "engine-2",
				parts: [
					{
						type: "TOOL_RESULT",
						toolResult: {
							toolCallId: "call-1",
							toolName: "lookupClaimStatus",
							output: "in review",
							toolStatus: "success",
						},
					},
				],
			}),
			rawMessage({
				messageId: "m4",
				io: "OUTPUT",
				parentMessageId: "m3",
				parts: [{ type: "TEXT", text: "Claim 482 is in review." }],
			}),
		];

		const result = normalizeRoomHistory(raw);

		// m2/m3/m4 all fold into the one assistant message started at m2 —
		// no separate bubble for the tool-result continuation.
		expect(result.messages.map((m) => m.id)).toEqual(["m1", "m2"]);
		expect(result.messages[0]?.role).toBe("user");
		expect(result.messages[1]?.role).toBe("assistant");
		expect(result.messages[1]?.parts).toMatchObject([
			{ type: "tool_call", id: "call-1", name: "lookupClaimStatus" },
			{ type: "tool_result", toolCallId: "call-1", status: "success" },
			{ type: "text", text: "Claim 482 is in review." },
		]);
		// The real backend message id of the last OUTPUT (m4), not the
		// merged UI message's id (m2) — sendMessage() needs the actual
		// backend id to continue the thread via the API.
		expect(result.parentMessageId).toBe("m4");
		// last INPUT walked is m3, so its modelId wins over m1's.
		expect(result.lastModelId).toBe("engine-2");
	});

	it("keeps folding across more than one tool round into the same assistant message", () => {
		const raw = [
			rawMessage({ messageId: "m1", io: "INPUT" }),
			rawMessage({
				messageId: "m2",
				io: "OUTPUT",
				parentMessageId: "m1",
				parts: [
					{
						type: "TOOL_CALL",
						toolCall: {
							id: "call-1",
							name: "getStructure",
							arguments: {},
						},
					},
				],
			}),
			rawMessage({
				messageId: "m3",
				io: "INPUT",
				type: "INPUT_TOOL_EXEC",
				parentMessageId: "m2",
				parts: [
					{
						type: "TOOL_RESULT",
						toolResult: {
							toolCallId: "call-1",
							toolName: "getStructure",
							output: "",
							toolStatus: "success",
						},
					},
				],
			}),
			rawMessage({
				messageId: "m4",
				io: "OUTPUT",
				parentMessageId: "m3",
				parts: [
					{
						type: "TOOL_CALL",
						toolCall: {
							id: "call-2",
							name: "runQuery",
							arguments: {},
						},
					},
				],
			}),
			rawMessage({
				messageId: "m5",
				io: "INPUT",
				type: "INPUT_TOOL_EXEC",
				parentMessageId: "m4",
				parts: [
					{
						type: "TOOL_RESULT",
						toolResult: {
							toolCallId: "call-2",
							toolName: "runQuery",
							output: "5 rows",
							toolStatus: "success",
						},
					},
				],
			}),
			rawMessage({
				messageId: "m6",
				io: "OUTPUT",
				parentMessageId: "m5",
				parts: [{ type: "TEXT", text: "Here are the results." }],
			}),
		];

		const result = normalizeRoomHistory(raw);

		expect(result.messages.map((m) => m.id)).toEqual(["m1", "m2"]);
		expect(result.messages[1]?.parts.map((p) => p.type)).toEqual([
			"tool_call",
			"tool_result",
			"tool_call",
			"tool_result",
			"text",
		]);
		// Both tool calls resolve against a matching result within the same
		// merged message, matching MessageBubble's findToolResultStatus.
		expect(result.messages[1]?.parts[1]).toMatchObject({
			toolCallId: "call-1",
			status: "success",
		});
		expect(result.messages[1]?.parts[3]).toMatchObject({
			toolCallId: "call-2",
			status: "success",
		});
	});

	it("collapses a cancelled/paused tool result into error status", () => {
		const raw = [
			rawMessage({ messageId: "m1", io: "INPUT" }),
			rawMessage({
				messageId: "m2",
				io: "INPUT",
				parentMessageId: "m1",
				parts: [
					{
						type: "TOOL_RESULT",
						toolResult: {
							toolCallId: "call-1",
							toolName: "lookupClaimStatus",
							output: "",
							toolStatus: "cancelled",
						},
					},
				],
			}),
		];

		const result = normalizeRoomHistory(raw);

		expect(result.messages[1]?.parts[0]).toMatchObject({
			type: "tool_result",
			status: "error",
		});
	});

	it("links an orphaned/compacted message via summaryLeafMessageId", () => {
		const raw = [
			rawMessage({ messageId: "m1", io: "INPUT" }),
			rawMessage({
				messageId: "m2",
				io: "OUTPUT",
				parentMessageId: "m1",
				parts: [{ type: "TEXT", text: "summary leaf" }],
			}),
			rawMessage({
				messageId: "m3",
				io: "INPUT",
				// no parentMessageId — the real parent was compacted away,
				// only the summary leaf pointer survives.
				summaryLeafMessageId: "m2",
				parts: [{ type: "TEXT", text: "after compaction" }],
			}),
		];

		const result = normalizeRoomHistory(raw);

		expect(result.messages.map((m) => m.id)).toEqual(["m1", "m2", "m3"]);
	});

	it("drops MEDIA and unrecognized parts", () => {
		const raw = [
			rawMessage({
				messageId: "m1",
				io: "INPUT",
				// biome-ignore lint/suspicious/noExplicitAny: exercising an unrecognized part type on purpose
				parts: [{ type: "MEDIA" } as any],
			}),
		];

		const result = normalizeRoomHistory(raw);

		expect(result.messages[0]?.parts).toEqual([]);
	});

	it("returns no parentMessageId/lastModelId for an empty history", () => {
		const result = normalizeRoomHistory([]);

		expect(result.messages).toEqual([]);
		expect(result.parentMessageId).toBeUndefined();
		expect(result.lastModelId).toBeUndefined();
	});
});
