import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "@semoss/sdk";
import {
	getAutomationResult,
	getAutomationRunSource,
	listAutomationRuns,
	searchAutomationRuns,
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

	it("surfaces Pixel errors instead of treating failed history as empty", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse(undefined, ["History denied"]),
		);

		await expect(listAutomationRuns("app-1")).rejects.toThrow(
			"History denied",
		);
	});

	it("searches bounded run summaries with server-side filters", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse({
				runs: [
					{
						RUN_ID: "run-1",
						PROJECT_ID: "app-1",
						STATUS: "FAILED",
						STARTED_AT: "2026-10-14T12:00:00Z",
						COMPLETED_AT: "2026-10-14T12:00:03Z",
					},
				],
				offset: 0,
				nextOffset: 1,
				hasMore: false,
			}),
		);

		await expect(
			searchAutomationRuns("app-1", {
				search: "smtp",
				status: "FAILED",
				triggerType: "SCHEDULED",
				startDate: "2026-10-14T00:00:00Z",
			}),
		).resolves.toMatchObject({ nextOffset: 1, hasMore: false });
		expect(vi.mocked(runPixel).mock.calls[0]?.[0]).toContain(
			"SearchAutomationRuns",
		);
		expect(vi.mocked(runPixel).mock.calls[0]?.[0]).toContain(
			'status=["FAILED"]',
		);
	});

	it("rejects a search page that cannot advance while more runs remain", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse({
				runs: [],
				offset: 50,
				nextOffset: 50,
				hasMore: true,
			}),
		);

		await expect(searchAutomationRuns("app-1", {}, 50)).rejects.toThrow(
			"invalid response",
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
