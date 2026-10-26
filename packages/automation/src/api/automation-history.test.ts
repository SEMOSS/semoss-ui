import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "@semoss/sdk";
import {
	getAutomationResult,
	getAutomationRun,
	getAutomationRunFramePage,
	getAutomationRunSource,
	listAutomationRuns,
	listAutomationVersions,
	resumeAutomationRun,
	rollbackAutomation,
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

	it("validates existing run history alongside version history", async () => {
		const runs = [
			{ RUN_ID: "run-1", PROJECT_ID: "app-1", STATUS: "SUCCESS" },
		];
		vi.mocked(runPixel).mockResolvedValue(pixelResponse(runs));
		await expect(listAutomationRuns("app-1")).resolves.toEqual(runs);
		vi.mocked(runPixel).mockResolvedValue(pixelResponse({}));
		await expect(listAutomationRuns("app-1")).rejects.toThrow(
			"invalid response",
		);
	});

	it("validates run details before returning them", async () => {
		const detail = { RUN_ID: "run-1", nodeResults: [] };
		vi.mocked(runPixel).mockResolvedValue(pixelResponse(detail));
		await expect(getAutomationRun("app-1", "run-1")).resolves.toEqual(
			detail,
		);
		await expect(getAutomationRun("app-1", "other-run")).rejects.toThrow(
			"not found",
		);
	});

	it("validates resume results and surfaces failures", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse({ RUN_ID: "run-1" }),
		);
		await expect(resumeAutomationRun("app-1", "run-1")).resolves.toEqual({
			RUN_ID: "run-1",
		});
		vi.mocked(runPixel).mockResolvedValue(pixelResponse({}));
		await expect(resumeAutomationRun("app-1", "run-1")).rejects.toThrow(
			"could not be continued",
		);
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse(undefined, ["Resume denied"]),
		);
		await expect(resumeAutomationRun("app-1", "run-1")).rejects.toThrow(
			"Resume denied",
		);
	});

	it("validates paged run output", async () => {
		const frame = {
			value: { queryName: "result", frameType: "GRID" },
			type: "FRAME_MAP" as const,
		};
		const countResponse = pixelResponse(2);
		const pageResponse = pixelResponse({
			data: { headers: ["value"], values: [[1], [2]] },
		});
		vi.mocked(runPixel).mockResolvedValue({
			...countResponse,
			pixelReturn: [
				...countResponse.pixelReturn,
				...pageResponse.pixelReturn,
			],
		});
		await expect(
			getAutomationRunFramePage("insight-1", frame, 0),
		).resolves.toEqual({
			headers: ["value"],
			rows: [[1], [2]],
			total: 2,
			nextOffset: 2,
			hasMore: false,
		});
		vi.mocked(runPixel).mockResolvedValue(pixelResponse(undefined));
		await expect(
			getAutomationRunFramePage("insight-1", frame, 0),
		).rejects.toThrow("invalid page");
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse(undefined, ["Frame denied"]),
		);
		await expect(
			getAutomationRunFramePage("insight-1", frame, 0),
		).rejects.toThrow("Frame denied");
		await expect(
			getAutomationRunFramePage(
				"insight-1",
				{ ...frame, value: { frameType: "GRID" } },
				0,
			),
		).rejects.toThrow("unavailable");
	});

	it("lists saved versions using the backend history fields", async () => {
		const versions = [
			{
				id: "abc123",
				user: "Editor",
				date: "2026-10-19",
				message: "Save automation",
			},
		];
		vi.mocked(runPixel).mockResolvedValue(pixelResponse(versions));
		await expect(listAutomationVersions('app-"1')).resolves.toEqual(
			versions,
		);
		expect(runPixel).toHaveBeenCalledWith(
			`ListAutomationVersions(project=${JSON.stringify(['app-"1'])}, limit=["100"]);`,
		);
	});

	it("accepts an empty version history", async () => {
		vi.mocked(runPixel).mockResolvedValue(pixelResponse([]));
		await expect(listAutomationVersions("app-1")).resolves.toEqual([]);
	});

	it.each([
		undefined,
		{},
		[{ id: "abc123" }],
		[{ id: "", user: "Editor", date: "today", message: "Save" }],
	])("rejects invalid version history %j", async (output) => {
		vi.mocked(runPixel).mockResolvedValue(pixelResponse(output));
		await expect(listAutomationVersions("app-1")).rejects.toThrow(
			"invalid response",
		);
	});

	it("restores the selected revision only after a confirmed save", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse({ saved: true, revision: "new-revision" }),
		);
		await expect(
			rollbackAutomation("app-1", "abc123", "current-revision"),
		).resolves.toBeUndefined();
		expect(runPixel).toHaveBeenCalledWith(
			'RollbackAutomation(project=["app-1"], revision=["abc123"], expectedRevision=["current-revision"]);',
		);
	});

	it.each([
		undefined,
		{ saved: false },
		{ saved: true },
		{ saved: true, revision: "" },
	])("rejects unsuccessful rollback %j", async (output) => {
		vi.mocked(runPixel).mockResolvedValue(pixelResponse(output));
		await expect(
			rollbackAutomation("app-1", "abc123", "current-revision"),
		).rejects.toThrow("not confirmed");
	});

	it("surfaces permission errors for version listing and restoration", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			pixelResponse(undefined, ["Access denied"]),
		);
		await expect(listAutomationVersions("app-1")).rejects.toThrow(
			"Access denied",
		);
		await expect(
			rollbackAutomation("app-1", "abc123", "current-revision"),
		).rejects.toThrow("Access denied");
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
