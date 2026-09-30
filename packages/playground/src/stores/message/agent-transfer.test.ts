import { describe, expect, test } from "vitest";
import type { AgentRunSummary } from "@semoss/sdk";
import { getMissingTransferredRuns } from "./agent-transfer";

const run = (
	runId: string,
	status: AgentRunSummary["status"],
	transferFromRunId?: string,
): AgentRunSummary => ({
	runId,
	parentRunId: null,
	roomId: "room-1",
	roomName: null,
	workspaceId: null,
	modelId: null,
	harnessType: "semoss",
	jobId: runId,
	status,
	input: null,
	inputMessageId: null,
	finalText: null,
	finalOutputMessageId: null,
	errorMessage: null,
	dateCreated: null,
	startedAt: null,
	completedAt: null,
	userId: "user-1",
	artifacts: [],
	transferFromRunId,
});

describe("getMissingTransferredRuns", () => {
	test("reconciles missing terminal and active transfer runs", () => {
		const missing = getMissingTransferredRuns(
			[
				run("parent", "COMPLETED"),
				run("completed-transfer", "COMPLETED", "parent"),
				run("active-transfer", "RUNNING", "another-parent"),
			],
			new Set(["parent"]),
		);

		expect(missing.map((entry) => entry.runId)).toEqual([
			"completed-transfer",
			"active-transfer",
		]);
	});

	test("ignores transfer runs already represented in history", () => {
		const missing = getMissingTransferredRuns(
			[run("transfer", "COMPLETED", "parent")],
			new Set(["transfer"]),
		);

		expect(missing).toEqual([]);
	});
});
