import { describe, expect, it } from "vitest";
import type {
	AutomationNode,
	AutomationNodeBody,
} from "../../domain/automation.types";
import {
	getLoopBodyUpstreamVariables,
	insertLoopBodyNode,
	removeLoopBodyNode,
} from "./loop-body-graph";

function bodyNode(id: string, x: number, y = 0): AutomationNode {
	return {
		id,
		type: "wait",
		label: id,
		position: { x, y },
		outputVar: `${id}_output`,
		config: { seconds: "1" },
		workflowType: "control.wait",
		workflowConfig: { durationSeconds: 1 },
		workflowCodeMode: "generated",
	};
}

describe("loop body graph editing", () => {
	it("inserts on one branch route without rebuilding the other route", () => {
		const decision = bodyNode("decision", 0);
		decision.type = "branch";
		const yesNode = bodyNode("yes", 520, -120);
		const noNode = bodyNode("no", 520, 120);
		const body: AutomationNodeBody = {
			nodes: [decision, yesNode, noNode],
			edges: [
				{
					id: "yes-edge",
					kind: "control",
					source: decision.id,
					target: yesNode.id,
					sourceHandle: "case-decision-yes",
					targetHandle: "in-yes",
				},
				{
					id: "no-edge",
					kind: "control",
					source: decision.id,
					target: noNode.id,
					sourceHandle: "else-decision",
					targetHandle: "in-no",
				},
			],
		};
		const inserted = bodyNode("review", 0);

		const result = insertLoopBodyNode(body, inserted, {
			sourceId: decision.id,
			sourceHandle: "case-decision-yes",
		});

		expect(result.edges).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ id: "no-edge" }),
				expect.objectContaining({
					source: decision.id,
					target: inserted.id,
					sourceHandle: "case-decision-yes",
				}),
				expect.objectContaining({
					source: inserted.id,
					target: yesNode.id,
				}),
			]),
		);
		expect(result.edges).not.toContainEqual(
			expect.objectContaining({ id: "yes-edge" }),
		);
	});

	it("derives scope variables from graph ancestors rather than array order", () => {
		const first = bodyNode("first", 0);
		const unrelated = bodyNode("unrelated", 0, 200);
		const selected = bodyNode("selected", 300);
		const body: AutomationNodeBody = {
			nodes: [unrelated, selected, first],
			edges: [
				{
					id: "first-selected",
					kind: "control",
					source: first.id,
					target: selected.id,
					sourceHandle: "out-first",
					targetHandle: "in-selected",
				},
			],
		};

		expect(getLoopBodyUpstreamVariables(body, selected.id)).toEqual([
			first.outputVar,
		]);
	});

	it("reconnects a simple path when its middle node is removed", () => {
		const first = bodyNode("first", 0);
		const middle = bodyNode("middle", 260);
		const last = bodyNode("last", 520);
		const result = removeLoopBodyNode(
			{
				nodes: [first, middle, last],
				edges: [
					{
						id: "first-middle",
						kind: "control",
						source: first.id,
						target: middle.id,
						sourceHandle: "out-first",
						targetHandle: "in-middle",
					},
					{
						id: "middle-last",
						kind: "control",
						source: middle.id,
						target: last.id,
						sourceHandle: "out-middle",
						targetHandle: "in-last",
					},
				],
			},
			middle.id,
		);

		expect(result.nodes.map((node) => node.id)).toEqual([
			first.id,
			last.id,
		]);
		expect(result.edges).toEqual([
			expect.objectContaining({
				source: first.id,
				target: last.id,
				sourceHandle: "out-first",
				targetHandle: "in-last",
			}),
		]);
	});
});
