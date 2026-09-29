import { expect, test } from "vitest";
import type { SubagentRunSummary } from "@semoss/sdk";
import type { PixelMessageSubagentPart } from "@/types";
import {
	reconcileDurableSubagent,
	reconcileDurableSubagents,
} from "./agent-harness";

test("durable reconciliation updates an existing stale subagent card", () => {
	const part: PixelMessageSubagentPart = {
		type: "SUBAGENT",
		subagent: {
			id: "child-run",
			status: "RUNNING",
			alias: "agent_pptx_agent",
			displayName: "PPTX Agent",
		},
	};
	const summary = {
		runId: "child-run",
		status: "FAILED",
		executorLabel: "PowerPoint Specialist",
		finalText: null,
		errorMessage: "Build failed",
	} as SubagentRunSummary;

	reconcileDurableSubagent(part, summary);

	expect(part.subagent).toEqual({
		id: "child-run",
		status: "FAILED",
		alias: "agent_pptx_agent",
		displayName: "PowerPoint Specialist",
		resultPreview: undefined,
		error: "Build failed",
	});
});

test("durable reconciliation settles a card after its terminal stream event is lost", () => {
	const part: PixelMessageSubagentPart = {
		type: "SUBAGENT",
		subagent: {
			id: "child-run",
			status: "RUNNING",
			displayName: "PPTX Agent",
		},
	};
	const summary = {
		runId: "child-run",
		status: "COMPLETED",
		finalText: "Saved deck.pptx",
	} as SubagentRunSummary;

	const stillActive = reconcileDurableSubagents([part], [summary]);

	expect(stillActive).toBe(false);
	expect(part.subagent.status).toBe("COMPLETED");
	expect(part.subagent.resultPreview).toBe("Saved deck.pptx");
});
