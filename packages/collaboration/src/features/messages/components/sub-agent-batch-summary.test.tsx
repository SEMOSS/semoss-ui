import { render, screen } from "@testing-library/react";
import type { ConversationTool } from "../types/message";
import {
	isSubAgentTool,
	SubAgentBatchSummary,
} from "./sub-agent-batch-summary";

function spawn(
	id: string,
	status: ConversationTool["status"],
): ConversationTool {
	return {
		id,
		parentMessageId: "message",
		name: "SpawnSubAgent",
		title: "Spawn sub-agent",
		arguments: {},
		status,
	};
}

it("recognizes the sub-agent orchestration tools and nothing else", () => {
	expect(isSubAgentTool(spawn("a", "RUNNING"))).toBe(true);
	expect(
		isSubAgentTool({ ...spawn("b", "RUNNING"), name: "WaitForSubAgent" }),
	).toBe(true);
	expect(isSubAgentTool({ ...spawn("c", "RUNNING"), name: "Search" })).toBe(
		false,
	);
});

it("summarizes a running batch with per-status counts", () => {
	render(
		<SubAgentBatchSummary
			tools={[
				spawn("a", "COMPLETED"),
				spawn("b", "RUNNING"),
				spawn("c", "RUNNING"),
				spawn("d", "RUNNING"),
			]}
		/>,
	);
	expect(
		screen.getByText("Working with 4 sub-agents: 1 done, 3 running"),
	).toBeVisible();
});

it("collapses to a finished line once every sub-agent is done", () => {
	render(
		<SubAgentBatchSummary
			tools={[spawn("a", "COMPLETED"), spawn("b", "COMPLETED")]}
		/>,
	);
	expect(screen.getByText("2 sub-agents finished")).toBeVisible();
});

it("counts spawns, not the wait and status pings, as sub-agents", () => {
	render(
		<SubAgentBatchSummary
			tools={[
				spawn("a", "RUNNING"),
				{ ...spawn("w", "COMPLETED"), name: "WaitForSubAgent" },
				{ ...spawn("s", "COMPLETED"), name: "CheckSubAgentStatus" },
			]}
		/>,
	);
	expect(screen.getByText(/Working with 1 sub-agent/)).toBeVisible();
});

it("counts distinct sub-agents by jobId in a later collect-only block", () => {
	const wait = (jobId: string, status: ConversationTool["status"]) => ({
		...spawn(`wait-${jobId}`, status),
		name: "WaitForSubAgent",
		arguments: { jobId },
	});
	render(
		<SubAgentBatchSummary
			tools={[
				wait("job-1", "COMPLETED"),
				// a repeated poll of the same sub-agent must not inflate the count
				wait("job-1", "COMPLETED"),
				wait("job-2", "COMPLETED"),
			]}
		/>,
	);
	expect(screen.getByText("2 sub-agents finished")).toBeVisible();
});
