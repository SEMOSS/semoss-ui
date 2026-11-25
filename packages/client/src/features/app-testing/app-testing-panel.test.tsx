import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppTestRecordingSummary } from "./app-test.types";
import { AppTestingPanel } from "./app-testing-panel";

const state = vi.hoisted(() => ({
	steps: [
		{ type: "ASSERT_VISIBLE" as const, selector: '[data-testid="result"]' },
	],
	weakSteps: 0,
	isRecording: false,
	isPickingCheck: false,
	isSaving: false,
	isRunning: false,
	isAccessible: true,
	selectedId: "__platform_smoke__",
	setSelectedId: vi.fn(),
	run: null,
	notice: "",
	error: "",
	recordings: [] as AppTestRecordingSummary[],
	updateRecording: vi.fn(),
	deleteRecording: vi.fn(),
	isLoading: false,
	refreshRecordings: vi.fn(),
	startRecording: vi.fn(),
	stopRecording: vi.fn(),
	addCheck: vi.fn(),
	save: vi.fn(),
	startRun: vi.fn(),
	runAll: vi.fn(),
	uploadTest: vi.fn(),
	refreshRun: vi.fn(),
	discard: vi.fn(),
}));
vi.mock("./use-app-testing", () => ({ useAppTesting: () => state }));
vi.mock("./use-app-test-history", () => ({
	useAppTestHistory: () => ({
		page: null,
		isLoading: false,
		error: "",
		refresh: vi.fn(),
	}),
}));
vi.mock("./app-frame-registry", () => ({ useAppFrame: () => null }));

beforeEach(() => state.save.mockReset().mockResolvedValue(undefined));
afterEach(cleanup);

describe("recording descriptions", () => {
	it("requires a description before saving a recorded workflow", async () => {
		render(<AppTestingPanel appId="app" />);
		fireEvent.change(
			screen.getByRole("textbox", { name: "Recording name" }),
			{
				target: { value: "Save entry" },
			},
		);
		fireEvent.click(screen.getByRole("button", { name: "Save recording" }));
		await screen.findByText("Describe the workflow and expected outcome");
		expect(state.save).not.toHaveBeenCalled();
		fireEvent.change(
			screen.getByRole("textbox", {
				name: "Test description (required)",
			}),
			{
				target: {
					value: "  Click Save and verify the entry appears.  ",
				},
			},
		);
		fireEvent.click(screen.getByRole("button", { name: "Save recording" }));
		await waitFor(() =>
			expect(state.save).toHaveBeenCalledWith(
				"Save entry",
				"Click Save and verify the entry appears.",
			),
		);
	});

	it("keeps the description available after a rejected save and retries it", async () => {
		state.save.mockRejectedValueOnce(new Error("Storage unavailable"));
		render(<AppTestingPanel appId="app" />);
		fireEvent.change(
			screen.getByRole("textbox", { name: "Recording name" }),
			{
				target: { value: "Save entry" },
			},
		);
		const description = screen.getByRole("textbox", {
			name: "Test description (required)",
		});
		fireEvent.change(description, {
			target: { value: "Verify the saved entry appears." },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save recording" }));
		await screen.findByText("Storage unavailable");
		expect((description as HTMLTextAreaElement).value).toBe(
			"Verify the saved entry appears.",
		);
		fireEvent.click(screen.getByRole("button", { name: "Save recording" }));
		await waitFor(() => expect(state.save).toHaveBeenCalledTimes(2));
		expect(state.save).toHaveBeenLastCalledWith(
			"Save entry",
			"Verify the saved entry appears.",
		);
	});
});

it("runs from file rows without a saved-test dropdown", () => {
	const previous = state.steps;
	state.steps = [];
	state.recordings = [
		{
			id: "test-id",
			name: "Save entry",
			description: "Verify the saved entry.",
		},
	];
	render(<AppTestingPanel appId="app" />);
	expect(screen.queryByRole("combobox")).toBeNull();
	fireEvent.click(
		screen.getByRole("button", { name: "Run test Save entry" }),
	);
	expect(state.startRun).toHaveBeenLastCalledWith("test-id", {
		headless: true,
		keepOpen: false,
	});
	fireEvent.click(screen.getByRole("button", { name: "Run all" }));
	expect(state.runAll).toHaveBeenCalledTimes(1);
	state.steps = previous;
	state.recordings = [];
});

it("offers recording and upload from the plus menu and forwards the chosen JSON file", async () => {
	const previous = state.steps;
	state.steps = [];
	render(<AppTestingPanel appId="app" />);
	const add = screen.getByRole("button", { name: "Add test" });
	fireEvent.keyDown(add, { key: "ArrowDown" });
	await screen.findByRole("menuitem", { name: "Record workflow" });
	fireEvent.click(screen.getByRole("menuitem", { name: "Upload test" }));
	const file = new File(['{"name":"Test"}'], "test.json", {
		type: "application/json",
	});
	fireEvent.change(screen.getByLabelText("Upload test JSON"), {
		target: { files: [file] },
	});
	expect(state.uploadTest).toHaveBeenLastCalledWith(file);
	state.steps = previous;
});

it("starts headless by default and applies headed/keep-open choices to all run actions", () => {
	const previous = state.steps;
	state.steps = [];
	state.startRun.mockClear();
	state.runAll.mockClear();
	state.recordings = [
		{ id: "test-id", name: "Save entry", description: "Verify save" },
	];
	render(<AppTestingPanel appId="app" />);
	const headed = screen.getByRole("switch", { name: "Show browser window" });
	const keep = screen.getByRole("switch", {
		name: "Keep final window open for up to 60 seconds",
	});
	expect(headed.getAttribute("aria-checked")).toBe("false");
	expect(keep).toBeDisabled();
	fireEvent.click(headed);
	fireEvent.click(keep);
	fireEvent.click(
		screen.getByRole("button", { name: "Run test Save entry" }),
	);
	expect(state.startRun).toHaveBeenLastCalledWith("test-id", {
		headless: false,
		keepOpen: true,
	});
	fireEvent.click(screen.getByRole("button", { name: "Run all" }));
	expect(state.runAll).toHaveBeenLastCalledWith({
		headless: false,
		keepOpen: true,
	});
	fireEvent.click(
		screen.getByRole("button", { name: "Page visibility check" }),
	);
	expect(state.startRun).toHaveBeenLastCalledWith("__platform_smoke__", {
		headless: false,
		keepOpen: true,
	});
	fireEvent.click(headed);
	fireEvent.click(screen.getByRole("button", { name: "Run all" }));
	expect(state.runAll).toHaveBeenLastCalledWith({
		headless: true,
		keepOpen: false,
	});
	state.steps = previous;
	state.recordings = [];
});

it("disables browser preferences while a run is active", () => {
	const previous = state.steps;
	state.steps = [];
	state.isRunning = true;
	render(<AppTestingPanel appId="app" />);
	expect(
		screen.getByRole("switch", { name: "Show browser window" }),
	).toBeDisabled();
	expect(
		screen.getByRole("switch", {
			name: "Keep final window open for up to 60 seconds",
		}),
	).toBeDisabled();
	state.isRunning = false;
	state.steps = previous;
});
