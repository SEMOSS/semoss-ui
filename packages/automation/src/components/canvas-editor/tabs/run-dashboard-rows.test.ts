import { describe, expect, it } from "vitest";
import type {
	AutomationNodeResult,
	AutomationRunDetail,
	AutomationRunSummary,
} from "../../../domain/automation.types";
import {
	assignRunNumbers,
	buildDashboardRows,
	buildNodeByNodeRows,
	defaultDetailTab,
	displayRunKey,
	isRunCancellable,
	isRunRerunnable,
	iterationFromRunIdQuery,
	iterationNodeResults,
	loopBodyReprocessableIds,
	loopBodyReprocessableNodes,
	nodeErrorText,
	nodeSuccessText,
	nodeTimeLabel,
	ranInIteration,
	reprocessableNodes,
	rerunnableNodeIds,
	runIdMatchesQuery,
	sortRunsNewestFirst,
	startedAtMatches,
	summarizeRuns,
} from "./run-dashboard-rows";

describe("isRunRerunnable", () => {
	it("allows only finished runs", () => {
		for (const status of [
			"SUCCESS",
			"FAILED",
			"CANCELLED",
			"INTERRUPTED",
		] as const) {
			expect(isRunRerunnable(status)).toBe(true);
		}
		for (const status of ["RUNNING", "WAITING_FOR_INPUT"] as const) {
			expect(isRunRerunnable(status)).toBe(false);
		}
	});
});

describe("reprocessableNodes", () => {
	const snapshot = JSON.stringify({
		graph: {
			nodes: [
				{ id: "start", type: "trigger.start" },
				{ id: "query", type: "database.query" },
				{ id: "agent", type: "agent.run" },
				{ id: "loop", type: "control.loop" },
			],
		},
	});

	it("lists the run's top-level nodes that can be re-run, in run order", () => {
		const detail = {
			DEFINITION_SNAPSHOT: snapshot,
			nodeResults: [
				node({ NODE_ID: "start", NODE_LABEL: "Start" }),
				node({
					NODE_ID: "query",
					NODE_LABEL: "Query",
					STATUS: "FAILED",
				}),
				node({ NODE_ID: "agent", NODE_LABEL: "Agent" }),
				// Loop iterations nest inside their loop node; they are never offered on their own.
				node({
					NODE_ID: "loop",
					NODE_LABEL: "Loop",
					iterations: [
						{
							index: 0,
							nodeResults: [
								node({
									NODE_ID: "iteration-1",
									NODE_LABEL: "Body",
								}),
							],
						},
					],
				}),
			],
		};

		expect(reprocessableNodes(detail)).toEqual([
			{ id: "query", label: "Query", status: "FAILED" },
			{ id: "loop", label: "Loop", status: "SUCCESS" },
		]);
	});

	it("falls back to the node ID when a node has no label", () => {
		const detail = {
			DEFINITION_SNAPSHOT: snapshot,
			nodeResults: [node({ NODE_ID: "query", NODE_LABEL: "" })],
		};

		expect(reprocessableNodes(detail)[0].label).toBe("query");
	});

	it("is empty when the recorded graph cannot be read", () => {
		expect(
			reprocessableNodes({
				DEFINITION_SNAPSHOT: "not json",
				nodeResults: [node({ NODE_ID: "query" })],
			}),
		).toEqual([]);
	});
});

describe("rerunnableNodeIds", () => {
	function snapshot(nodes: { id: string; type: string }[]): string {
		return JSON.stringify({ graph: { nodes, edges: [] } });
	}

	it("excludes the trigger, wait, and agent nodes", () => {
		const ids = rerunnableNodeIds({
			DEFINITION_SNAPSHOT: snapshot([
				{ id: "start", type: "trigger.start" },
				{ id: "query", type: "database.query" },
				{ id: "pause", type: "control.wait" },
				{ id: "agent", type: "agent.run" },
				{ id: "loop", type: "control.loop" },
			]),
		});

		expect([...ids].sort()).toEqual(["loop", "query"]);
	});

	it("is empty when the recorded graph is missing or unreadable", () => {
		expect(rerunnableNodeIds({}).size).toBe(0);
		expect(
			rerunnableNodeIds({ DEFINITION_SNAPSHOT: "not json" }).size,
		).toBe(0);
		expect(
			rerunnableNodeIds({ DEFINITION_SNAPSHOT: JSON.stringify({}) }).size,
		).toBe(0);
	});
});

describe("runIdMatchesQuery", () => {
	const uuid = "a1245b3c-9f0e-4d45-8a45-0c2d45e8f145";

	it("matches only the exact displayed number for a numeric query", () => {
		expect(runIdMatchesQuery("45", 45, uuid)).toBe(true);
		expect(runIdMatchesQuery("45", 145, uuid)).toBe(false);
		expect(runIdMatchesQuery("45", 450, uuid)).toBe(false);
		expect(runIdMatchesQuery("4", 45, uuid)).toBe(false);
	});

	it("does not match a numeric query against digits inside the raw run ID", () => {
		expect(runIdMatchesQuery("45", 7, uuid)).toBe(false);
	});

	it("ignores surrounding whitespace and leading zeros", () => {
		expect(runIdMatchesQuery("  45 ", 45, uuid)).toBe(true);
		expect(runIdMatchesQuery("045", 45, uuid)).toBe(true);
	});

	it("matches a pasted run ID exactly, ignoring case", () => {
		expect(runIdMatchesQuery(uuid.toUpperCase(), 7, uuid)).toBe(true);
		expect(runIdMatchesQuery("a1245b3c", 7, uuid)).toBe(false);
		expect(runIdMatchesQuery("a1245b3c-9f0e", 7, uuid)).toBe(false);
	});

	it("does not match partial run IDs", () => {
		expect(runIdMatchesQuery("a1245b3c", 7, uuid)).toBe(false);
		expect(runIdMatchesQuery("abc", 7, uuid)).toBe(false);
	});

	it("matches a loop iteration like 45.3 on its run number, leaving the iteration to narrow", () => {
		expect(runIdMatchesQuery("45.3", 45, uuid)).toBe(true);
		expect(runIdMatchesQuery("45.3", 145, uuid)).toBe(false);
		expect(runIdMatchesQuery("45.3", 7, uuid)).toBe(false);
		expect(iterationFromRunIdQuery("45.3")).toBe(3);
		expect(iterationFromRunIdQuery(" 45.12 ")).toBe(12);
	});

	it("names no iteration for anything that isn't a number-dot-number", () => {
		for (const query of ["", "45", "45.", ".3", "45.3.1", "abc", uuid]) {
			expect(iterationFromRunIdQuery(query)).toBeNull();
		}
	});

	it("treats an empty query as matching everything", () => {
		expect(runIdMatchesQuery("   ", 7, uuid)).toBe(true);
	});
});

