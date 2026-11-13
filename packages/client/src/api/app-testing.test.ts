import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getAppTestRun,
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
		await saveAppTestRecording("edited-app", draft);
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
				startPath: "",
				steps: [],
			}),
		).rejects.toThrow("Permission denied");
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
			'META | RunAppTests(project=["app"], suite=["selected-recording"]);',
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
