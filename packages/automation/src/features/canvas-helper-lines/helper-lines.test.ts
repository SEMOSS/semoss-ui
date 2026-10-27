import type { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { getHelperLines } from "./helper-lines";

function box(
	id: string,
	x: number,
	y: number,
	extra: Partial<Node> = {},
): Node {
	return {
		id,
		position: { x, y },
		data: {},
		measured: { width: 100, height: 50 },
		...extra,
	};
}

describe("getHelperLines", () => {
	const nodes = [box("a", 0, 0), box("b", 300, 200)];

	it("snaps left edges that are within the threshold", () => {
		const result = getHelperLines("b", { x: 3, y: 200 }, nodes);
		expect(result.x).toBe(0);
		expect(result.vertical?.position).toBe(0);
	});

	it("snaps centers together", () => {
		const result = getHelperLines("b", { x: 4, y: 200 }, [
			box("a", 0, 0, { measured: { width: 108, height: 50 } }),
			box("b", 300, 200),
		]);
		expect(result.x).toBeDefined();
	});

	it("snaps top edges and spans both nodes", () => {
		const result = getHelperLines("b", { x: 300, y: -2 }, nodes);
		expect(result.y).toBe(0);
		expect(result.horizontal).toEqual({ position: 0, start: 0, end: 400 });
	});

	it("returns nothing when no node is close enough", () => {
		expect(getHelperLines("b", { x: 150, y: 120 }, nodes)).toEqual({});
	});

	it("ignores group nodes and nodes with a different parent", () => {
		const result = getHelperLines("b", { x: 3, y: 200 }, [
			box("node-group-1", 0, 0),
			box("c", 0, 0, { parentId: "loop" }),
			box("b", 300, 200),
		]);
		expect(result).toEqual({});
	});

	it("returns nothing for unmeasured nodes", () => {
		const unmeasured: Node = {
			id: "b",
			position: { x: 0, y: 0 },
			data: {},
		};
		expect(
			getHelperLines("b", { x: 0, y: 0 }, [box("a", 0, 0), unmeasured]),
		).toEqual({});
	});
});