describe("isRunCancellable", () => {
	it("allows only the statuses the backend can cancel", () => {
		expect(isRunCancellable("RUNNING")).toBe(true);
		expect(isRunCancellable("WAITING_FOR_INPUT")).toBe(true);
		for (const status of [
			"SUCCESS",
			"FAILED",
			"INTERRUPTED",
			"CANCELLED",
		] as const) {
			expect(isRunCancellable(status)).toBe(false);
		}
	});
});

function run(overrides: Partial<AutomationRunSummary>): AutomationRunSummary {
	return {
		RUN_ID: "run-1",
		PROJECT_ID: "project-1",
		STARTED_AT: "2026-11-05T00:00:00Z",
		COMPLETED_AT: "2026-11-05T00:00:10Z",
		STATUS: "SUCCESS",
		TRIGGER_TYPE: "MANUAL",
		...overrides,
	};
}

function node(overrides: Partial<AutomationNodeResult>): AutomationNodeResult {
	return {
		NODE_ID: "node-1",
		NODE_LABEL: "Node 1",
		STATUS: "SUCCESS",
		DURATION_MS: 5,
		OUTPUT_PREVIEW: null,
		ERROR_MESSAGE: null,
		...overrides,
	};
}

function detail(
	runId: string,
	nodeResults: AutomationNodeResult[],
): AutomationRunDetail {
	return { ...run({ RUN_ID: runId }), nodeResults };
}

