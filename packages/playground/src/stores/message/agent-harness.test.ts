import { expect, it, vi } from "vitest";
import type { AgentRunItemEvent, AgentStore } from "@semoss/sdk";
import type { ResponsePixelMessage } from "@/types";
import { runAgentMessage } from "./agent-harness";
import type { InputMessageStore } from "./input-message.store";
import type { ResponseMessageStore } from "./response-message.store";

const { start, stop } = vi.hoisted(() => ({
	start: vi.fn(),
	stop: vi.fn(),
}));

vi.mock("@semoss/sdk", () => ({
	AgentStore: { start },
	getSubagentRuns: vi.fn(),
}));
vi.mock("./input-message.store", () => ({ InputMessageStore: class {} }));
vi.mock("./response-message.store", () => ({ ResponseMessageStore: class {} }));

it("normalizes omitted tool details without erasing details from the start event", async () => {
	const tools = new Map<string, { status: string; response?: string }>();
	const parts: ResponsePixelMessage["parts"] = [];
	const room = {
		roomId: "room",
		insightId: "insight",
		model: { engine_id: "model", engine_name: "Model" },
		options: {},
		setIsLoading: vi.fn(),
		getTool: (id: string) => tools.get(id),
		syncTool: (id: string) => tools.set(id, { status: "INITIAL" }),
	};
	const response = {
		room,
		parts,
		isThinking: false,
		removeChild: vi.fn(),
	} as unknown as ResponseMessageStore;
	const input = {
		parts: [{ type: "TEXT", text: "Inspect the file" }],
	} as unknown as InputMessageStore;
	const eventBase = {
		version: 1,
		runId: "run",
		timestamp: "2026-10-23T12:00:00Z",
	} as const;
	const events: AgentRunItemEvent[] = [
		{
			...eventBase,
			eventId: "partial-start",
			sequence: 1,
			type: "item.started",
			item: {
				id: "partial-tool",
				kind: "tool",
				title: "Inspect file",
				status: "RUNNING",
			},
		},
		{
			...eventBase,
			eventId: "full-start",
			sequence: 2,
			type: "item.started",
			item: {
				id: "full-tool",
				kind: "tool",
				name: "ReadFile",
				arguments: { path: "report.txt" },
				status: "RUNNING",
			},
		},
		{
			...eventBase,
			eventId: "partial-completion",
			sequence: 3,
			type: "item.completed",
			item: {
				id: "full-tool",
				kind: "tool",
				status: "COMPLETED",
				output: "File content",
			},
		},
	];
	start.mockResolvedValue({
		runId: "run",
		stop,
		watch: (handlers: Parameters<AgentStore["watch"]>[0]) => {
			for (const event of events) {
				handlers.onEvent(event, { itemOrder: [], itemsById: {} });
			}
			handlers.onReconcile({
				runId: "run",
				status: "COMPLETED",
				pendingActions: [],
			});
		},
	});

	await runAgentMessage(response, input, response);

	expect(parts).toMatchObject([
		{ toolCall: { name: "", title: "Inspect file", arguments: {} } },
		{
			toolCall: {
				name: "ReadFile",
				arguments: { path: "report.txt" },
			},
		},
	]);
	expect(tools.get("full-tool")).toMatchObject({
		status: "SUCCESS",
		response: "File content",
	});
	expect(stop).toHaveBeenCalledOnce();
});
