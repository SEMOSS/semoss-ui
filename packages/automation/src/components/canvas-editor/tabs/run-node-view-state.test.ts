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
	getVisibleRunNodeContentView,
	mapSavedResultPage,
	RUN_NODE_VIEW_LABELS,
	RUN_RESULTS_LAYOUT_CLASSES,
	resolveLiveRunNodeId,
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

describe("run node viewer states and invariants", () => {
	const result = (
		nodeId: string,
		status: AutomationNodeResult["STATUS"],
	): AutomationNodeResult => ({
		NODE_ID: nodeId,
		NODE_LABEL: nodeId,
		STATUS: status,
		DURATION_MS: 1,
		OUTPUT_PREVIEW: "",
		ERROR_MESSAGE: null,
	});

	it("advances automatic live selection to the final successful node", () => {
		const active = [result("query", "SUCCESS"), result("clean", "RUNNING")];
		expect(resolveLiveRunNodeId(active, "query", false, "RUNNING")).toBe(
			"clean",
		);

		const completed = [
			result("query", "SUCCESS"),
			result("clean", "SUCCESS"),
			result("transform", "SUCCESS"),
		];
		expect(resolveLiveRunNodeId(completed, "clean", false, "SUCCESS")).toBe(
			"transform",
		);
	});

	it("preserves explicit selection and selects failures automatically", () => {
		const failed = [result("query", "SUCCESS"), result("clean", "FAILED")];
		expect(resolveLiveRunNodeId(failed, "query", true, "FAILED")).toBe(
			"query",
		);
		expect(resolveLiveRunNodeId(failed, "query", false, "FAILED")).toBe(
			"clean",
		);
	});

	it("distinguishes loading, error, empty, and ready states", () => {
		expect(getAsyncViewerState(true, null, false, false)).toBe("loading");
		expect(getAsyncViewerState(false, "Failed", false, false)).toBe(
			"error",
		);
		expect(getAsyncViewerState(false, null, true, true)).toBe("empty");
		expect(getAsyncViewerState(false, null, true, false)).toBe("ready");
	});

	it("shows implementation details only in developer mode", () => {
		expect(getVisibleRunNodeContentView("source", false)).toBe("output");
		expect(getVisibleRunNodeContentView("source", true)).toBe("source");
		expect(getVisibleRunNodeContentView("output", true)).toBe("output");
	});

	it("provides explicit accessible names for detail and recovery controls", () => {
		expect(RUN_NODE_VIEW_LABELS).toMatchObject({
			navigation: "Run nodes",
			detailView: "Run node detail view",
			output: "Output",
			source: "Implementation",
			retryData: "Retry loading node data",
			retrySource: "Retry loading executed implementation",
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
