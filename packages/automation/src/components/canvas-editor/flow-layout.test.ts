import { describe, expect, it } from "vitest";
import { getOrderedFlowNodes, layoutFlowNodes } from "./flow-layout";

describe("shared automation flow layout", () => {
	it("keeps branch lanes apart and places joined nodes after both parents", () => {
		const nodes = ["join", "short", "start", "tall"].map((id) => ({ id }));
		const edges = [
			{ source: "start", target: "short" },
			{ source: "start", target: "tall" },
			{ source: "short", target: "join" },
			{ source: "tall", target: "join" },
		];
		const positions = layoutFlowNodes(nodes, edges, (node) => ({
			width: 280,
			height: node.id === "tall" ? 240 : 120,
		}));
		const [join, short, start, tall] = positions;
		expect(short.position.x).toBe(tall.position.x);
		expect(tall.position.y).toBeGreaterThanOrEqual(
			short.position.y + 120 + 40,
		);
		expect(join.position.x).toBeGreaterThan(short.position.x);
		expect(short.position.x).toBeGreaterThan(start.position.x);
		expect(nodes).toEqual(
			["join", "short", "start", "tall"].map((id) => ({ id })),
		);
	});

	it("retains disconnected and cyclic nodes while ignoring missing endpoints", () => {
		const nodes = [{ id: "a" }, { id: "b" }, { id: "orphan" }];
		const edges = [
			{ source: "a", target: "b" },
			{ source: "b", target: "a" },
			{ source: "missing", target: "orphan" },
		];
		expect(
			getOrderedFlowNodes(nodes, edges).map((node) => node.id),
		).toEqual(["orphan", "a", "b"]);
		expect(
			layoutFlowNodes(nodes, edges, () => ({ width: 280, height: 120 })),
		).toHaveLength(3);
	});
});
