import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	deleteAppTestRecording,
	deleteInvalidAppTestFile,
	getAppTestDatabase,
	getAppTestRecording,
	getAppTestRun,
	openAppTestDatabase,
	parseAppTestDiscovery,
	parseAppTestRecordings,
	parseAppTestRunHistory,
	parseAppTestRunHistoryPage,
	parseAppTestUpload,
	runAllAppTests,
	runAppTests,
	saveAppTestDatabase,
	saveAppTestRecording,
} from "./app-testing";

const transport = vi.hoisted(() => vi.fn());
vi.mock("@semoss/sdk", () => ({ Session: { insight: { run: transport } } }));
beforeEach(() => transport.mockReset());

it("validates persisted history identities/counts and excludes private evidence from parsed results", () => {
	const test = {
		id: "test",
		name: "Checkout",
		status: "FAILED",
		steps: 8,
		stepsAttempted: 6,
		stepsCompleted: 5,
		assertions: 3,
		assertionsPassed: 1,
	};
	const run = {
		runId: "run",
		target: "app",
		status: "COMPLETED",
		startedAt: "2026-11-19T12:00:00Z",
		tests: [{ ...test, evidence: { screenshot: "private-image" } }],
	};
	const result = parseAppTestRunHistory("app", "run", "test", {
		target: "app",
		run,
	});
	expect(JSON.stringify(result)).not.toContain("private-image");
	expect(result.tests[0].stepsCompleted).toBe(5);
	expect(() =>
		parseAppTestRunHistory("other-app", "run", "test", {
			target: "app",
			run,
		}),
	).toThrow();
	expect(() =>
		parseAppTestRunHistory("app", "other-run", "test", {
			target: "app",
			run,
		}),
	).toThrow();
	expect(() =>
		parseAppTestRunHistory("app", "run", "other-test", {
			target: "app",
			run,
		}),
	).toThrow();
	expect(() =>
		parseAppTestRunHistory("app", "run", "test", {
			target: "app",
			run: { ...run, tests: [{ ...test, stepsCompleted: -1 }] },
		}),
	).toThrow();
	const latest = { ...test, runId: "run", startedAt: run.startedAt };
	const page = {
		target: "app",
		runs: [{ ...run, test: latest }],
		latest: [latest],
		total: 1,
		offset: 0,
		hasMore: false,
		retainedRuns: 100,
	};
	expect(parseAppTestRunHistoryPage("app", page, "test").latest[0].id).toBe(
		"test",
	);
	expect(() =>
		parseAppTestRunHistoryPage("app", page, "other-test"),
	).toThrow();
});

describe("app recording transport", () => {
	it("sends an explicit app ID and escaped recording values", async () => {
		const draft = {
			name: 'A "quoted" workflow',
			description:
				'Click Save and check "Saved" appears.\nKeep the expected outcome.',
			startPath: "",
			steps: [
				{
					type: "ASSERT_TEXT" as const,
					selector: "#result",
					text: 'Ready "now"',
				},
			],
		};
		transport.mockResolvedValue({
			errors: [],
			pixelReturn: [
				{
					output: {
						...draft,
						id: "recording",
						version: 1,
						updatedAt: "2026-11-13T12:00:00Z",
					},
				},
			],
		});
		const result = await saveAppTestRecording("edited-app", draft);
		expect(result.description).toBe(draft.description);
		expect(transport.mock.calls[0][0]).toContain('project=["edited-app"]');
		expect(transport.mock.calls[0][0]).toContain(JSON.stringify([draft]));
	});
	it("surfaces save failures so the draft remains available for retry", async () => {
		transport.mockResolvedValue({
			errors: ["Permission denied"],
			pixelReturn: [],
		});
		await expect(
			saveAppTestRecording("app", {
				name: "Draft",
				description: "Verify that the draft can be saved.",
				startPath: "",
				steps: [],
			}),
		).rejects.toThrow("Permission denied");
	});
	it("retains descriptions when listing tests and accepts older server responses", () => {
		const recording = {
			id: "recording",
			name: "Save",
			startPath: "",
			steps: [],
			version: 1,
			updatedAt: "2026-11-17T12:00:00Z",
			description: "Check saving an entry.",
		};
		expect(
			parseAppTestRecordings("app", {
				target: "app",
				recordings: [recording],
			})[0].description,
		).toBe(recording.description);
		const { description: _description, ...legacy } = recording;
		expect(
			parseAppTestRecordings("app", {
				target: "app",
				recordings: [legacy],
			})[0].description,
		).toBe("Replays the recorded workflow: Save.");
	});
	it("never requests a mock scenario when starting a real run", async () => {
		transport.mockResolvedValue({
			errors: [],
			pixelReturn: [
				{ output: { runId: "run", target: "app", status: "RUNNING" } },
			],
		});
		await runAppTests("app", "selected-recording");
		expect(transport.mock.calls[0][0]).toBe(
			'META | RunAppTests(project=["app"], recordingIds=["selected-recording"]);',
		);
		expect(transport.mock.calls[0][0]).not.toContain("scenario");
	});
	it("rejects a run for the toolbox or another app", async () => {
		transport.mockResolvedValue({
			errors: [],
			pixelReturn: [
				{
					output: {
						runId: "run",
						target: "toolbox",
						status: "COMPLETED",
					},
				},
			],
		});
		await expect(getAppTestRun("app", "run")).rejects.toThrow(
			"target changed",
		);
	});
});

