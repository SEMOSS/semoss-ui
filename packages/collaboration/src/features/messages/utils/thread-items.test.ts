import type { AgentRunItemsState, PendingAgentAction } from "@semoss/sdk";
import { roomMessageSchema } from "../api/message-schemas";
import {
	messageFromRunItems,
	optimisticUserMessage,
	threadFromMessages,
	toolsFromMessages,
} from "./thread-items";

describe("optimisticUserMessage", () => {
	it("includes local attachments while the run is being submitted", () => {
		const message = optimisticUserMessage("Review this", [
			new File(["contents"], "brief.txt", { type: "text/plain" }),
		]);

		expect(message.parts).toEqual([
			{ type: "text", text: "Review this" },
			{
				type: "media",
				fileName: "brief.txt",
				mimeType: "text/plain",
			},
		]);
	});
});

describe("threadFromMessages", () => {
	it("preserves ordered message parts and joins persisted tool results", () => {
		const messages = [
			roomMessageSchema.parse({
				messageId: "assistant-1",
				type: "RESPONSE_TEXT",
				dateCreated: "2026-09-21T14:00:00.000Z",
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
				type: "INPUT_TOOL_EXEC",
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
		expect(thread[0]?.parts.map((part) => part.type)).toEqual([
			"text",
			"tool",
		]);
		expect(toolsFromMessages(thread)["tool-1"]).toMatchObject({
			title: "Search documents",
			status: "COMPLETED",
			output: "Found 3 documents",
		});
	});

	it("uses deprecated flat text only when canonical parts are absent", () => {
		const thread = threadFromMessages([
			roomMessageSchema.parse({
				messageId: "user-1",
				type: "INPUT_TEXT",
				inputPrompt: "Fallback prompt",
			}),
		]);

		expect(thread[0]).toMatchObject({
			role: "user",
			parts: [{ type: "text", text: "Fallback prompt" }],
		});
	});

	it("indexes a durable approval before its streamed tool item arrives", () => {
		const pending: PendingAgentAction = {
			actionId: "action-without-tool-item",
			runId: "run-1",
			parentMessageId: "response-1",
			toolCallId: null,
			toolName: "RequestUserInput",
			toolArgs: { questions: [] },
			editedArgs: null,
			toolMeta: { title: "Clarify the request" },
			hasUi: false,
			uiUrl: null,
			status: "PENDING",
		};

		expect(
			toolsFromMessages([], [pending])[
				"pending-action:action-without-tool-item"
			],
		).toMatchObject({
			title: "Clarify the request",
			status: "INPUT_REQUIRED",
		});
	});
});

describe("messageFromRunItems", () => {
	it("keeps live parts in start order and marks pending tools", () => {
		const items: AgentRunItemsState = {
			itemOrder: ["reasoning-1", "tool-1", "message-1"],
			itemsById: {
				"reasoning-1": {
					id: "reasoning-1",
					kind: "reasoning",
					summary: "Checking sources",
				},
				"tool-1": {
					id: "tool-1",
					kind: "tool",
					name: "search_docs",
					arguments: { query: "report" },
					status: "INPUT_REQUIRED",
				},
				"message-1": {
					id: "message-1",
					kind: "message",
					role: "assistant",
					text: "Ready when approved.",
				},
			},
		};
		const pending: PendingAgentAction[] = [
			{
				actionId: "action-1",
				runId: "run-1",
				parentMessageId: null,
				toolCallId: "tool-1",
				toolName: "search_docs",
				toolArgs: { query: "report" },
				editedArgs: null,
				toolMeta: null,
				hasUi: false,
				uiUrl: null,
				status: "PENDING",
			},
		];

		const message = messageFromRunItems({
			items,
			itemPhases: {
				"reasoning-1": "complete",
				"tool-1": "active",
				"message-1": "active",
			},
			pendingActions: pending,
			status: "INPUT_REQUIRED",
			progress: null,
			hasStreamGap: false,
		});

		expect(message?.parts.map((part) => part.type)).toEqual([
			"thinking",
			"tool",
			"text",
		]);
		expect(
			message?.parts.find((part) => part.type === "tool")?.tool.status,
		).toBe("INPUT_REQUIRED");
	});

	it("creates the activity message before the first run item arrives", () => {
		const message = messageFromRunItems({
			items: { itemsById: {}, itemOrder: [] },
			itemPhases: {},
			pendingActions: [],
			status: "SUBMITTED",
			progress: null,
			hasStreamGap: false,
		});

		expect(message).toMatchObject({
			role: "assistant",
			parts: [],
			live: { status: "SUBMITTED" },
		});
	});

	it("synthesizes a pending tool when its stream event was dropped", () => {
		const pending: PendingAgentAction = {
			actionId: "action-2",
			runId: "run-2",
			parentMessageId: null,
			toolCallId: "missing-tool",
			toolName: "RequestUserInput",
			toolArgs: { questions: [] },
			editedArgs: null,
			toolMeta: { title: "Answer a question" },
			hasUi: false,
			uiUrl: null,
			status: "PENDING",
		};
		const message = messageFromRunItems({
			items: { itemsById: {}, itemOrder: [] },
			itemPhases: {},
			pendingActions: [pending],
			status: "INPUT_REQUIRED",
			progress: null,
			hasStreamGap: true,
		});

		expect(message?.parts).toEqual([
			{
				type: "tool",
				tool: expect.objectContaining({
					id: "missing-tool",
					title: "Answer a question",
					status: "INPUT_REQUIRED",
				}),
			},
		]);
	});

	it.each(["QUEUED", "RUNNING", "COMPLETED", "FAILED"] as const)(
		"keeps a tool card while it transitions to %s",
		(toolStatus) => {
			const message = messageFromRunItems({
				items: {
					itemOrder: ["tool-1"],
					itemsById: {
						"tool-1": {
							id: "tool-1",
							kind: "tool",
							name: "search",
							title: "Search",
							arguments: { query: "report" },
							status: toolStatus,
							output:
								toolStatus === "COMPLETED"
									? "Found it"
									: undefined,
							error:
								toolStatus === "FAILED"
									? "Search failed"
									: undefined,
						},
					},
				},
				itemPhases: {
					"tool-1":
						toolStatus === "QUEUED" || toolStatus === "RUNNING"
							? "active"
							: "complete",
				},
				pendingActions: [],
				status: toolStatus === "FAILED" ? "FAILED" : "RUNNING",
				progress: null,
				hasStreamGap: false,
			});

			expect(
				message?.parts.find((part) => part.type === "tool")?.tool,
			).toMatchObject({
				status: toolStatus,
				...(toolStatus === "COMPLETED" ? { output: "Found it" } : {}),
				...(toolStatus === "FAILED" ? { error: "Search failed" } : {}),
			});
		},
	);
});
