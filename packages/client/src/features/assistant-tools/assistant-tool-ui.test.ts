import { describe, expect, it } from "vitest";
import {
	attachDurableMessages,
	createBuildRunFromRecord,
	mergeDurableRun,
	startRun,
} from "@/stores/assistant/assistant.runs";
import { readEmbeddedToolResult } from "./assistant-tool-bridge";
import {
	getAssistantToolResource,
	getAssistantToolUi,
	getPresentedTool,
	getPresentedTools,
	hasPendingToolUi,
	systemToolUrl,
} from "./assistant-tool-ui";

const identity = {
	id: "call",
	roomId: "child-room",
	message: "message",
	name: "tool",
};
const data = {
	type: "SMSS_EXEC_TOOL",
	tool: {
		type: "MCP",
		...identity,
		response: "already performed",
		tool_status: "success",
	},
};

describe("embedded tool response validation", () => {
	it("accepts only the frame's origin, source, and complete call identity", () => {
		const event = new MessageEvent("message", {
			data,
			origin: "https://example.test",
			source: window,
		});
		expect(
			readEmbeddedToolResult(
				event,
				window,
				"https://example.test",
				identity,
			),
		).toEqual({ response: "already performed", status: "success" });
		expect(
			readEmbeddedToolResult(
				event,
				null,
				"https://example.test",
				identity,
			),
		).toBeNull();
		expect(
			readEmbeddedToolResult(
				event,
				window,
				"https://other.test",
				identity,
			),
		).toBeNull();
		for (const field of ["id", "roomId", "message", "name"] as const)
			expect(
				readEmbeddedToolResult(event, window, "https://example.test", {
					...identity,
					[field]: "other",
				}),
			).toBeNull();
	});
	it.each(["error", "cancelled", "success"])(
		"preserves %s status",
		(status) => {
			const event = new MessageEvent("message", {
				data: { ...data, tool: { ...data.tool, tool_status: status } },
				origin: "https://example.test",
				source: window,
			});
			expect(
				readEmbeddedToolResult(
					event,
					window,
					"https://example.test",
					identity,
				)?.status,
			).toBe(status);
		},
	);
	it("ignores paused responses and malformed payloads", () => {
		for (const payload of [
			null,
			{},
			{ ...data, tool: { ...data.tool, tool_status: "paused" } },
			{ ...data, tool: { ...data.tool, response: undefined } },
			{ ...data, tool: { ...data.tool, response: BigInt(1) } },
			{ ...data, tool: { ...data.tool, executedParameters: [] } },
		]) {
			const event = new MessageEvent("message", {
				data: payload,
				origin: "https://example.test",
				source: window,
			});
			expect(
				readEmbeddedToolResult(
					event,
					window,
					"https://example.test",
					identity,
				),
			).toBeNull();
		}
	});
	it("accepts the legacy stock UI payload without roomId and normalizes its JSON output", () => {
		const legacy = {
			type: "SMSS_EXEC_TOOL",
			tool: {
				type: "MCP",
				id: identity.id,
				message: identity.message,
				name: identity.name,
				response: { META: 692.48 },
			},
		};
		const event = new MessageEvent("message", {
			data: legacy,
			source: window,
			origin: "https://example.test",
		});
		expect(
			readEmbeddedToolResult(
				event,
				window,
				"https://example.test",
				identity,
			),
		).toEqual({ response: '{"META":692.48}', status: "success" });
		expect(
			readEmbeddedToolResult(
				event,
				null,
				"https://example.test",
				identity,
			),
		).toBeNull();
		expect(
			readEmbeddedToolResult(
				event,
				window,
				"https://other.test",
				identity,
			),
		).toBeNull();
		for (const field of ["id", "message", "name"] as const)
			expect(
				readEmbeddedToolResult(event, window, "https://example.test", {
					...identity,
					[field]: "other",
				}),
			).toBeNull();
	});
	it("preserves actual UI inputs and refuses a mismatched room even for JSON results", () => {
		const tool = {
			...data.tool,
			response: { META: 692.48 },
			executedParameters: { symbol: "META" },
		};
		const event = new MessageEvent("message", {
			data: { ...data, tool },
			source: window,
			origin: "https://example.test",
		});
		expect(
			readEmbeddedToolResult(
				event,
				window,
				"https://example.test",
				identity,
			),
		).toEqual({
			response: '{"META":692.48}',
			status: "success",
			executedParameters: { symbol: "META" },
		});
		expect(
			readEmbeddedToolResult(event, window, "https://example.test", {
				...identity,
				roomId: "another-room",
			}),
		).toBeNull();
	});
});

