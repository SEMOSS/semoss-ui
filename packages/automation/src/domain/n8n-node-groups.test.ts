import { describe, expect, it } from "vitest";
import { automationDocumentToN8nWorkflow } from "./automation-to-n8n-adapter";
import { n8nWorkflowToAutomationDocument } from "./n8n-import-adapter";

const workflow = {
	name: "Grouped workflow",
	nodes: [
		{
			id: "trigger-1",
			name: "Start",
			type: "n8n-nodes-base.manualTrigger",
		},
		{
			id: "set-1",
			name: "Initialize",
			type: "n8n-nodes-base.set",
			parameters: {
				assignments: {
					assignments: [{ name: "status", value: "ready" }],
				},
			},
		},
	],
	connections: {},
	nodeGroups: [
		{
			id: "group-1",
			name: "Stage 1: Ingest",
			nodeIds: ["trigger-1", "set-1", "not-imported"],
			description: "Prepare the workflow input.",
		},
		{
			id: "group-2",
			name: "Duplicate membership",
			nodeIds: ["set-1"],
		},
	],
};

describe("n8n node groups", () => {
	it("imports groups and drops references to nodes omitted from the workflow", () => {
		const result = n8nWorkflowToAutomationDocument(workflow);

		expect(result.document.nodeGroups).toEqual([
			{
				id: "group-1",
				name: "Stage 1: Ingest",
				nodeIds: ["trigger-1", "set-1"],
				description: "Prepare the workflow input.",
			},
		]);
		expect(
			result.document.nodeGroups?.some((group) =>
				group.nodeIds.includes("set-1"),
			),
		).toBe(true);
		expect(
			result.document.nodeGroups?.filter((group) =>
				group.nodeIds.includes("set-1"),
			),
		).toHaveLength(1);
	});

	it("exports visual groups with their surviving node IDs", () => {
		const imported = n8nWorkflowToAutomationDocument(workflow);
		const exported = automationDocumentToN8nWorkflow(
			imported.document,
			imported.nodeSources,
			"Grouped workflow",
		);

		expect(exported.workflow.nodeGroups).toEqual([
			{
				id: "group-1",
				name: "Stage 1: Ingest",
				nodeIds: ["trigger-1", "set-1"],
				description: "Prepare the workflow input.",
			},
		]);
	});
});