it("updates the existing test id and deletes only the requested app recording", async () => {
	const recording = {
		id: "existing-id",
		name: "Edited test",
		description: "Verify the edited workflow.",
		startPath: "",
		steps: [{ type: "ASSERT_VISIBLE" as const, selector: "#result" }],
		version: 1,
		updatedAt: "2026-11-18T12:00:00Z",
	};
	transport.mockResolvedValueOnce({
		errors: [],
		pixelReturn: [{ output: recording }],
	});
	await saveAppTestRecording("app", recording);
	expect(transport.mock.calls[0][0]).toContain(JSON.stringify([recording]));
	transport.mockResolvedValueOnce({
		errors: [],
		pixelReturn: [{ output: { deleted: true } }],
	});
	await deleteAppTestRecording("app", recording.id);
	expect(transport.mock.calls[1][0]).toBe(
		'META | DeleteAppTestRecording(project=["app"], recordingId=["existing-id"]);',
	);
});

it("returns only discovery metadata, even from an older complete list response", () => {
	const result = parseAppTestRecordings("app", {
		target: "app",
		recordings: [
			{
				id: "id",
				name: "Save",
				description: "Verify Save.",
				steps: [{ type: "FILL", value: "not needed in discovery" }],
			},
		],
	});
	expect(result).toEqual([
		{ id: "id", name: "Save", description: "Verify Save." },
	]);
});

it("reads exactly one file and rejects a response for another file or app", async () => {
	const recording = {
		id: "one",
		name: "Save",
		description: "Verify Save.",
		version: 1,
		updatedAt: "2026-11-18",
		startPath: "",
		steps: [{ type: "ASSERT_VISIBLE", selector: "#done" }],
	};
	transport.mockResolvedValueOnce({
		errors: [],
		pixelReturn: [{ output: { target: "app", recording } }],
	});
	expect(await getAppTestRecording("app", "one")).toEqual(recording);
	expect(transport.mock.calls[0][0]).toBe(
		'META | GetAppTestRecording(project=["app"], recordingId=["one"]);',
	);
	for (const output of [
		{ target: "other", recording },
		{ target: "app", recording: { ...recording, id: "two" } },
	]) {
		transport.mockResolvedValueOnce({
			errors: [],
			pixelReturn: [{ output }],
		});
		await expect(getAppTestRecording("app", "one")).rejects.toThrow(
			"changed",
		);
	}
});

it("keeps smoke checks explicit and rejects an empty UI selection", async () => {
	transport.mockResolvedValueOnce({
		errors: [],
		pixelReturn: [
			{ output: { target: "app", runId: "run", status: "RUNNING" } },
		],
	});
	await runAppTests("app", "__platform_smoke__");
	expect(transport.mock.calls[0][0]).toBe(
		'META | RunAppTests(project=["app"], suite=["__platform_smoke__"]);',
	);
	transport.mockClear();
	await expect(runAppTests("app", "")).rejects.toThrow("Choose a test");
	expect(transport).not.toHaveBeenCalled();
});

it("imports a described JSON definition as a new draft without its source identity", () => {
	const input = {
		id: "source-id",
		version: 1,
		updatedAt: "2026-11-18",
		name: "Imported",
		description: "Verify imported behavior.",
		steps: [{ type: "ASSERT_VISIBLE", selector: "#result" }],
	};
	const draft = parseAppTestUpload(JSON.stringify(input));
	expect(draft).toEqual({
		name: input.name,
		description: input.description,
		startPath: "",
		steps: input.steps,
	});
	for (const value of [
		"not JSON",
		JSON.stringify({ ...input, description: "" }),
		JSON.stringify({ ...input, engineTestConfigurationId: "experimental" }),
		JSON.stringify({ ...input, version: 2 }),
	])
		expect(() => parseAppTestUpload(value)).toThrow();
});

it("runs all tests only by sending explicit all=true for the current app", async () => {
	transport.mockResolvedValueOnce({
		errors: [],
		pixelReturn: [
			{ output: { runId: "run", target: "app", status: "RUNNING" } },
		],
	});
	await runAllAppTests("app");
	expect(transport.mock.calls[0][0]).toBe(
		'META | RunAppTests(project=["app"], all=[true]);',
	);
});

