import { describe, expect, it } from "vitest";
import {
	type N8nWorkflow,
	n8nWorkflowToAutomationDocument,
	n8nWorkflowToAutomationDocumentWithModel,
} from "./n8n-import-adapter";

const routingWorkflow: N8nWorkflow = {
	name: "Routing workflow",
	nodes: [
		{
			id: "start",
			name: "Manual Trigger",
			type: "n8n-nodes-base.manualTrigger",
		},
		{
			id: "route",
			name: "Choose Route",
			type: "n8n-nodes-base.if",
			parameters: {
				conditions: {
					conditions: [
						{
							leftValue: 1,
							rightValue: 1,
							operator: { operation: "equals" },
						},
					],
				},
			},
		},
	],
	connections: {
		"Manual Trigger": {
			main: [[{ node: "Choose Route", type: "main", index: 0 }]],
		},
	},
};

describe("n8n import output variables", () => {
	it("omits outputVar from trigger and routing nodes", () => {
		const imported = n8nWorkflowToAutomationDocument(routingWorkflow);

		expect(imported.document.graph.nodes).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: "start", type: "trigger.start" }),
				expect.objectContaining({ id: "route", type: "control.if" }),
			]),
		);
		for (const node of imported.document.graph.nodes) {
			expect(node).not.toHaveProperty("outputVar");
		}
	});

	it("removes a placeholder outputVar when model mapping produces a routing node", async () => {
		const workflow: N8nWorkflow = {
			...routingWorkflow,
			nodes: [
				routingWorkflow.nodes[0],
				{
					id: "unsupported-route",
					name: "Unsupported Route",
					type: "example.route",
				},
			],
			connections: {},
		};

		const imported = await n8nWorkflowToAutomationDocumentWithModel(
			workflow,
			async () => ({
				conversions: [
					{
						nodeId: "unsupported-route",
						type: "control.if",
						config: {
							clauses: [{ id: "cond", condition: "True" }],
						},
						codeMode: "generated",
					},
				],
			}),
		);

		const route = imported.document.graph.nodes.find(
			(node) => node.id === "unsupported-route",
		);
		expect(route).toMatchObject({ type: "control.if" });
		expect(route).not.toHaveProperty("outputVar");
	});
});
