import { describe, expect, it } from "vitest";
import type {
	AutomationNodeResult,
	AutomationRunDetail,
} from "../../../domain/automation.types";
import { runMatchesKeyword } from "./run-data-browser-data";

function nodeResult(
	overrides: Partial<AutomationNodeResult> & { NODE_ID: string },
): AutomationNodeResult {
	return {
		NODE_LABEL: overrides.NODE_ID,
		STATUS: "SUCCESS",
		DURATION_MS: 25,
		OUTPUT_PREVIEW: null,
		ERROR_MESSAGE: null,
		...overrides,
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
		nodeResults,
	};
}

describe("runMatchesKeyword", () => {
	it("matches an empty/whitespace keyword against every run", () => {
		const detail = runDetail([nodeResult({ NODE_ID: "query" })]);

		expect(runMatchesKeyword(detail, "")).toBe(true);
		expect(runMatchesKeyword(detail, "   ")).toBe(true);
	});

	it("matches the run ID case-insensitively", () => {
		const detail = runDetail([nodeResult({ NODE_ID: "query" })]);

		expect(runMatchesKeyword(detail, "RUN-1")).toBe(true);
		expect(runMatchesKeyword(detail, "no-match")).toBe(false);
	});

	it("matches the incoming message (inputPayload)", () => {
		const detail = runDetail([
			nodeResult({
				NODE_ID: "query",
				inputPayload: '{"customerId":"VET-100"}',
			}),
		]);

		expect(runMatchesKeyword(detail, "vet-100")).toBe(true);
	});

	it("matches the outgoing message (OUTPUT_PREVIEW / OUTPUT_VALUE)", () => {
		const detail = runDetail([
			nodeResult({ NODE_ID: "send", OUTPUT_PREVIEW: "sent to billing" }),
			nodeResult({ NODE_ID: "query", OUTPUT_VALUE: "42 rows returned" }),
		]);

		expect(runMatchesKeyword(detail, "billing")).toBe(true);
		expect(runMatchesKeyword(detail, "42 rows")).toBe(true);
	});

	it("matches the variable map snapshot (scopeSnapshot)", () => {
		const detail = runDetail([
			nodeResult({
				NODE_ID: "assign",
				scopeSnapshot: '{"customerName":"Acme Corp"}',
			}),
		]);

		expect(runMatchesKeyword(detail, "acme corp")).toBe(true);
	});

	it("matches an error message", () => {
		const detail = runDetail([
			nodeResult({
				NODE_ID: "query",
				ERROR_MESSAGE: "Connection timed out",
			}),
		]);

		expect(runMatchesKeyword(detail, "timed out")).toBe(true);
	});

	it("searches nested loop iteration results", () => {
		const loop = nodeResult({ NODE_ID: "loop" });
		loop.iterations = [
			{
				index: 0,
				nodeResults: [
					nodeResult({
						NODE_ID: "send-0",
						OUTPUT_PREVIEW: "VET-100 processed",
					}),
				],
			},
		];
		const detail = runDetail([loop]);

		expect(runMatchesKeyword(detail, "vet-100")).toBe(true);
		expect(runMatchesKeyword(detail, "vet-999")).toBe(false);
	});

	it("returns false when nothing matches", () => {
		const detail = runDetail([
			nodeResult({ NODE_ID: "query", OUTPUT_PREVIEW: "3 rows" }),
		]);

		expect(runMatchesKeyword(detail, "nonexistent")).toBe(false);
	});
});
