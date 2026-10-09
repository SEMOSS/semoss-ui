import { roomMessageSchema } from "../api/message-schemas";
import type { ConversationMessage } from "../types/message";
import {
	mergeToolStates,
	mergeTranscript,
	optimisticUserMessage,
	threadFromMessages,
	toolsFromMessages,
} from "./thread-items";

describe("optimisticUserMessage", () => {
	it("includes local attachments while the turn is submitted", () => {
		const message = optimisticUserMessage("Review this", [
			new File(["contents"], "brief.txt", { type: "text/plain" }),
		]);
		expect(message.parts).toEqual([
			{ type: "text", text: "Review this" },
			{ type: "media", fileName: "brief.txt", mimeType: "text/plain" },
		]);
	});
});

describe("threadFromMessages", () => {
	it("preserves parents and joins persisted tool results", () => {
		const messages = [
			roomMessageSchema.parse({
				messageId: "assistant-1",
				parentMessageId: "user-1",
				io: "OUTPUT",
				parts: [
					{
						type: "TEXT",
						text: "I will check.",
						uiText: "I will check.",
					},
					{
						type: "TOOL_CALL",
						toolCall: {
							id: "tool-1",
							name: "search_docs",
							title: "Search documents",
							description: "Find matching documents",
							arguments: { query: "quarterly report" },
						},
					},
				],
			}),
			roomMessageSchema.parse({
				messageId: "tool-result-1",
				io: "INPUT",
				visible: false,
				parts: [
					{
						type: "TOOL_RESULT",
						toolResult: {
							toolCallId: "tool-1",
							toolName: "search_docs",
							output: "Found 3 documents",
							toolParameterValues: { query: "quarterly report" },
							toolStatus: "success",
						},
					},
				],
			}),
		];

		const thread = threadFromMessages(messages);
		expect(thread).toHaveLength(1);
		expect(thread[0]?.parentMessageId).toBe("user-1");
		expect(toolsFromMessages(thread)["tool-1"]).toMatchObject({
			parentMessageId: "assistant-1",
			title: "Search documents",
			status: "COMPLETED",
			output: "Found 3 documents",
		});
	});

	it("reads saved times as UTC, never as the browser's local time", () => {
		const [saved, zoned, malformed] = threadFromMessages([
			roomMessageSchema.parse({
				messageId: "saved",
				io: "INPUT",
				dateCreated: "2026-10-02 13:05:00",
				parts: [{ type: "TEXT", text: "Hi" }],
			}),
			roomMessageSchema.parse({
				messageId: "zoned",
				io: "INPUT",
				dateCreated: "2026-10-02T13:05:00-04:00",
				parts: [{ type: "TEXT", text: "Hi" }],
			}),
			roomMessageSchema.parse({
				messageId: "malformed",
				io: "INPUT",
				dateCreated: "not a date",
				parts: [{ type: "TEXT", text: "Hi" }],
			}),
		]);
		expect(saved?.createdAt).toBe("2026-10-02T13:05:00.000Z");
		expect(zoned?.createdAt).toBe("2026-10-02T17:05:00.000Z");
		expect(malformed?.createdAt).toBeUndefined();
	});

	it("maps an approval and controller state over a durable tool", () => {
		const approval = {
			toolId: "tool-2",
			parentMessageId: "response-2",
			toolName: "send_email",
			arguments: { to: "person@example.com" },
			metadata: { title: "Send email" },
		};
		const tool = toolsFromMessages([], [approval])["tool-2"];
		expect(tool).toMatchObject({
			title: "Send email",
			status: "INPUT_REQUIRED",
		});

		const merged = mergeToolStates(
			[
				{
					id: "response-2",
					role: "assistant",
					parts: [{ type: "tool", tool }],
				},
			],
			{ "tool-2": { status: "RUNNING" } },
		);
		expect(merged[0]?.parts[0]).toMatchObject({
			tool: { status: "RUNNING" },
		});
	});
});

describe("mergeTranscript", () => {
	const message = (
		id: string,
		role: "user" | "assistant" = "assistant",
		text = id,
	): ConversationMessage => ({ id, role, parts: [{ type: "text", text }] });
	const ids = (messages: ConversationMessage[]) =>
		messages.map((entry) => entry.id);

	it("puts a just-sent request and its live answer after all saved history", () => {
		const history = [
			message("u1", "user"),
			message("a1"),
			message("u2", "user"),
			message("a2"),
		];
		const turn = [
			message("u2", "user"),
			message("a2"),
			message("pending", "user"),
			message("agent-run:r3"),
		];
		expect(ids(mergeTranscript(history, turn))).toEqual([
			"u1",
			"a1",
			"u2",
			"a2",
			"pending",
			"agent-run:r3",
		]);
	});

	it("keeps an unsaved message beside the turn message it followed", () => {
		const history = [
			message("u1", "user"),
			message("a1"),
			message("u2", "user"),
		];
		const turn = [
			message("card"),
			message("u1", "user"),
			message("child-run:c1"),
			message("a1"),
		];
		expect(ids(mergeTranscript(history, turn))).toEqual([
			"card",
			"u1",
			"child-run:c1",
			"a1",
			"u2",
		]);
	});

	it("uses the turn's copy of a saved message in its saved position", () => {
		const merged = mergeTranscript(
			[message("u1", "user"), message("a1", "assistant", "old")],
			[message("a1", "assistant", "new")],
		);
		expect(ids(merged)).toEqual(["u1", "a1"]);
		expect(merged[1]?.parts[0]).toMatchObject({ text: "new" });
	});

	it("shows a first request in an empty room", () => {
		expect(
			ids(
				mergeTranscript(
					[],
					[message("pending", "user"), message("agent-run:r1")],
				),
			),
		).toEqual(["pending", "agent-run:r1"]);
	});
});

it("restores the arguments actually executed and the declared tool UI", () => {
	const messages = threadFromMessages([
		{
			messageId: "call",
			role: "assistant",
			parts: [
				{
					type: "TOOL_CALL",
					toolCall: {
						id: "t",
						name: "search",
						arguments: { query: "proposed" },
						_meta: {
							SMSS_MCP_UI: {
								resourceURI: "system://forms/search",
							},
						},
					},
				},
			],
		},
		{
			messageId: "result",
			role: "assistant",
			parts: [
				{
					type: "TOOL_RESULT",
					toolResult: {
						toolCallId: "t",
						toolStatus: "success",
						toolParameterValues: { query: "approved" },
						output: "done",
					},
				},
			],
		},
	]);
	expect(toolsFromMessages(messages).t).toMatchObject({
		arguments: { query: "approved" },
		output: "done",
		status: "COMPLETED",
		uiUrl: "../../forms/dist/search",
	});
});
