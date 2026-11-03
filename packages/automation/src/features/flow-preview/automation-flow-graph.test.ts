import { describe, expect, it } from "vitest";
import type { AutomationFlow } from "./automation-flow.types";
import { buildAutomationFlowGraph } from "./automation-flow-graph";

const workflow: AutomationFlow = {
	nodes: [
		{ id: "delivery", type: "app.pixel", label: "Deliver to me" },
		{ id: "start", type: "trigger.start", label: "Start" },
		{ id: "routine", type: "agent.run", label: "Do the routine" },
	],
	edges: [
		{
			source: "start",
			target: "routine",
			sourcePort: "out",
			targetPort: "in",
		},
		{
			source: "routine",
			target: "delivery",
			sourcePort: "out",
			targetPort: "in",
		},
	],
};

describe("buildAutomationFlowGraph", () => {
	it("lays out the executed connections independently of storage order without mutating the projection", () => {
		const original = structuredClone(workflow);
		const { nodes, edges } = buildAutomationFlowGraph(workflow);
		const [delivery, start, routine] = nodes;
		expect(start.position.x).toBeLessThan(routine.position.x);
		expect(routine.position.x).toBeLessThan(delivery.position.x);
		expect(start.position.y).toBe(routine.position.y);
		expect(edges.map(({ source, target }) => [source, target])).toEqual([
			["start", "routine"],
			["routine", "delivery"],
		]);
		expect(workflow).toEqual(original);
	});

	it("preserves saved coordinates and distinct branch ports without exposing execution data", () => {
		const withPrivateFields = {
			nodes: workflow.nodes.map((node) => ({
				...node,
				position: { x: 123, y: 456, secret: "hidden-position" },
				config: { source: "hidden-source" },
				runDetails: "hidden-run",
			})),
			edges: [
				{
					source: "start",
					target: "routine",
					sourcePort: "case:first",
					targetPort: "in",
				},
				{
					source: "start",
					target: "delivery",
					sourcePort: "else",
					targetPort: "in",
					configuration: "hidden-edge",
				},
			],
		};
		const graph = buildAutomationFlowGraph(withPrivateFields);
		expect(graph.nodes[0].position).toEqual({ x: 123, y: 456 });
		expect(graph.nodes[1].data.outputPorts).toEqual(["case:first", "else"]);
		expect(graph.edges.map((edge) => edge.sourceHandle)).toEqual([
			"case:first",
			"else",
		]);
		expect(JSON.stringify(graph)).not.toContain("hidden-");
		for (const node of graph.nodes) {
			expect(node).toMatchObject({
				draggable: false,
				connectable: false,
				selectable: false,
				deletable: false,
				focusable: false,
			});
		}
		for (const edge of graph.edges) {
			expect(edge).toMatchObject({
				reconnectable: false,
				selectable: false,
				deletable: false,
				focusable: false,
				data: { readOnly: true },
			});
		}
	});

	it("does not invent connections for disconnected nodes", () => {
		const { nodes, edges } = buildAutomationFlowGraph({
			nodes: workflow.nodes,
			edges: [],
		});
		expect(edges).toEqual([]);
		expect(new Set(nodes.map((node) => node.position.y)).size).toBe(3);
		expect(
			nodes.every(
				(node) =>
					node.data.inputPorts.length === 0 &&
					node.data.outputPorts.length === 0,
			),
		).toBe(true);
	});
});