describe("buildNodeByNodeRows", () => {
	function pathLabels(rows: ReturnType<typeof buildNodeByNodeRows>) {
		return rows.map((row) =>
			row.kind === "execution" ? row.path.map((step) => step.label) : [],
		);
	}

	function loopNode(
		iterationCount: number,
		bodyNodeIds: string[],
	): AutomationNodeResult {
		return node({
			NODE_ID: "loop",
			NODE_LABEL: "Loop",
			iterations: Array.from({ length: iterationCount }, (_, index) => ({
				index,
				nodeResults: bodyNodeIds.map((id) =>
					node({ NODE_ID: id, NODE_LABEL: id.toUpperCase() }),
				),
			})),
		});
	}

	function build(
		runs: AutomationRunSummary[],
		details: AutomationRunDetail[],
		extras: {
			loading?: string[];
			errors?: Record<string, string>;
		} = {},
	) {
		return buildNodeByNodeRows({
			runs,
			runDetails: new Map(details.map((d) => [d.RUN_ID, d])),
			loadingRunIds: new Set(extras.loading ?? []),
			runErrors: new Map(Object.entries(extras.errors ?? {})),
			runNumbers: assignRunNumbers(runs),
		});
	}

	it("adds one row for every node hit, including each node of each loop iteration", () => {
		const rows = build(
			[run({ RUN_ID: "run-1" })],
			[
				detail("run-1", [
					node({ NODE_ID: "start", NODE_LABEL: "Start" }),
					loopNode(5000, ["a", "b", "c", "d", "e"]),
				]),
			],
		);

		// 1 start + 1 loop + 5 nodes x 5000 iterations
		expect(rows).toHaveLength(25002);
		expect(rows.filter((row) => row.kind === "execution")).toHaveLength(
			25002,
		);
	});

	it("numbers the hits of a run in the order they ran and tags loop iterations", () => {
		const rows = build(
			[run({ RUN_ID: "run-1" })],
			[detail("run-1", [loopNode(2, ["a", "b"])])],
		);

		const summary = rows.map((row) =>
			row.kind === "execution"
				? [row.hit, row.label, row.iterationIndex, row.loopLabel]
				: null,
		);
		expect(summary).toEqual([
			[5, "B", 1, "Loop"],
			[4, "A", 1, "Loop"],
			[3, "B", 0, "Loop"],
			[2, "A", 0, "Loop"],
			[1, "Loop", null, null],
		]);
	});

	it("leaves out nodes that never ran", () => {
		const rows = build(
			[run({ RUN_ID: "run-1" })],
			[
				detail("run-1", [
					node({ NODE_ID: "ran", NODE_LABEL: "Ran" }),
					node({ NODE_ID: "skipped", STATUS: "SKIPPED" }),
					node({ NODE_ID: "pending", STATUS: "PENDING" }),
					node({ NODE_ID: "failed", STATUS: "FAILED" }),
				]),
			],
		);

		expect(
			rows.map((row) => (row.kind === "execution" ? row.nodeId : null)),
		).toEqual(["failed", "ran"]);
	});

	it("keeps runs in the order given and labels each row with its stable run number", () => {
		const runs = [
			run({ RUN_ID: "newer", STARTED_AT: "2026-11-06T00:00:00Z" }),
			run({ RUN_ID: "older", STARTED_AT: "2026-11-05T00:00:00Z" }),
		];
		const rows = build(runs, [
			detail("newer", [node({ NODE_ID: "x" })]),
			detail("older", [node({ NODE_ID: "y" })]),
		]);

		expect(rows.map((row) => [row.runId, row.runNumber])).toEqual([
			["newer", 2],
			["older", 1],
		]);
	});

	it("shows a loading row, then an error row, for a run whose nodes are not loaded", () => {
		const runs = [
			run({ RUN_ID: "slow" }),
			run({ RUN_ID: "broken" }),
			run({ RUN_ID: "queued" }),
		];
		const rows = build(runs, [], {
			loading: ["slow"],
			errors: { broken: "Unable to load run details." },
		});

		expect(
			rows.map((row) =>
				row.kind === "run-status" ? [row.runId, row.state] : null,
			),
		).toEqual([
			["slow", "loading"],
			["broken", "error"],
			["queued", "loading"],
		]);
		expect(rows[1]).toMatchObject({
			message: "Unable to load run details.",
		});
	});

	it("leaves out nodes carried over from the run a reprocess came from: they were not hit again", () => {
		const rows = buildNodeByNodeRows({
			runs: [run({ RUN_ID: "run-1" })],
			runDetails: new Map([
				[
					"run-1",
					detail("run-1", [
						node({
							NODE_ID: "carried",
							NODE_LABEL: "Carried",
							CARRIED_OVER: true,
						}),
						node({ NODE_ID: "reran", NODE_LABEL: "Ran Again" }),
					]),
				],
			]),
			loadingRunIds: new Set(),
			runErrors: new Map(),
			runNumbers: new Map([["run-1", 1]]),
		});

		expect(
			rows.map((row) => (row.kind === "execution" ? row.label : "")),
		).toEqual(["Ran Again"]);
	});

	it("shows the iteration a reprocess ran again even though its loop was carried over", () => {
		const rows = buildNodeByNodeRows({
			runs: [run({ RUN_ID: "run-1" })],
			runDetails: new Map([
				[
					"run-1",
					detail("run-1", [
						node({
							NODE_ID: "loop",
							NODE_LABEL: "Loop",
							CARRIED_OVER: true,
							iterations: [
								{
									index: 0,
									nodeResults: [
										node({
											NODE_ID: "a0",
											NODE_LABEL: "A",
											CARRIED_OVER: true,
										}),
									],
								},
								{
									index: 1,
									nodeResults: [
										node({
											NODE_ID: "a1",
											NODE_LABEL: "A",
										}),
									],
								},
							],
						}),
					]),
				],
			]),
			loadingRunIds: new Set(),
			runErrors: new Map(),
			runNumbers: new Map([["run-1", 1]]),
		});

		const executions = rows.filter((row) => row.kind === "execution");
		expect(executions.map((row) => row.nodeId)).toEqual(["a1"]);
		// Its path still runs through the loop and the item it belongs to.
		expect(executions[0].path.map((step) => step.label)).toEqual([
			"Loop",
			"Item 2",
			"A",
		]);
		expect(executions[0]).toMatchObject({ iterationIndex: 1 });
	});

	it("shows, on each row, every node hit so far in that run ending at the node just hit", () => {
		const rows = build(
			[run({ RUN_ID: "run-1" })],
			[
				detail("run-1", [
					node({ NODE_ID: "pull", NODE_LABEL: "Pull Data" }),
					node({
						NODE_ID: "transform",
						NODE_LABEL: "Transform Data",
					}),
					node({ NODE_ID: "api", NODE_LABEL: "Hit API" }),
				]),
			],
		);

		expect(pathLabels(rows)).toEqual([
			["Pull Data", "Transform Data", "Hit API"],
			["Pull Data", "Transform Data"],
			["Pull Data"],
		]);
	});

	it("shows only the current loop iteration, not every earlier one", () => {
		const rows = build(
			[run({ RUN_ID: "run-1" })],
			[
				detail("run-1", [
					node({ NODE_ID: "start", NODE_LABEL: "Start" }),
					loopNode(2, ["a", "b"]),
					node({ NODE_ID: "after", NODE_LABEL: "After" }),
				]),
			],
		);

		expect(pathLabels(rows)).toEqual([
			["Start", "Loop", "After"],
			["Start", "Loop", "Item 2", "A", "B"],
			["Start", "Loop", "Item 2", "A"],
			["Start", "Loop", "Item 1", "A", "B"],
			["Start", "Loop", "Item 1", "A"],
			["Start", "Loop"],
			["Start"],
		]);
	});

	it("keeps a long loop's paths short", () => {
		const rows = build(
			[run({ RUN_ID: "run-1" })],
			[
				detail("run-1", [
					node({ NODE_ID: "start", NODE_LABEL: "Start" }),
					loopNode(5000, ["a", "b", "c", "d", "e"]),
				]),
			],
		);

		const longest = Math.max(
			...rows.map((row) =>
				row.kind === "execution" ? row.path.length : 0,
			),
		);
		// Start, Loop, the item marker, and the five body nodes.
		expect(longest).toBe(8);
	});

	it("leaves nodes that never ran out of the path, and starts each run's path afresh", () => {
		const rows = build(
			[run({ RUN_ID: "run-1" }), run({ RUN_ID: "run-2" })],
			[
				detail("run-1", [
					node({ NODE_ID: "a", NODE_LABEL: "A" }),
					node({
						NODE_ID: "skipped",
						NODE_LABEL: "Skipped",
						STATUS: "SKIPPED",
					}),
					node({ NODE_ID: "b", NODE_LABEL: "B" }),
				]),
				detail("run-2", [node({ NODE_ID: "c", NODE_LABEL: "C" })]),
			],
		);

		expect(pathLabels(rows)).toEqual([["A", "B"], ["A"], ["C"]]);
	});

	it("gives every row a unique key", () => {
		const rows = build(
			[run({ RUN_ID: "run-1" }), run({ RUN_ID: "run-2" })],
			[
				detail("run-1", [loopNode(3, ["a", "b"])]),
				detail("run-2", [loopNode(3, ["a", "b"])]),
			],
		);

		expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
	});
});

