import { describe, expect, it } from "vitest";
import type {
	AutomationEdge,
	AutomationNode,
} from "../../domain/automation.types";
import { sequentializeFanOut } from "./bpmn-sequentialize";

function node(id: string, type = "function-engine"): AutomationNode {
	return {
		id,
		type,
		label: id,
		position: { x: 0, y: 0 },
		outputVar: id,
		config: {},
	} as unknown as AutomationNode;
}

function edge(source: string, target: string): AutomationEdge {
	return {
		id: `${source}-${target}`,
		source,
		target,
		sourceHandle: `out-${source}`,
		targetHandle: `in-${target}`,
	};
}

function pairs(edges: AutomationEdge[]): string[] {
	return edges.map((item) => `${item.source}>${item.target}`).sort();
}

describe("sequentializeFanOut", () => {
	it("runs the branches of a parallel split one after another", () => {
		const warnings: string[] = [];
		const result = sequentializeFanOut(
			["start", "split", "a", "b", "join", "after"].map((id) => node(id)),
			[
				edge("start", "split"),
				edge("split", "a"),
				edge("split", "b"),
				edge("a", "join"),
				edge("b", "join"),
				edge("join", "after"),
			],
			new Set(["split", "join"]),
			warnings,
		);

		expect(pairs(result.edges)).toEqual(["a>b", "b>after", "start>a"]);
		expect(result.steps.map((step) => step.id)).toEqual([
			"start",
			"a",
			"b",
			"after",
		]);
		expect(warnings).toHaveLength(1);
	});

	it("orders branches of different lengths and three-way splits", () => {
		const result = sequentializeFanOut(
			["split", "a1", "a2", "b", "c", "join", "end"].map((id) =>
				node(id),
			),
			[
				edge("split", "a1"),
				edge("a1", "a2"),
				edge("split", "b"),
				edge("split", "c"),
				edge("a2", "join"),
				edge("b", "join"),
				edge("c", "join"),
				edge("join", "end"),
			],
			new Set(["split", "join"]),
			[],
		);

		expect(pairs(result.edges)).toEqual(["a1>a2", "a2>b", "b>c", "c>end"]);
	});

	it("handles a split nested inside a branch", () => {
		const result = sequentializeFanOut(
			["s1", "s2", "x", "y", "j2", "z", "j1"].map((id) => node(id)),
			[
				edge("s1", "s2"),
				edge("s1", "z"),
				edge("s2", "x"),
				edge("s2", "y"),
				edge("x", "j2"),
				edge("y", "j2"),
				edge("j2", "j1"),
				edge("z", "j1"),
			],
			new Set(["s1", "s2", "j1", "j2"]),
			[],
		);

		expect(
			result.steps.every(
				(step) =>
					result.edges.filter((item) => item.source === step.id)
						.length <= 1,
			),
		).toBe(true);
		expect(pairs(result.edges)).toEqual(["x>y", "y>z"]);
	});

	it("chains branches that never rejoin", () => {
		const result = sequentializeFanOut(
			["task", "a", "b"].map((id) => node(id)),
			[edge("task", "a"), edge("task", "b")],
			new Set(),
			[],
		);

		expect(pairs(result.edges)).toEqual(["a>b", "task>a"]);
	});

	it("leaves a decision node's routes alone", () => {
		const edges = [edge("if", "a"), edge("if", "b")];
		const result = sequentializeFanOut(
			[node("if", "branch"), node("a"), node("b")],
			edges,
			new Set(),
			[],
		);

		expect(pairs(result.edges)).toEqual(["if>a", "if>b"]);
	});
});
