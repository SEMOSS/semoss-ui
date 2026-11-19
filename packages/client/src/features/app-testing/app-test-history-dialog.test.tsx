import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AppTestHistoryDialog } from "./app-test-history-dialog";

const list = vi.hoisted(() => ({
	status: "SUCCESS",
	data: null as unknown,
	error: undefined,
	refresh: vi.fn(),
}));
const detail = vi.hoisted(() => ({
	status: "SUCCESS",
	data: null as unknown,
	error: undefined as { message: string } | undefined,
	refresh: vi.fn(),
}));
const pixel = vi.hoisted(() =>
	vi.fn((statement: string) =>
		statement.includes("ListAppTestRuns") ? list : detail,
	),
);
vi.mock("@semoss/sdk/react", () => ({ useSessionPixel: pixel }));
const test = {
	id: "test",
	name: "Original name",
	status: "FAILED",
	steps: 8,
	stepsAttempted: 6,
	stepsCompleted: 5,
	assertions: 3,
	assertionsPassed: 1,
	runId: "run-one",
	startedAt: "2026-11-19T12:00:00Z",
};
const props = {
	appId: "app",
	recording: {
		id: "test",
		name: "Renamed workflow",
		description: "Verify checkout.",
	},
	onClose: vi.fn(),
	onReturnFocus: vi.fn(),
};
beforeEach(() => {
	vi.clearAllMocks();
	list.status = "SUCCESS";
	detail.status = "SUCCESS";
	detail.error = undefined;
	list.data = {
		target: "app",
		runs: [
			{
				runId: "run-one",
				status: "COMPLETED",
				startedAt: test.startedAt,
				test,
			},
		],
		latest: [test],
		total: 21,
		offset: 0,
		hasMore: true,
		retainedRuns: 100,
	};
	detail.data = {
		target: "app",
		run: {
			runId: "run-one",
			target: "app",
			status: "COMPLETED",
			startedAt: test.startedAt,
			tests: [
				{
					...test,
					failedStep: 6,
					classification: "REGRESSION_SUSPECTED",
					reason: "The expected check did not match.",
					definitionHash: "executed-definition-hash",
					durationMs: 5200,
				},
			],
		},
	};
});
afterEach(cleanup);

it("loads just the selected result, shows executed counts and preserves history across a rename", async () => {
	render(<AppTestHistoryDialog {...props} />);
	expect(
		screen.getByRole("dialog", { name: "Run history: Renamed workflow" }),
	).toBeTruthy();
	expect(screen.getByText("5/8")).toBeTruthy();
	expect(
		pixel.mock.calls.some((call) =>
			call[0].includes("GetAppTestRunHistory"),
		),
	).toBe(false);
	fireEvent.click(
		screen.getByRole("button", { name: "View result run-one" }),
	);
	await screen.findByText("The expected check did not match.");
	expect(pixel).toHaveBeenCalledWith(
		'META | GetAppTestRunHistory(project=["app"], runId=["run-one"], recordingId=["test"]);',
	);
	expect(screen.getByText("Original name: FAILED")).toBeTruthy();
	expect(screen.getByText("6/8")).toBeTruthy();
	expect(screen.getByText(/executed-definition-hash/)).toBeTruthy();
	fireEvent.click(screen.getByRole("button", { name: "Next runs" }));
	expect(
		pixel.mock.calls.some((call) => call[0].includes("offset=[20]")),
	).toBe(true);
	fireEvent.click(screen.getByRole("button", { name: "Close history" }));
	expect(props.onClose).toHaveBeenCalledOnce();
});

it("keeps detail reads recoverable and never displays another test's result", async () => {
	detail.status = "ERROR";
	detail.error = { message: "History read failed" };
	const view = render(<AppTestHistoryDialog {...props} />);
	fireEvent.click(
		screen.getByRole("button", { name: "View result run-one" }),
	);
	await screen.findByText("History read failed");
	fireEvent.click(
		screen.getByRole("button", { name: "Retry reading result" }),
	);
	expect(detail.refresh).toHaveBeenCalledOnce();
	detail.status = "SUCCESS";
	detail.error = undefined;
	detail.data = {
		target: "app",
		run: {
			runId: "run-one",
			target: "app",
			status: "COMPLETED",
			startedAt: test.startedAt,
			tests: [{ ...test, id: "other-test", name: "Should not display" }],
		},
	};
	view.rerender(<AppTestHistoryDialog {...props} />);
	await waitFor(() =>
		expect(
			screen.getByText("This test run result could not be read."),
		).toBeTruthy(),
	);
	expect(screen.queryByText(/Should not display/)).toBeNull();
});