describe("loopBodyReprocessableNodes", () => {
	const snapshot = JSON.stringify({
		graph: {
			nodes: [
				{
					id: "loop",
					type: "control.loop",
					body: {
						nodes: [
							{ id: "b", type: "python.script" },
							{ id: "pause", type: "control.wait" },
							{ id: "c", type: "database.query" },
							{ id: "agent", type: "agent.run" },
						],
					},
				},
				{
					id: "other",
					type: "control.loop",
					body: { nodes: [{ id: "z", type: "python.script" }] },
				},
			],
		},
	});
	const iteration = [
		node({ NODE_ID: "b", NODE_LABEL: "B" }),
		node({ NODE_ID: "pause", NODE_LABEL: "Pause" }),
		node({ NODE_ID: "c", NODE_LABEL: "", STATUS: "FAILED" }),
		node({ NODE_ID: "agent", NODE_LABEL: "Agent" }),
	];

	it("lists the iteration's body nodes the server accepts, in the order they ran", () => {
		expect(
			loopBodyReprocessableNodes(
				{ DEFINITION_SNAPSHOT: snapshot },
				"loop",
				iteration,
			),
		).toEqual([
			{ id: "b", label: "B", status: "SUCCESS" },
			{ id: "c", label: "c", status: "FAILED" },
		]);
	});

	it("leaves out nodes that did not run in that iteration", () => {
		const partial = [
			node({ NODE_ID: "b", STATUS: "SUCCESS" }),
			node({ NODE_ID: "c", STATUS: "SKIPPED" }),
		];

		expect(
			loopBodyReprocessableNodes(
				{ DEFINITION_SNAPSHOT: snapshot },
				"loop",
				partial,
			).map((entry) => entry.id),
		).toEqual(["b"]);
	});

	it("names the body node IDs the server accepts for one loop", () => {
		expect(
			[
				...loopBodyReprocessableIds(
					{ DEFINITION_SNAPSHOT: snapshot },
					"loop",
				),
			].sort(),
		).toEqual(["b", "c"]);
		expect(
			loopBodyReprocessableIds({ DEFINITION_SNAPSHOT: snapshot }, "nope")
				.size,
		).toBe(0);
	});

	it("only counts nodes that ran as ones the server can re-run", () => {
		expect(ranInIteration("SUCCESS")).toBe(true);
		expect(ranInIteration("FAILED")).toBe(true);
		for (const status of ["PENDING", "SKIPPED", "RUNNING"] as const) {
			expect(ranInIteration(status)).toBe(false);
		}
	});

	it("is empty when the loop, or the recorded graph, cannot be read", () => {
		expect(
			loopBodyReprocessableNodes(
				{ DEFINITION_SNAPSHOT: snapshot },
				"missing",
				iteration,
			),
		).toEqual([]);
		expect(
			loopBodyReprocessableNodes(
				{ DEFINITION_SNAPSHOT: "not json" },
				"loop",
				iteration,
			),
		).toEqual([]);
		expect(loopBodyReprocessableNodes({}, "loop", iteration)).toEqual([]);
	});
});

describe("sortRunsNewestFirst", () => {
	it("orders runs from the most recent start to the oldest", () => {
		const run = (id: string, startedAt: string) =>
			({ RUN_ID: id, STARTED_AT: startedAt }) as never;
		const sorted = sortRunsNewestFirst([
			run("a", "2026-11-10 09:00:00"),
			run("c", "2026-11-12 09:00:00"),
			run("b", "2026-11-11 09:00:00"),
		]);
		expect(sorted.map((r) => r.RUN_ID)).toEqual(["c", "b", "a"]);
	});
});

describe("nodeTimeLabel", () => {
	it("shows a recorded time as a readable date", () => {
		const label = nodeTimeLabel("2026-11-11T09:00:05Z");

		expect(label).not.toBe("—");
		expect(label).toContain("2026");
	});

	it("keeps the date and time of a bare server time", () => {
		expect(nodeTimeLabel("2026-11-11 09:00:05.123456")).toContain("2026");
	});

	it("shows a dash for a node that has not started or finished", () => {
		expect(nodeTimeLabel(null)).toBe("—");
		expect(nodeTimeLabel(undefined)).toBe("—");
		expect(nodeTimeLabel("")).toBe("—");
	});
});

describe("startedAtMatches", () => {
	// Built from local time so the checks hold in any timezone.
	const at = (date: string, time: string) =>
		new Date(`${date}T${time}`).toISOString();
	const none = { dateFrom: "", dateTo: "", timeFrom: "", timeTo: "" };

	it("matches everything when nothing is set", () => {
		expect(startedAtMatches(at("2026-11-05", "09:30:00"), none)).toBe(true);
	});

	it("treats a date range as whole days, with no time picked for you", () => {
		const filters = {
			...none,
			dateFrom: "2026-11-05",
			dateTo: "2026-11-06",
		};

		expect(startedAtMatches(at("2026-11-04", "23:59:59"), filters)).toBe(
			false,
		);
		expect(startedAtMatches(at("2026-11-05", "00:00:00"), filters)).toBe(
			true,
		);
		expect(startedAtMatches(at("2026-11-06", "23:59:59"), filters)).toBe(
			true,
		);
		expect(startedAtMatches(at("2026-11-07", "00:00:00"), filters)).toBe(
			false,
		);
	});

	it("filters by time of day on any date, independently of the dates", () => {
		const filters = { ...none, timeFrom: "09:00", timeTo: "10:30" };

		expect(startedAtMatches(at("2026-01-02", "09:00:00"), filters)).toBe(
			true,
		);
		expect(startedAtMatches(at("2026-08-09", "10:30:45"), filters)).toBe(
			true,
		);
		expect(startedAtMatches(at("2026-08-09", "10:31:00"), filters)).toBe(
			false,
		);
		expect(startedAtMatches(at("2026-08-09", "08:59:59"), filters)).toBe(
			false,
		);
	});

	it("takes either end of the time window on its own", () => {
		expect(
			startedAtMatches(at("2026-11-05", "13:00:00"), {
				...none,
				timeFrom: "12:00",
			}),
		).toBe(true);
		expect(
			startedAtMatches(at("2026-11-05", "11:00:00"), {
				...none,
				timeFrom: "12:00",
			}),
		).toBe(false);
		expect(
			startedAtMatches(at("2026-11-05", "11:00:00"), {
				...none,
				timeTo: "12:00",
			}),
		).toBe(true);
	});

	it("lets a time window run past midnight", () => {
		const overnight = { ...none, timeFrom: "22:00", timeTo: "02:00" };

		expect(startedAtMatches(at("2026-11-05", "23:30:00"), overnight)).toBe(
			true,
		);
		expect(startedAtMatches(at("2026-11-06", "01:15:00"), overnight)).toBe(
			true,
		);
		expect(startedAtMatches(at("2026-11-06", "12:00:00"), overnight)).toBe(
			false,
		);
	});

	it("combines a date range with a time window", () => {
		const filters = {
			dateFrom: "2026-11-05",
			dateTo: "2026-11-05",
			timeFrom: "09:00",
			timeTo: "10:00",
		};

		expect(startedAtMatches(at("2026-11-05", "09:30:00"), filters)).toBe(
			true,
		);
		expect(startedAtMatches(at("2026-11-06", "09:30:00"), filters)).toBe(
			false,
		);
		expect(startedAtMatches(at("2026-11-05", "11:00:00"), filters)).toBe(
			false,
		);
	});
});

