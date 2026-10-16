import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "@semoss/sdk";
import {
	getAutomationResult,
	getAutomationRunSource,
	listAutomationRuns,
	loadAutomationInputTablePreview,
} from "./automation-history";

vi.mock("@semoss/sdk", () => ({ runPixel: vi.fn() }));

function pixelResponse(output: unknown, errors: string[] = []) {
	return {
		errors,
		insightId: "insight-1",
		pixelReturn: [
			{
				isMeta: false,
				operationType: ["MAP"],
				output,
				pixelExpression: "",
				pixelId: "0",
				timeToRun: 0,
			},
		],
	};
}

describe("Automation history API validation", () => {
	beforeEach(() => vi.resetAllMocks());

	it("loads a bounded retained upstream table without running the workflow", async () => {
		const reference = {
			RESULT_ID: "table-1",
			NODE_ID: "query-1",
			RESULT_KIND: "TABLE",
			ROW_COUNT: 2,
			BYTE_COUNT: 20,
			CHECKSUM: "checksum",
			RETAIN_UNTIL: "2030-01-01",
			CAPTURE_STATE: "RETAINED",
		};
		vi.mocked(runPixel)
			.mockResolvedValueOnce(
				pixelResponse([
					{ RUN_ID: "run-1", PROJECT_ID: "app-1", STATUS: "SUCCESS" },
				]),
			)
			.mockResolvedValueOnce(
				pixelResponse({
					RUN_ID: "run-1",
					STARTED_AT: "2026-10-14",
					nodeResults: [
						{
							NODE_ID: "query-1",
							STATUS: "SUCCESS",
							OUTPUT_PREVIEW: "table",
						},
					],
					savedResults: [reference],
				}),
			)
			.mockResolvedValueOnce(
				pixelResponse({
					...reference,
					schema: [{ name: "STATUS", type: "STRING" }],
					rows: [["active"], ["inactive"]],
					offset: 0,
					nextOffset: 2,
					hasMore: false,
				}),
			);
		await expect(
			loadAutomationInputTablePreview("app-1", "query-1"),
		).resolves.toMatchObject({
			runId: "run-1",
			columns: [{ name: "STATUS", type: "STRING" }],
			page: { headers: ["STATUS"], rows: [["active"], ["inactive"]] },
		});
		expect(
			vi
				.mocked(runPixel)
				.mock.calls.map(([expression]) => expression)
				.join(" "),
		).not.toMatch(/TriggerAutomation|RunAutomationDefinition|SqlQuery/);
	});

	it("does not offer failed or unrelated outputs as input table samples", async () => {
		vi.mocked(runPixel)
			.mockResolvedValueOnce(
				pixelResponse([
					{ RUN_ID: "run-1", PROJECT_ID: "app-1", STATUS: "FAILED" },
				]),
			)
			.mockResolvedValueOnce(
				pixelResponse({
					RUN_ID: "run-1",
					nodeResults: [{ NODE_ID: "query-1", STATUS: "FAILED" }],
					savedResults: [],
				}),
			);
		await expect(
			loadAutomationInputTablePreview("app-1", "query-1"),
		).resolves.toBeNull();
	});

	it("reports empty history without executing a query", async () => {
		vi.mocked(runPixel).mockResolvedValueOnce(pixelResponse([]));
		await expect(
			loadAutomationInputTablePreview("app-1", "query-1"),
		).resolves.toBeNull();
		expect(runPixel).toHaveBeenCalledTimes(1);
	});

	it("surfaces Pixel errors instead of treating failed history as empty", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse(undefined, ["History denied"]),
		);

		await expect(listAutomationRuns("app-1")).rejects.toThrow(
			"History denied",
		);
	});

	it("accepts a complete retained table page", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse({
				RESULT_ID: "result-1",
				NODE_ID: "node-1",
				RESULT_KIND: "TABLE",
				ROW_COUNT: 75,
				BYTE_COUNT: 100,
				CHECKSUM: "checksum",
				RETAIN_UNTIL: "2026-10-13T00:00:00Z",
				CAPTURE_STATE: "RETAINED",
				schema: [{ name: "value", type: "STRING" }],
				rows: [["a"], ["b"]],
				offset: 0,
				nextOffset: 2,
				hasMore: true,
			}),
		);

		await expect(
			getAutomationResult("app-1", "result-1", 0),
		).resolves.toMatchObject({
			RESULT_ID: "result-1",
			nextOffset: 2,
			hasMore: true,
		});
	});

	it("rejects retained pages missing required paging payload", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse({
				RESULT_ID: "result-1",
				NODE_ID: "node-1",
				RESULT_KIND: "TABLE",
				ROW_COUNT: 75,
				BYTE_COUNT: 100,
				CHECKSUM: "checksum",
				RETAIN_UNTIL: "2026-10-13T00:00:00Z",
				CAPTURE_STATE: "RETAINED",
				schema: [{ name: "value", type: "STRING" }],
			}),
		);

		await expect(
			getAutomationResult("app-1", "result-1", 0),
		).rejects.toThrow("invalid response");
	});

	it("rejects retained pages that cannot advance while more rows remain", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse({
				RESULT_ID: "result-1",
				NODE_ID: "node-1",
				RESULT_KIND: "TABLE",
				ROW_COUNT: 75,
				BYTE_COUNT: 100,
				CHECKSUM: "checksum",
				RETAIN_UNTIL: "2026-10-13T00:00:00Z",
				CAPTURE_STATE: "RETAINED",
				schema: [{ name: "value", type: "STRING" }],
				rows: [],
				offset: 0,
				nextOffset: 0,
				hasMore: true,
			}),
		);

		await expect(
			getAutomationResult("app-1", "result-1", 0),
		).rejects.toThrow("invalid response");
	});

	it("requires source responses to identify the requested run and node", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse({
				RUN_ID: "different-run",
				NODE_ID: "node-1",
				viewKind: "PYTHON",
				legacyPython: false,
				nodeType: "developer.python",
				sourceIdentity: "developer.python",
				sourceNodeId: "node-1",
				SOURCE_CODE: "def run(scope):\n    return None\n",
			}),
		);

		await expect(
			getAutomationRunSource("app-1", "run-1", "node-1"),
		).rejects.toThrow("invalid response");
	});

	it("returns a validated source snapshot", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse({
				RUN_ID: "run-1",
				NODE_ID: "node-1",
				viewKind: "PYTHON",
				legacyPython: false,
				nodeType: "developer.python",
				sourceIdentity: "developer.python",
				sourceNodeId: "node-1",
				SOURCE_CODE: "def run(scope):\n    return None\n",
			}),
		);

		await expect(
			getAutomationRunSource("app-1", "run-1", "node-1"),
		).resolves.toMatchObject({
			viewKind: "PYTHON",
			legacyPython: false,
			sourceIdentity: "developer.python",
			source: expect.stringContaining("def run"),
		});
	});

	it("identifies historical typed source as developer.python compatibility", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse({
				RUN_ID: "run-1",
				NODE_ID: "wait-1",
				viewKind: "PYTHON",
				legacyPython: true,
				nodeType: "developer.python",
				sourceIdentity: "developer.python.compatibility",
				sourceNodeId: "wait-1",
				historicalNodeType: "control.wait",
				SOURCE_CODE: "def run(scope):\n    return 1\n",
			}),
		);

		await expect(
			getAutomationRunSource("app-1", "run-1", "wait-1"),
		).resolves.toMatchObject({
			viewKind: "PYTHON",
			nodeType: "developer.python",
			sourceIdentity: "developer.python.compatibility",
			historicalNodeType: "control.wait",
		});
	});

	it("returns a validated typed implementation descriptor", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse({
				RUN_ID: "run-1",
				NODE_ID: "node-1",
				viewKind: "IMPLEMENTATION",
				legacyPython: false,
				nodeType: "database.query",
				config: { engineId: "db", query: "SELECT 1", limit: 50 },
				implementationId: "java.database-query.v1",
				definitionHash: "a".repeat(64),
			}),
		);

		await expect(
			getAutomationRunSource("app-1", "run-1", "node-1"),
		).resolves.toMatchObject({
			viewKind: "IMPLEMENTATION",
			nodeType: "database.query",
			implementationId: "java.database-query.v1",
		});
	});
});
