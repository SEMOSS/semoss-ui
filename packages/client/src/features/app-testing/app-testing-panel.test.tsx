import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
	recordings: [],
	updateRecording: vi.fn(),
	deleteRecording: vi.fn(),
	isLoading: false,
	refreshRecordings: vi.fn(),
	startRecording: vi.fn(),
	stopRecording: vi.fn(),
	addCheck: vi.fn(),
	save: vi.fn(),
	startRun: vi.fn(),
	refreshRun: vi.fn(),
	discard: vi.fn(),
}));
vi.mock("./use-app-testing", () => ({ useAppTesting: () => state }));
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

it("groups recording and replay controls and starts only one replay", () => {
	const previous = state.steps;
	state.steps = [];
	render(<AppTestingPanel appId="app" />);
	expect(screen.getByRole("group", { name: "Record workflow" })).toBeTruthy();
	expect(screen.getByRole("group", { name: "Run saved test" })).toBeTruthy();
	expect(screen.queryByRole("button", { name: /3 replays/ })).toBeNull();
	fireEvent.click(screen.getByRole("button", { name: "Run test" }));
	expect(state.startRun).toHaveBeenLastCalledWith();
	state.steps = previous;
});