describe("nodeErrorText", () => {
	it("gives the reason a node failed", () => {
		expect(
			nodeErrorText(
				node({
					STATUS: "FAILED",
					ERROR_MESSAGE: "  KeyError: 'region'\n  at line 4  ",
				}),
			),
		).toBe("KeyError: 'region'\n  at line 4");
	});

	it("says so when a failed node kept no reason", () => {
		expect(nodeErrorText(node({ STATUS: "FAILED" }))).toMatch(
			/no error message was retained/i,
		);
		expect(
			nodeErrorText(node({ STATUS: "FAILED", ERROR_MESSAGE: "   " })),
		).toMatch(/no error message was retained/i);
	});

	it("shows a message that a node that did not fail recorded, and nothing otherwise", () => {
		expect(
			nodeErrorText(
				node({
					STATUS: "SKIPPED",
					ERROR_MESSAGE: "Skipped: the agent run did not complete",
				}),
			),
		).toBe("Skipped: the agent run did not complete");
		expect(nodeErrorText(node({ STATUS: "SUCCESS" }))).toBeNull();
	});
});

describe("defaultDetailTab", () => {
	it("opens a failed node on its error and a succeeded one on its success message", () => {
		expect(defaultDetailTab(node({ STATUS: "FAILED" }))).toBe("error");
		expect(defaultDetailTab(node({ STATUS: "SUCCESS" }))).toBe("success");
		expect(defaultDetailTab(node({ STATUS: "PENDING" }))).toBe("variables");
	});
});

describe("nodeSuccessText", () => {
	it("confirms success and appends the recorded result, only for succeeded nodes", () => {
		const base = { NODE_ID: "n1", NODE_LABEL: "Download file" };
		expect(nodeSuccessText({ ...base, STATUS: "SUCCESS" } as never)).toBe(
			"Download file completed successfully.",
		);
		expect(
			nodeSuccessText({
				...base,
				STATUS: "SUCCESS",
				OUTPUT_PREVIEW: "42 rows",
			} as never),
		).toBe("Download file completed successfully.\n\n42 rows");
		expect(
			nodeSuccessText({ ...base, STATUS: "FAILED" } as never),
		).toBeNull();
	});
});

describe("summarizeRuns", () => {
	it("counts runs by outcome and computes the success rate over finished runs", () => {
		const summary = summarizeRuns([
			run({ RUN_ID: "a", STATUS: "SUCCESS" }),
			run({ RUN_ID: "b", STATUS: "SUCCESS" }),
			run({ RUN_ID: "c", STATUS: "SUCCESS" }),
			run({ RUN_ID: "d", STATUS: "FAILED" }),
			run({ RUN_ID: "e", STATUS: "RUNNING" }),
			run({ RUN_ID: "f", STATUS: "WAITING_FOR_INPUT" }),
			run({ RUN_ID: "g", STATUS: "CANCELLED" }),
			run({ RUN_ID: "h", STATUS: "INTERRUPTED" }),
		]);

		expect(summary).toEqual({
			total: 8,
			succeeded: 3,
			failed: 1,
			inProgress: 2,
			stopped: 2,
			// 3 of the 6 runs that have finished.
			successRate: 50,
		});
	});

	it("has no success rate until a run has finished", () => {
		expect(summarizeRuns([])).toMatchObject({
			total: 0,
			successRate: null,
		});
		expect(
			summarizeRuns([run({ STATUS: "RUNNING" })]).successRate,
		).toBeNull();
	});

	it("rounds the success rate to a whole percent", () => {
		const summary = summarizeRuns([
			run({ RUN_ID: "a", STATUS: "SUCCESS" }),
			run({ RUN_ID: "b", STATUS: "SUCCESS" }),
			run({ RUN_ID: "c", STATUS: "FAILED" }),
		]);

		expect(summary.successRate).toBe(67);
	});
});

describe("iterationNodeResults", () => {
	const withLoop = detail("run-1", [
		node({
			NODE_ID: "loop",
			iterations: [
				{ index: 0, nodeResults: [node({ NODE_ID: "b" })] },
				{ index: 1, nodeResults: [node({ NODE_ID: "b2" })] },
			],
		}),
	]);

	it("returns the nodes one pass of the loop ran", () => {
		expect(
			iterationNodeResults(withLoop, {
				loopNodeId: "loop",
				iteration: 1,
			}).map((result) => result.NODE_ID),
		).toEqual(["b2"]);
	});

	it("is empty for a pass or loop the run does not have", () => {
		expect(
			iterationNodeResults(withLoop, {
				loopNodeId: "loop",
				iteration: 9,
			}),
		).toEqual([]);
		expect(
			iterationNodeResults(withLoop, { loopNodeId: "x", iteration: 0 }),
		).toEqual([]);
	});
});

