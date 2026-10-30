import { describe, expect, it } from "vitest";
import type {
	RoomRunDetail,
	SubagentRunNode,
	TranscriptMessage,
} from "./agent-activity-types";
import {
	agentRoomExportFileName,
	buildAgentRoomMarkdown,
} from "./agent-room-markdown";

const message = (
	messageId: string,
	role: string,
	parts: TranscriptMessage["parts"],
	visible = true,
): TranscriptMessage => ({
	messageId,
	visible,
	io: role === "input" || role === "tool_result" ? "INPUT" : "OUTPUT",
	type: "RESPONSE_TEXT",
	dateCreated: "2026-10-01 10:00:00",
	agentRun: { runId: "run1", role },
	parts,
});

const SUBAGENT: SubagentRunNode = {
	jobId: "child",
	runId: "child",
	parentRunId: "run1",
	roomId: "r1-sub",
	userId: "alice",
	workspaceId: "agent-b",
	harnessType: "semoss",
	modelId: "model-1",
	status: "FAILED",
	input: "Find the totals",
	errorMessage: "Agent run cancelled: an admin closed the room",
	dateCreated: "2026-10-01 10:01:00",
	messages: [],
	artifacts: [],
	children: [],
};

const RUN: RoomRunDetail = {
	jobId: "run1",
	runId: "run1",
	roomId: "r1",
	userId: "alice",
	workspaceId: "agent-a",
	harnessType: "semoss",
	modelId: "model-1",
	status: "COMPLETED",
	input: "Summarize the report",
	finalText: "Here is the summary.",
	dateCreated: "2026-10-01 10:00:00",
	startedAt: "2026-10-01 10:00:00",
	completedAt: "2026-10-01 10:00:05",
	messages: [
		message("m1", "input", [
			{ type: "TEXT", uiText: "Summarize the report" },
		]),
		message("m2", "assistant_tool", [
			{ type: "THINKING", thinking: "Read it first\nthen sum" },
			{
				type: "TOOL_CALL",
				toolCall: {
					name: "ReadFile",
					arguments: { path: "report.md" },
					id: "call-1",
					type: "function",
				},
			},
		]),
		message("m3", "tool_result", [
			{
				type: "TOOL_RESULT",
				toolResult: {
					output: "a ``` fence inside",
					serverTool: false,
					toolStatus: "success",
					toolCallId: "call-1",
					toolParameterValues: {},
					toolName: "ReadFile",
				},
			},
		]),
		message("m4", "final_output", [{ type: "TEXT", text: "Done" }], false),
	],
	artifacts: [],
	subagents: [SUBAGENT],
};

const markdown = buildAgentRoomMarkdown({
	roomId: "r1",
	roomName: "Quarterly report",
	runs: [RUN],
	engineInfo: { "model-1": { name: "GPT Model" } },
	details: [{ label: "User", value: "Alice Doe (alice, NATIVE)" }],
	exportedAt: "2026-10-28T12:00:00.000Z",
});

describe("buildAgentRoomMarkdown", () => {
	it("opens with the room and who it belongs to", () => {
		expect(markdown).toContain("# Quarterly report");
		expect(markdown).toContain("- Room id: `r1`");
		expect(markdown).toContain("- User: Alice Doe (alice, NATIVE)");
		expect(markdown).toContain("- Exported: 2026-10-28T12:00:00.000Z");
	});

	it("writes each run's facts, input, conversation and final output", () => {
		expect(markdown).toContain("## Run 1: COMPLETED");
		expect(markdown).toContain("- Model: GPT Model (`model-1`)");
		expect(markdown).toContain("- Duration: 5.00s");
		expect(markdown).toContain("### Input\n\nSummarize the report");
		expect(markdown).toContain("#### User - 2026-10-01 10:00:00");
		expect(markdown).toContain("> Read it first\n> then sum");
		expect(markdown).toContain(
			'**Tool call:** `ReadFile` (id `call-1`)\n\n```json\n{\n  "path": "report.md"\n}\n```',
		);
		expect(markdown).toContain("### Final output\n\nHere is the summary.");
	});

	it("keeps a tool's output intact when it holds a code fence", () => {
		expect(markdown).toContain("````\na ``` fence inside\n````");
	});

	it("marks a message the room hid", () => {
		expect(markdown).toContain(
			"#### Assistant (hidden) - 2026-10-01 10:00:00",
		);
	});

	it("writes each subagent run under the run that spawned it, with its error", () => {
		expect(markdown).toContain("## Run 1.1: FAILED");
		expect(markdown).toContain("- Subagent of: Run 1");
		expect(markdown).toContain(
			"### Error\n\n```\nAgent run cancelled: an admin closed the room\n```",
		);
		expect(markdown).toContain("(no messages recorded)");
	});
});

describe("agentRoomExportFileName", () => {
	it("names the file by the room's name and id", () => {
		expect(agentRoomExportFileName("R-1", "Quarterly report!")).toBe(
			"quarterly-report-r-1.md",
		);
		expect(agentRoomExportFileName("r1", null)).toBe("room-r1.md");
	});
});
