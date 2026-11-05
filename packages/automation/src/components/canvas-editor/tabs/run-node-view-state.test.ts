import { describe, expect, it } from "vitest";
import type {
	AutomationNodeResult,
	AutomationSavedResultReference,
} from "../../../domain/automation.types";
import {
	findSavedResultForOccurrence,
	getAsyncViewerState,
	getRunNodeDataSource,
	getRunNodeOccurrenceKey,
	getRunScopeVariableRows,
	mapSavedResultPage,
	RUN_NODE_VIEW_LABELS,
	RUN_RESULTS_LAYOUT_CLASSES,
} from "./run-node-view-state";

function savedResult(
	resultId: string,
	parentNodeId?: string,
	iterationIndex?: number,
): AutomationSavedResultReference {
	return {
		RESULT_ID: resultId,
		NODE_ID: "body-node",
		PARENT_NODE_ID: parentNodeId,
		ITERATION_INDEX: iterationIndex,
		RESULT_KIND: "TABLE",
		BYTE_COUNT: 10,
		CHECKSUM: "checksum",
		RETAIN_UNTIL: "2026-10-13T00:00:00Z",
		CAPTURE_STATE: "RETAINED",
	};
}

const frame: NonNullable<AutomationNodeResult["OUTPUT_FRAME"]> = {
	type: "FRAME_MAP",
	value: { frameType: "GRID", queryName: "FRAME_1" },
};

describe("run node retained output", () => {
	it("prefers a retained table over the live execution frame", () => {
		const retained = savedResult("retained-1");

		expect(getRunNodeDataSource(retained, "insight-1", frame)).toEqual({
			kind: "retained",
			savedResult: retained,
		});
		expect(getRunNodeDataSource(undefined, "insight-1", frame)).toEqual({
			kind: "live",
			insightId: "insight-1",
			frame,
		});
	});

	it("uses the retained next offset instead of assuming a full page", () => {
		expect(
			mapSavedResultPage({
				...savedResult("retained-1"),
				ROW_COUNT: 100,
				schema: [{ name: "name", type: "STRING" }],
				rows: [["first"], ["second"]],
				offset: 0,
				nextOffset: 2,
				hasMore: true,
			}),
		).toMatchObject({
			headers: ["name"],
			rows: [["first"], ["second"]],
			total: 100,
			nextOffset: 2,
			hasMore: true,
		});
	});
});

describe("run node occurrence identity", () => {
	it("matches repeated loop body nodes by parent and iteration", () => {
		const results = [
			savedResult("root"),
			savedResult("iteration-1", "loop", 0),
			savedResult("iteration-2", "loop", 1),
		];

		expect(
			findSavedResultForOccurrence(results, "body-node", {
				parentNodeId: "loop",
				iterationIndex: 1,
			})?.RESULT_ID,
		).toBe("iteration-2");
		expect(
			findSavedResultForOccurrence(results, "body-node")?.RESULT_ID,
		).toBe("root");
		expect(
			getRunNodeOccurrenceKey("run-1", "body-node", {
				parentNodeId: "loop",
				iterationIndex: 0,
			}),
		).not.toBe(
			getRunNodeOccurrenceKey("run-1", "body-node", {
				parentNodeId: "loop",
				iterationIndex: 1,
			}),
		);
	});
});

describe("run scope variable rows", () => {
	it("returns null when there is no retained snapshot", () => {
		expect(getRunScopeVariableRows(null)).toBeNull();
		expect(getRunScopeVariableRows(undefined)).toBeNull();
		expect(getRunScopeVariableRows("")).toBeNull();
	});

	it("returns null when the snapshot is not valid JSON", () => {
		expect(getRunScopeVariableRows("{not valid json")).toBeNull();
	});

	it("returns null when the snapshot is not a plain object", () => {
		expect(getRunScopeVariableRows("42")).toBeNull();
		expect(getRunScopeVariableRows('"a string"')).toBeNull();
		expect(getRunScopeVariableRows("null")).toBeNull();
		expect(getRunScopeVariableRows("[1,2,3]")).toBeNull();
	});

	it("turns each top-level variable into a ${name} row", () => {
		const rows = getRunScopeVariableRows(
			JSON.stringify({ greeting: "hi", count: 2 }),
		);

		expect(rows).toEqual([
			{ name: "${greeting}", value: "hi" },
			{ name: "${count}", value: "2" },
		]);
	});

	it("formats non-string values as pretty-printed JSON", () => {
		const rows = getRunScopeVariableRows(
			JSON.stringify({ user: { name: "Ada" }, tags: ["a", "b"] }),
		);

		expect(rows).toEqual([
			{
				name: "${user}",
				value: JSON.stringify({ name: "Ada" }, null, 2),
			},
			{ name: "${tags}", value: JSON.stringify(["a", "b"], null, 2) },
		]);
	});

	it("breaks a loop's own context entry into one row per whitelisted field", () => {
		const rows = getRunScopeVariableRows(
			JSON.stringify({
				my_loop: {
					item: "Ada",
					batch: ["Ada", "Grace"],
					index: 0,
					number: 1,
					total: 2,
					maximum: 2,
					isFirst: true,
					isLast: false,
					extra: "should be dropped",
				},
			}),
		);

		expect(rows).toEqual([
			{ name: "${my_loop.item}", value: "Ada" },
			{
				name: "${my_loop.batch}",
				value: JSON.stringify(["Ada", "Grace"], null, 2),
			},
			{ name: "${my_loop.index}", value: "0" },
			{ name: "${my_loop.number}", value: "1" },
			{ name: "${my_loop.total}", value: "2" },
			{ name: "${my_loop.maximum}", value: "2" },
			{ name: "${my_loop.isFirst}", value: "true" },
			{ name: "${my_loop.isLast}", value: "false" },
		]);
	});

	it("does not treat a plain nested object lacking loop-context keys as a loop entry", () => {
		const rows = getRunScopeVariableRows(
			JSON.stringify({ user: { index: 0, name: "Ada" } }),
		);

		expect(rows).toEqual([
			{
				name: "${user}",
				value: JSON.stringify({ index: 0, name: "Ada" }, null, 2),
			},
		]);
	});
});

describe("run node viewer states and invariants", () => {
	it("distinguishes loading, error, empty, and ready states", () => {
		expect(getAsyncViewerState(true, null, false, false)).toBe("loading");
		expect(getAsyncViewerState(false, "Failed", false, false)).toBe(
			"error",
		);
		expect(getAsyncViewerState(false, null, true, true)).toBe("empty");
		expect(getAsyncViewerState(false, null, true, false)).toBe("ready");
	});

	it("provides explicit accessible names for detail and recovery controls", () => {
		expect(RUN_NODE_VIEW_LABELS).toMatchObject({
			navigation: "Run nodes",
			detailView: "Run node detail view",
			output: "Output",
			retryData: "Retry loading node data",
		});
	});

	it("stacks on narrow screens and bounds keyboard-scrollable data", () => {
		expect(RUN_RESULTS_LAYOUT_CLASSES.root).toContain("flex-col");
		expect(RUN_RESULTS_LAYOUT_CLASSES.root).toContain("sm:flex-row");
		expect(RUN_RESULTS_LAYOUT_CLASSES.navigation).toContain("w-full");
		expect(RUN_RESULTS_LAYOUT_CLASSES.navigation).toContain("sm:w-56");
		expect(RUN_RESULTS_LAYOUT_CLASSES.scrollRegion).toContain(
			"overflow-auto",
		);
		expect(RUN_RESULTS_LAYOUT_CLASSES.scrollRegion).toContain(
			"focus-visible:outline",
		);
	});
});
