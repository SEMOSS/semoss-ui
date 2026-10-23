// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { AgentRunItemsState } from "@semoss/sdk";
import { collectAgentRunActivities } from "./agent-run-graph";

describe("collectAgentRunActivities", () => {
	it("keeps progress separate from sub-agents when a run has no room", () => {
		const items: AgentRunItemsState = {
			itemOrder: ["progress", "child-run"],
			itemsById: {
				progress: {
					id: "progress",
					kind: "progress",
					phase: "visual_review",
					activity: "tool",
					currentTool: "InspectPptx",
					maxTurns: 20,
					turnsCompleted: 3,
					turnsRemaining: 17,
					modelCalls: 3,
					modelTimeMs: 300,
					toolTimeMs: 100,
					toolWallTimeMs: 100,
					elapsedMs: 400,
					toolCalls: 2,
					toolFailures: 0,
					repeatedFailures: [],
				},
				"child-run": {
					id: "child-run",
					kind: "subagent",
					childRunId: "child-run",
					alias: "Reviewer",
					roomId: "child-room",
					status: "RUNNING",
				},
			},
		};

		const activities = collectAgentRunActivities({
			snapshot: {
				runId: "run",
				status: "RUNNING",
				pendingActions: [],
			},
			items,
			messages: [],
		});

		expect(activities).toHaveLength(2);
		expect(activities[0]).toMatchObject({
			kind: "progress",
			label: "visual review",
			text: "3 of 20 turns completed.",
		});
		expect(activities[1]).toMatchObject({
			kind: "subagent",
			label: "Reviewer",
			status: "RUNNING",
		});
	});
});