describe("authored tool presentation", () => {
	it("synthesizes pending calls and overlays their current context without duplicating saved activity", () => {
		const action = {
			actionId: "action",
			runId: "run",
			toolCallId: "call",
			parentMessageId: "pending-message",
			toolName: "canonical_name",
			toolArgs: { original: true },
			editedArgs: { edited: true },
			toolMeta: { SMSS_MCP_UI: { displayLocation: "inline" } },
			hasUi: true,
			uiUrl: null,
			status: "PENDING",
		};
		const run = createBuildRunFromRecord({
			runId: "run",
			pendingActions: [action],
		});
		expect(getPresentedTools(run)).toMatchObject([
			{
				id: "call",
				name: "canonical_name",
				messageId: "pending-message",
				arguments: { edited: true },
			},
		]);
		run.tools = [
			{
				id: "call",
				name: "old",
				messageId: "old-message",
				status: "QUEUED",
				timestamp: "",
				metadata: {
					SMSS_MCP_UI: {
						resourceURI: "system://automation/form",
						displayLocation: "sidebar",
					},
				},
			},
		];
		const presented = getPresentedTools(run);
		expect(presented).toHaveLength(1);
		expect(presented[0].metadata?.SMSS_MCP_UI).toEqual({
			resourceURI: "system://automation/form",
			displayLocation: "inline",
		});
		expect(hasPendingToolUi(run, action)).toBe(true);
		expect(run.tools[0].messageId).toBe("old-message");
	});
	it("supports pending portal URLs while leaving hidden, unsupported, and unidentified actions generic", () => {
		const action = {
			actionId: "action",
			runId: "run",
			toolCallId: "call",
			parentMessageId: "message",
			toolName: "Tool",
			toolArgs: {},
			editedArgs: null,
			toolMeta: null,
			hasUi: true,
			uiUrl: "/Monolith/public_home/app/portals/review?actionId=action",
			status: "PENDING",
		};
		const run = createBuildRunFromRecord({
			runId: "run",
			pendingActions: [action],
		});
		expect(
			getAssistantToolResource(run, getPresentedTools(run)[0]),
		).toEqual({ kind: "page", url: action.uiUrl });
		for (const patch of [
			{ toolCallId: null },
			{ toolMeta: { SMSS_MCP_UI: { displayLocation: "hidden" } } },
			{
				toolMeta: {
					SMSS_MCP_UI: { resourceURI: "component://mail/thread" },
				},
			},
			{ toolName: "RequestUserInput" },
			{ uiUrl: "javascript:alert(1)" },
			{ uiUrl: null },
		]) {
			const pending = { ...action, ...patch };
			expect(
				hasPendingToolUi(
					{ ...run, pendingActions: [pending] },
					pending,
				),
			).toBe(false);
		}
	});
	it("defaults metadata-defined views to sidebar without auto opening", () => {
		expect(getAssistantToolUi({})).toBeNull();
		expect(getAssistantToolUi({ SMSS_MCP_UI: {} })).toMatchObject({
			displayLocation: "sidebar",
			autoOpen: false,
		});
		for (const displayLocation of ["inline", "sidebar", "hidden"])
			expect(
				getAssistantToolUi({
					SMSS_MCP_UI: {
						displayLocation,
						autoOpen: true,
						loadingMessage: "Looking up records",
					},
				}),
			).toMatchObject({
				displayLocation,
				autoOpen: true,
				loadingMessage: "Looking up records",
			});
	});
	it("preserves originating message and metadata through durable projection over a live result", () => {
		const run = createBuildRunFromRecord({
			runId: "run",
			roomId: "room",
			status: "COMPLETED",
		});
		const metadata = {
			SMSS_MCP_UI: { displayLocation: "inline", resourceURI: "/page" },
		};
		attachDurableMessages({ run }, [
			{
				messageId: "message",
				agentRun: { runId: "run" },
				parts: [
					{
						type: "TOOL_CALL",
						toolCall: { id: "call", name: "tool", _meta: metadata },
					},
					{
						type: "TOOL_RESULT",
						toolResult: {
							toolCallId: "call",
							output: "result",
							toolStatus: "COMPLETED",
						},
					},
				],
			},
		]);
		expect(run.tools[0]).toMatchObject({
			messageId: "message",
			metadata,
			output: "result",
		});
		const live = startRun(
			{ runs: {}, roomRunIds: [], activeRunId: null },
			{ runId: "run", roomId: "room", input: "hello" },
		);
		live.runs.run.tools = [
			{
				id: "call",
				name: "tool",
				status: "COMPLETED",
				timestamp: "",
				output: "live",
			},
		];
		const merged = mergeDurableRun(live, {
			record: { runId: "run" },
			tools: [{ ...run.tools[0], status: "QUEUED", output: undefined }],
		});
		expect(merged.runs.run.tools[0]).toMatchObject({
			messageId: "message",
			metadata,
			output: "live",
		});
	});
	it("uses the pending call's message identity before durable projection", () => {
		const run = createBuildRunFromRecord({
			runId: "child",
			roomId: "child-room",
			status: "INPUT_REQUIRED",
			pendingActions: [
				{
					actionId: "action",
					runId: "child",
					toolCallId: "call",
					parentMessageId: "message",
					toolName: "Tool",
					toolArgs: {},
					editedArgs: null,
					hasUi: true,
					uiUrl: null,
					status: "PENDING",
					toolMeta: { SMSS_MCP_UI: { displayLocation: "sidebar" } },
				},
			],
		});
		expect(
			getPresentedTool(run, {
				id: "call",
				name: "tool",
				status: "QUEUED",
				timestamp: "",
			}),
		).toMatchObject({
			messageId: "message",
			metadata: { SMSS_MCP_UI: { displayLocation: "sidebar" } },
		});
	});
	it("resolves packaged system pages while refusing traversal and unsupported resources", () => {
		expect(systemToolUrl("system://automation/form?mode=tool")).toBe(
			"../../automation/dist/form?mode=tool",
		);
		for (const uri of [
			"system://../secret",
			"system://automation/../secret",
			"system://automation/%2e%2e/secret",
			"component://mail/thread",
			"/portal",
		])
			expect(systemToolUrl(uri)).toBeNull();
	});
});
