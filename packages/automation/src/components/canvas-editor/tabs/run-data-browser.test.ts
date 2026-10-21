import { describe, expect, it } from "vitest";
import type {
	AutomationNodeResult,
	AutomationRunDetail,
} from "../../../domain/automation.types";
import { buildRunDataItems } from "./run-data-browser-data";

function nodeResult(
	id: string,
	status: AutomationNodeResult["STATUS"],
	preview: string,
): AutomationNodeResult {
	return {
		NODE_ID: id,
		NODE_LABEL: id,
		STATUS: status,
		DURATION_MS: 25,
		OUTPUT_PREVIEW: preview,
		ERROR_MESSAGE: null,
		outputVariable: `${id}_result`,
	};
}

function runDetail(nodeResults: AutomationNodeResult[]): AutomationRunDetail {
	return {
		RUN_ID: "run-1",
		PROJECT_ID: "project-1",
		STARTED_AT: "2026-10-10T10:00:00Z",
		COMPLETED_AT: "2026-10-10T10:00:01Z",
		STATUS: "SUCCESS",
		TRIGGER_TYPE: "MANUAL",
		INPUT_SNAPSHOT: '{"source":"contact-center.csv"}',
		nodeResults,
	};
}

describe("run data browser items", () => {
	it("keeps the run input and groups every loop iteration as a processed item", () => {
		const query = nodeResult("query", "SUCCESS", "3 rows");
		const loop = nodeResult("loop", "SUCCESS", "processed 2");
		loop.iterations = [
			{
				index: 0,
				nodeResults: [nodeResult("send-0", "SUCCESS", "VET-100")],
			},
			{
				index: 1,
				nodeResults: [nodeResult("send-1", "FAILED", "VET-101")],
			},
		];

		const items = buildRunDataItems(runDetail([query, loop]));

		expect(items).toHaveLength(3);
		expect(items[0]).toEqual(
			expect.objectContaining({
				key: "root",
				label: "Run input",
				input: '{\n  "source": "contact-center.csv"\n}',
			}),
		);
		expect(items[1]).toEqual(
			expect.objectContaining({
				key: "loop:0",
				label: "loop · Item 1",
				status: "SUCCESS",
			}),
		);
		expect(items[2]).toEqual(
			expect.objectContaining({
				key: "loop:1",
				status: "FAILED",
			}),
		);
		expect(items[2].searchText).toContain("VET-101");
	});

	it("does not invent a loop input value that history does not retain", () => {
		const loop = nodeResult("loop", "SUCCESS", "processed 1");
		loop.iterations = [
			{
				index: 0,
				nodeResults: [nodeResult("send-0", "SUCCESS", "sent")],
			},
		];

		const items = buildRunDataItems(runDetail([loop]));

		expect(items[1].input).toContain("not retained separately");
	});
});
