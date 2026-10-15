import { describe, expect, it } from "vitest";
import type { AutomationNode } from "../../domain/automation.types";
import type { AutomationScopeEntry } from "../../domain/automation-inspector";
import { getLoopBodyScope, getLoopContextVariables } from "./loop-scope";

function waitNode(id: string, outputVar: string): AutomationNode {
	return {
		id,
		type: "wait",
		label: id,
		position: { x: 0, y: 0 },
		outputVar,
		config: { seconds: "1" },
		workflowType: "control.wait",
		workflowConfig: { durationSeconds: 1 },
		workflowCodeMode: "generated",
	};
}

function template(name: string): string {
	return `\${${name}}`;
}

describe("loop scope", () => {
	it("exposes business-facing values for each loop mode", () => {
		expect(
			getLoopContextVariables(
				{
					mode: "forEach",
					items: template("rows"),
					batchSize: 1,
					maxIterations: 100,
				},
				"loop",
				[],
			).map((variable) => variable.name),
		).toContain("loop.item");

		expect(
			getLoopContextVariables(
				{
					mode: "while",
					condition: template("keepGoing"),
					maxIterations: 10,
				},
				"loop",
				[waitNode("review", "review_result")],
			).map((variable) => variable.name),
		).toContain("loop.previous.review_result");
	});

	it("combines parent inputs, loop values, and preceding inner outputs", () => {
		const first = waitNode("first", "first_result");
		const selected = waitNode("selected", "selected_result");
		const parentEntry: AutomationScopeEntry = {
			name: "rows",
			source: "node",
			label: "Database rows",
			description: "Rows from the database step.",
			availability: "guaranteed",
			pythonExpression: 'scope["rows"]',
			templateExpression: template("rows"),
		};
		const loop: AutomationNode = {
			id: "loop-node",
			type: "loop",
			label: "Review every row",
			position: { x: 0, y: 0 },
			outputVar: "row_loop",
			config: {
				mode: "forEach",
				items: template("rows"),
				batchSize: 1,
				maxIterations: 100,
			},
			workflowType: "control.loop",
			workflowConfig: {},
			workflowCodeMode: "generated",
			body: {
				nodes: [first, selected],
				edges: [
					{
						id: "first-selected",
						kind: "control",
						source: first.id,
						target: selected.id,
					},
				],
			},
		};

		const scope = getLoopBodyScope({
			loop,
			selectedNodeId: selected.id,
			upstreamVars: ["rows"],
			scopeEntries: [parentEntry],
		});

		expect(scope.upstreamVars).toEqual(
			expect.arrayContaining([
				"rows",
				"row_loop",
				"row_loop.item",
				"first_result",
			]),
		);
		expect(
			scope.scopeEntries.find((entry) => entry.name === "row_loop.item"),
		).toEqual(
			expect.objectContaining({
				pythonExpression: 'scope["row_loop"]["item"]',
				requiredPythonExpression: 'scope["row_loop"]["item"]',
				optionalPythonExpression:
					'scope.get("row_loop", {}).get("item")',
				templateExpression: template("row_loop.item"),
			}),
		);
	});
});