describe("buildDashboardRows", () => {
	it("shows only the loop passes whose variables match a variable search", () => {
		const pass = (index: number, batch: string) => ({
			index,
			nodeResults: [
				node({
					NODE_ID: `inner-${index}`,
					scopeSnapshot: JSON.stringify({
						loop_a: {
							index,
							number: index + 1,
							isFirst: index === 0,
							batch,
						},
					}),
				}),
			],
		});
		const looped = detail("run-1", [
			node({
				NODE_ID: "loop-a",
				iterations: [pass(0, "AAA"), pass(1, "BBB"), pass(2, "CCC")],
			}),
		]);
		const buildRows = (
			variableConditions: { id: string; name: string; value: string }[],
		) =>
			buildDashboardRows({
				runs: [run({ RUN_ID: "run-1" })],
				expandedRunIds: new Set(),
				runDetails: new Map([["run-1", looped]]),
				loadingRunIds: new Set(),
				runErrors: new Map(),
				variableConditions,
			}).flatMap((row) => (row.kind === "run" ? [row.iteration] : []));

		expect(buildRows([])).toHaveLength(3);
		expect(buildRows([{ id: "c", name: "", value: "bbb" }])).toEqual([2]);
		expect(
			buildRows([
				{ id: "c", name: "$" + "{loop_a.batch}", value: "zzz" },
			]),
		).toEqual([]);
	});

	it("returns one collapsed run row per run when nothing is expanded", () => {
		const rows = buildDashboardRows({
			runs: [run({ RUN_ID: "run-1" }), run({ RUN_ID: "run-2" })],
			expandedRunIds: new Set(),
			runDetails: new Map(),
			loadingRunIds: new Set(),
			runErrors: new Map(),
		});
		expect(rows).toHaveLength(2);
		expect(rows.map((row) => row.kind)).toEqual(["run", "run"]);
	});

	it("tells a reprocess run which run it came from, by that run's displayed number", () => {
		const rows = buildDashboardRows({
			runs: [
				run({ RUN_ID: "original", STARTED_AT: "2026-11-05T00:00:00Z" }),
				run({
					RUN_ID: "copy",
					STARTED_AT: "2026-11-06T00:00:00Z",
					REPROCESSED_FROM_RUN_ID: "original",
				}),
				run({
					RUN_ID: "orphan",
					STARTED_AT: "2026-11-07T00:00:00Z",
					REPROCESSED_FROM_RUN_ID: "gone",
				}),
			],
			expandedRunIds: new Set(),
			runDetails: new Map(),
			loadingRunIds: new Set(),
			runErrors: new Map(),
		});

		expect(
			rows.map((row) =>
				row.kind === "run" ? row.reprocessedFromRunNumber : "node",
			),
		).toEqual([null, 1, null]);
	});

	it("shows the run's own start and end for a run without a loop", () => {
		const rows = buildDashboardRows({
			runs: [run({ RUN_ID: "run-1" })],
			expandedRunIds: new Set(),
			runDetails: new Map(),
			loadingRunIds: new Set(),
			runErrors: new Map(),
		});

		expect(rows[0]).toMatchObject({
			startedAt: "2026-11-05T00:00:00Z",
			completedAt: "2026-11-05T00:00:10Z",
		});
	});

	it("does not add node rows for an expanded run whose detail hasn't loaded yet", () => {
		const rows = buildDashboardRows({
			runs: [run({ RUN_ID: "run-1" })],
			expandedRunIds: new Set(["run-1"]),
			runDetails: new Map(),
			loadingRunIds: new Set(["run-1"]),
			runErrors: new Map(),
		});
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ kind: "run", loading: true });
	});

	it("adds one node row per node once the run is expanded with loaded detail", () => {
		const rows = buildDashboardRows({
			runs: [run({ RUN_ID: "run-1" })],
			expandedRunIds: new Set(["run-1"]),
			runDetails: new Map([
				[
					"run-1",
					detail("run-1", [
						node({ NODE_ID: "a" }),
						node({ NODE_ID: "b" }),
					]),
				],
			]),
			loadingRunIds: new Set(),
			runErrors: new Map(),
		});
		expect(rows.map((row) => row.kind)).toEqual(["run", "node", "node"]);
		expect(rows[0]).toMatchObject({ iteration: null, status: "SUCCESS" });
	});

	describe("loops", () => {
		function loopRun(iterationCount: number) {
			return detail("run-1", [
				node({ NODE_ID: "pull", NODE_LABEL: "Pull Data" }),
				node({
					NODE_ID: "loop",
					NODE_LABEL: "Loop",
					iterations: Array.from(
						{ length: iterationCount },
						(_, index) => ({
							index,
							nodeResults: [
								node({
									NODE_ID: `a-${index}`,
									NODE_LABEL: "A",
								}),
								node({
									NODE_ID: `b-${index}`,
									NODE_LABEL: "B",
								}),
							],
						}),
					),
				}),
				node({ NODE_ID: "send", NODE_LABEL: "Send Report" }),
			]);
		}

		function build(
			iterationCount: number,
			expandedRunIds: string[] = [],
			iterationQuery?: number | null,
		) {
			return buildDashboardRows({
				runs: [run({ RUN_ID: "run-1" })],
				expandedRunIds: new Set(expandedRunIds),
				runDetails: new Map([["run-1", loopRun(iterationCount)]]),
				loadingRunIds: new Set(),
				runErrors: new Map(),
				iterationQuery,
			});
		}

		it("shows each iteration as its own run, numbered under the original, and never the loop node", () => {
			const rows = build(3);

			expect(
				rows.map((row) =>
					row.kind === "run"
						? [row.runNumber, row.iteration]
						: "node",
				),
			).toEqual([
				[1, 3],
				[1, 2],
				[1, 1],
			]);
		});

		it("makes 5000 runs out of a loop that repeats 5000 times", () => {
			const runRows = build(5000).filter((row) => row.kind === "run");

			expect(runRows).toHaveLength(5000);
			expect(runRows[0]).toMatchObject({ iteration: 5000 });
		});

		it("gives each iteration run everything up to and including that iteration", () => {
			const rows = build(3, [
				displayRunKey("run-1", 2),
				displayRunKey("run-1", 3),
			]);

			const labelsUnder = (iteration: number) => {
				const start = rows.findIndex(
					(row) => row.kind === "run" && row.iteration === iteration,
				);
				const labels: string[] = [];
				for (const row of rows.slice(start + 1)) {
					if (row.kind !== "node") break;
					labels.push(row.node.NODE_LABEL);
				}
				return labels;
			};
			expect(labelsUnder(2)).toEqual(["Pull Data", "A", "B"]);
			// The nodes after the loop ran after the last iteration, so they belong with it.
			expect(labelsUnder(3)).toEqual([
				"Pull Data",
				"A",
				"B",
				"Send Report",
			]);
		});

		it("expands only the iteration run that was opened", () => {
			const rows = build(3, [displayRunKey("run-1", 2)]);

			expect(rows.filter((row) => row.kind === "node")).toHaveLength(3);
			expect(
				rows.find((row) => row.kind === "run" && row.expanded),
			).toMatchObject({ iteration: 2 });
		});

		it("reports each iteration's own outcome and the original run's outcome on the last", () => {
			const failing = loopRun(3);
			failing.nodeResults[1].iterations?.[1].nodeResults.push(
				node({ NODE_ID: "boom", STATUS: "FAILED" }),
			);
			const rows = buildDashboardRows({
				runs: [run({ RUN_ID: "run-1", STATUS: "CANCELLED" })],
				expandedRunIds: new Set(),
				runDetails: new Map([["run-1", failing]]),
				loadingRunIds: new Set(),
				runErrors: new Map(),
			});

			expect(
				rows.map((row) => (row.kind === "run" ? row.status : "")),
			).toEqual(["CANCELLED", "FAILED", "SUCCESS"]);
		});

		it("narrows to one iteration when the search names it, like 1.2", () => {
			const rows = build(3, [], 2);

			expect(rows).toHaveLength(1);
			expect(rows[0]).toMatchObject({ iteration: 2 });
		});

		it("names the loop and its zero-based pass on each iteration run and on the nodes inside it", () => {
			const rows = build(3, [
				displayRunKey("run-1", 2),
				displayRunKey("run-1", 3),
			]);

			const runRows = rows.filter((row) => row.kind === "run");
			expect(runRows.map((row) => row.loop)).toEqual([
				{ loopNodeId: "loop", iteration: 2 },
				{ loopNodeId: "loop", iteration: 1 },
				{ loopNodeId: "loop", iteration: 0 },
			]);
			// Nodes from before or after the loop belong to no iteration of it.
			expect(
				rows
					.filter((row) => row.kind === "node")
					.map((row) => [row.node.NODE_LABEL, row.loop]),
			).toEqual([
				["Pull Data", null],
				["A", { loopNodeId: "loop", iteration: 2 }],
				["B", { loopNodeId: "loop", iteration: 2 }],
				["Send Report", null],
				["Pull Data", null],
				["A", { loopNodeId: "loop", iteration: 1 }],
				["B", { loopNodeId: "loop", iteration: 1 }],
			]);
		});

		it("counts a second loop's passes from zero again, though its run numbers carry on", () => {
			const twoLoops = detail("run-1", [
				node({
					NODE_ID: "first",
					iterations: [
						{ index: 0, nodeResults: [node({ NODE_ID: "f0" })] },
					],
				}),
				node({
					NODE_ID: "second",
					iterations: [
						{ index: 0, nodeResults: [node({ NODE_ID: "s0" })] },
						{ index: 1, nodeResults: [node({ NODE_ID: "s1" })] },
					],
				}),
			]);
			const rows = buildDashboardRows({
				runs: [run({ RUN_ID: "run-1" })],
				expandedRunIds: new Set(),
				runDetails: new Map([["run-1", twoLoops]]),
				loadingRunIds: new Set(),
				runErrors: new Map(),
			});

			expect(
				rows.map((row) => (row.kind === "run" ? row.loop : null)),
			).toEqual([
				{ loopNodeId: "second", iteration: 1 },
				{ loopNodeId: "second", iteration: 0 },
				{ loopNodeId: "first", iteration: 0 },
			]);
		});

		it("gives a run without a loop no loop", () => {
			const rows = buildDashboardRows({
				runs: [run({ RUN_ID: "run-1" })],
				expandedRunIds: new Set(["run-1"]),
				runDetails: new Map([
					["run-1", detail("run-1", [node({ NODE_ID: "a" })])],
				]),
				loadingRunIds: new Set(),
				runErrors: new Map(),
			});

			expect(rows.map((row) => row.loop)).toEqual([null, null]);
		});

		it("gives each iteration its own start and end: earliest node start, latest node end", () => {
			const timed = loopRun(3);
			const [, loop] = timed.nodeResults;
			loop.iterations?.forEach((iteration, index) => {
				iteration.nodeResults[0].STARTED_AT = `2026-11-11 09:0${index}:00`;
				iteration.nodeResults[0].COMPLETED_AT = `2026-11-11 09:0${index}:03`;
				iteration.nodeResults[1].STARTED_AT = `2026-11-11 09:0${index}:03`;
				iteration.nodeResults[1].COMPLETED_AT = `2026-11-11 09:0${index}:07`;
			});
			timed.nodeResults[2].STARTED_AT = "2026-11-11 09:02:07";
			timed.nodeResults[2].COMPLETED_AT = "2026-11-11 09:02:09";
			const rows = buildDashboardRows({
				runs: [run({ RUN_ID: "run-1" })],
				expandedRunIds: new Set(),
				runDetails: new Map([["run-1", timed]]),
				loadingRunIds: new Set(),
				runErrors: new Map(),
			});

			expect(
				rows.map((row) =>
					row.kind === "run"
						? [row.startedAt, row.completedAt]
						: null,
				),
			).toEqual([
				// The nodes after the loop belong to the last iteration, so its end covers them.
				["2026-11-11 09:02:00", "2026-11-11 09:02:09"],
				["2026-11-11 09:01:00", "2026-11-11 09:01:07"],
				["2026-11-11 09:00:00", "2026-11-11 09:00:07"],
			]);
		});

		it("falls back to the run's own times when no node recorded any", () => {
			const rows = build(2);

			expect(rows[0]).toMatchObject({
				startedAt: "2026-11-05T00:00:00Z",
				completedAt: "2026-11-05T00:00:10Z",
			});
		});

		it("shows only the iteration a reprocess ran again, not the loop passes it carried over", () => {
			const reprocessed = loopRun(5);
			const [, loop] = reprocessed.nodeResults;
			loop.iterations?.forEach((iteration, index) => {
				if (index === 2) return;
				for (const inner of iteration.nodeResults) {
					inner.CARRIED_OVER = true;
				}
			});
			const rows = buildDashboardRows({
				runs: [run({ RUN_ID: "run-1" })],
				expandedRunIds: new Set(),
				runDetails: new Map([["run-1", reprocessed]]),
				loadingRunIds: new Set(),
				runErrors: new Map(),
			});

			expect(rows).toHaveLength(1);
			expect(rows[0]).toMatchObject({
				iteration: 1,
				// It still names the pass it re-ran, so it can be reprocessed again.
				loop: { loopNodeId: "loop", iteration: 2 },
			});
		});

		it("shows a loop that was carried over whole as an ordinary node, not as runs of its own", () => {
			const carried = loopRun(3);
			for (const iteration of carried.nodeResults[1].iterations ?? []) {
				for (const inner of iteration.nodeResults) {
					inner.CARRIED_OVER = true;
				}
			}
			const rows = buildDashboardRows({
				runs: [run({ RUN_ID: "run-1" })],
				expandedRunIds: new Set(["run-1"]),
				runDetails: new Map([["run-1", carried]]),
				loadingRunIds: new Set(),
				runErrors: new Map(),
			});

			expect(rows.map((row) => row.kind)).toEqual([
				"run",
				"node",
				"node",
				"node",
			]);
		});

		it("still shows a pass that ran no nodes in an ordinary run", () => {
			const empty = detail("run-1", [
				node({
					NODE_ID: "loop",
					iterations: [
						{ index: 0, nodeResults: [] },
						{ index: 1, nodeResults: [node({ NODE_ID: "b" })] },
					],
				}),
			]);
			const rows = buildDashboardRows({
				runs: [run({ RUN_ID: "run-1" })],
				expandedRunIds: new Set(),
				runDetails: new Map([["run-1", empty]]),
				loadingRunIds: new Set(),
				runErrors: new Map(),
			});

			expect(rows).toHaveLength(2);
		});

		it("shows a loop that never ran its body as an ordinary node", () => {
			const rows = buildDashboardRows({
				runs: [run({ RUN_ID: "run-1" })],
				expandedRunIds: new Set(["run-1"]),
				runDetails: new Map([
					[
						"run-1",
						detail("run-1", [
							node({ NODE_ID: "loop", iterations: [] }),
						]),
					],
				]),
				loadingRunIds: new Set(),
				runErrors: new Map(),
			});

			expect(rows.map((row) => row.kind)).toEqual(["run", "node"]);
		});

		it("carries on numbering across two loops and includes the nodes between them", () => {
			const twoLoops = detail("run-1", [
				node({
					NODE_ID: "first",
					NODE_LABEL: "First",
					iterations: [
						{ index: 0, nodeResults: [node({ NODE_ID: "f0" })] },
					],
				}),
				node({ NODE_ID: "between", NODE_LABEL: "Between" }),
				node({
					NODE_ID: "second",
					NODE_LABEL: "Second",
					iterations: [
						{ index: 0, nodeResults: [node({ NODE_ID: "s0" })] },
						{ index: 1, nodeResults: [node({ NODE_ID: "s1" })] },
					],
				}),
			]);
			const rows = buildDashboardRows({
				runs: [run({ RUN_ID: "run-1" })],
				expandedRunIds: new Set([displayRunKey("run-1", 3)]),
				runDetails: new Map([["run-1", twoLoops]]),
				loadingRunIds: new Set(),
				runErrors: new Map(),
			});

			expect(
				rows
					.filter((row) => row.kind === "run")
					.map((row) => row.iteration),
			).toEqual([3, 2, 1]);
			expect(
				rows
					.filter((row) => row.kind === "node")
					.map((row) => row.node.NODE_ID),
			).toEqual(["between", "s1"]);
		});

		it("gives every row a unique key across runs that share node IDs", () => {
			const rows = buildDashboardRows({
				runs: [run({ RUN_ID: "run-1" }), run({ RUN_ID: "run-2" })],
				expandedRunIds: new Set([
					displayRunKey("run-1", 1),
					displayRunKey("run-2", 1),
				]),
				runDetails: new Map([
					["run-1", loopRun(2)],
					["run-2", { ...loopRun(2), RUN_ID: "run-2" }],
				]),
				loadingRunIds: new Set(),
				runErrors: new Map(),
			});

			expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
		});
	});

	it("numbers runs 1-based in ascending STARTED_AT order, independent of input order", () => {
		const rows = buildDashboardRows({
			runs: [
				run({
					RUN_ID: "run-newest",
					STARTED_AT: "2026-11-05T02:00:00Z",
				}),
				run({
					RUN_ID: "run-oldest",
					STARTED_AT: "2026-11-05T00:00:00Z",
				}),
				run({
					RUN_ID: "run-middle",
					STARTED_AT: "2026-11-05T01:00:00Z",
				}),
			],
			expandedRunIds: new Set(),
			runDetails: new Map(),
			loadingRunIds: new Set(),
			runErrors: new Map(),
		});
		const numbersById = new Map(
			rows.map((row) => [
				(row as { run: AutomationRunSummary }).run.RUN_ID,
				(row as { runNumber: number }).runNumber,
			]),
		);
		expect(numbersById.get("run-oldest")).toBe(1);
		expect(numbersById.get("run-middle")).toBe(2);
		expect(numbersById.get("run-newest")).toBe(3);
	});

	it("keeps IDs stable for a filtered subset when precomputed runNumbers are passed in", () => {
		const allRuns = [
			run({ RUN_ID: "run-oldest", STARTED_AT: "2026-11-05T00:00:00Z" }),
			run({ RUN_ID: "run-middle", STARTED_AT: "2026-11-05T01:00:00Z" }),
			run({ RUN_ID: "run-newest", STARTED_AT: "2026-11-05T02:00:00Z" }),
		];
		const runNumbers = assignRunNumbers(allRuns);

		const rows = buildDashboardRows({
			runs: [allRuns[2]],
			expandedRunIds: new Set(),
			runDetails: new Map(),
			loadingRunIds: new Set(),
			runErrors: new Map(),
			runNumbers,
		});

		expect((rows[0] as { runNumber: number }).runNumber).toBe(3);
	});

	it("surfaces a run-level load error without adding node rows", () => {
		const rows = buildDashboardRows({
			runs: [run({ RUN_ID: "run-1" })],
			expandedRunIds: new Set(["run-1"]),
			runDetails: new Map(),
			loadingRunIds: new Set(),
			runErrors: new Map([["run-1", "Unable to load run details."]]),
		});
		expect(rows).toEqual([
			expect.objectContaining({
				kind: "run",
				loadError: "Unable to load run details.",
			}),
		]);
	});
});
