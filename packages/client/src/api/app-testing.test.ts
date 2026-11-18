import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	deleteAppTestRecording,
	getAppTestRecording,
	getAppTestRun,
	parseAppTestRecordings,
	runAppTests,
	saveAppTestRecording,
} from "./app-testing";

const transport = vi.hoisted(() => vi.fn());
vi.mock("@semoss/sdk", () => ({ Session: { insight: { run: transport } } }));
beforeEach(() => transport.mockReset());

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