it("keeps valid metadata discoverable alongside invalid files and validates deletion scope", async () => {
	const discovery = parseAppTestDiscovery("app", {
		target: "app",
		recordings: [
			{ id: "valid", name: "Good", description: "Check good behavior" },
		],
		invalid: [
			{
				file: "broken.json",
				code: "INVALID_DEFINITION",
				reason: "Invalid UUID",
			},
		],
	});
	expect(discovery.recordings).toHaveLength(1);
	expect(discovery.invalid[0].file).toBe("broken.json");
	expect(() =>
		parseAppTestDiscovery("app", {
			target: "app",
			recordings: [],
			invalid: [
				{
					file: "../outside.json",
					code: "INVALID_DEFINITION",
					reason: "Bad",
				},
			],
		}),
	).toThrow();
	await expect(
		deleteInvalidAppTestFile("app", "../outside.json"),
	).rejects.toThrow();
	expect(transport).not.toHaveBeenCalled();
	transport.mockResolvedValueOnce({
		errors: [],
		pixelReturn: [{ output: { deleted: true } }],
	});
	await deleteInvalidAppTestFile("app", "broken.json");
	expect(transport.mock.calls[0][0]).toContain('fileName=["broken.json"]');
});

it("preserves actionable live diagnostics without copying screenshot evidence", async () => {
	transport.mockResolvedValueOnce({
		errors: [],
		pixelReturn: [
			{
				output: {
					target: "app",
					runId: "run",
					status: "COMPLETED",
					tests: [
						{
							name: "Task",
							status: "FAILED",
							classification: "AMBIGUOUS_SELECTOR",
							failedStep: 2,
							expected: "one task",
							actual: "10 elements matched",
							availableTestIds: ["task-t1"],
							stepsCompleted: 1,
							stepsAttempted: 2,
							evidence: { screenshot: "private-image" },
						},
					],
				},
			},
		],
	});
	const result = await getAppTestRun("app", "run");
	expect(result.tests?.[0]).toMatchObject({
		failedStep: 2,
		actual: "10 elements matched",
		availableTestIds: ["task-t1"],
	});
	expect(JSON.stringify(result)).not.toContain("private-image");
});

it("saves fixture settings with the explicit app and preserves isolated replay mode", async () => {
	const configuration = {
		enabled: true,
		sourceEngineId: "source",
		schemaSql: "CREATE TABLE TASKS (ID INTEGER);",
		seedSql: "",
	};
	transport.mockResolvedValueOnce({
		errors: [],
		pixelReturn: [{ output: { target: "app", configuration } }],
	});
	await expect(saveAppTestDatabase("app", configuration)).resolves.toEqual(
		configuration,
	);
	expect(transport.mock.calls[0][0]).toContain(
		'ManageAppTestDatabase(project=["app"], action=["save"]',
	);
	transport.mockResolvedValueOnce({
		errors: [],
		pixelReturn: [
			{
				output: {
					target: "app",
					runId: "run",
					status: "QUEUED",
					mode: "ISOLATED_H2",
				},
			},
		],
	});
	await expect(runAppTests("app", "test")).resolves.toMatchObject({
		mode: "ISOLATED_H2",
	});
});

it("rejects cross-app configuration and forged or mismatched preview addresses", async () => {
	transport.mockResolvedValueOnce({
		errors: [],
		pixelReturn: [
			{ output: { target: "other", configuration: { enabled: false } } },
		],
	});
	await expect(getAppTestDatabase("app")).rejects.toThrow();
	transport.mockResolvedValueOnce({
		errors: [],
		pixelReturn: [
			{
				output: {
					target: "app",
					environmentId: "10000000-0000-4000-8000-000000000001",
					expiresAt: "2026-11-23T12:30:00Z",
					mode: "ISOLATED_H2",
					previewPath: "https://other.example/",
				},
			},
		],
	});
	await expect(openAppTestDatabase("app")).rejects.toThrow(
		"Invalid test preview address",
	);
});

it("passes browser presentation settings to selected and whole-app runs", async () => {
	transport.mockResolvedValue({
		errors: [],
		pixelReturn: [
			{
				output: {
					runId: "run",
					target: "app",
					status: "RUNNING",
					headless: false,
					keepOpen: true,
				},
			},
		],
	});
	await runAppTests("app", "selected-recording", 1, {
		headless: false,
		keepOpen: true,
	});
	expect(transport.mock.calls[0][0]).toBe(
		'META | RunAppTests(project=["app"], recordingIds=["selected-recording"], headless=[false], keepOpen=[true]);',
	);
	await runAllAppTests("app", { headless: false, keepOpen: false });
	expect(transport.mock.calls[1][0]).toBe(
		'META | RunAppTests(project=["app"], all=[true], headless=[false], keepOpen=[false]);',
	);
	transport.mockResolvedValue({
		errors: [],
		pixelReturn: [
			{
				output: {
					runId: "run",
					target: "app",
					status: "COMPLETED",
					browserOpen: true,
					browserClosesAt: "2026-11-25T12:00:00Z",
				},
			},
		],
	});
	expect(await getAppTestRun("app", "run")).toMatchObject({
		status: "COMPLETED",
		browserOpen: true,
	});
});
