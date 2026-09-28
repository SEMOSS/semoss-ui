import { roomMessageSchema } from "../api/message-schemas";
import {
	mergeToolStates,
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
