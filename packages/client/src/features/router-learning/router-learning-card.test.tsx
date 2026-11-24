import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	rollbackRouterConfigPixel,
	setRouterLearningPixel,
} from "@/api/router-learning";
import { RouterLearningCard } from "./router-learning-card";

const mocks = vi.hoisted(() => ({ usePixel: vi.fn(), run: vi.fn() }));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	usePixel: mocks.usePixel,
	useSessionInsight: () => ({ run: mocks.run, insightId: "i" }),
	useSession: (selector: (s: { user: { isAdmin: boolean } }) => unknown) =>
		selector({ user: { isAdmin: true } }),
}));
const status = {
	mode: "subtask",
	enabled: true,
	paused: false,
	current_version: "v3",
	min_new_tasks: 1000,
	frequency: "daily",
	new_tasks_since_last_attempt: 295,
	versions: [
		{
			version: "v3",
			committed_at: "2026-11-10T10:00:00Z",
			changes: [
				"Step A moved",
				"Step B moved",
				"Step C moved",
				"Step D moved",
			],
		},
		{
			version: "v2",
			committed_at: "2026-11-09T10:00:00Z",
			changes: ["Step E"],
		},
		{
			version: "v1",
			committed_at: "2026-11-08T10:00:00Z",
			changes: ["initial setup"],
		},
	],
};
const config = {
	mode: "subtask",
	strong_route: "sol",
	routes: [
		{ engine_id: "e-luna", name: "luna" },
		{ engine_id: "e-sol", name: "sol" },
	],
	subtasks: [
		{ id: "read", definition: "Read existing source files", route: "luna" },
		{
			id: "edit",
			definition: "Create or edit file deliverables",
			route: "sol",
		},
	],
};
const costs = {
	cost_by_version: [
		{ config_version: "v1", avg_cost_micros_per_priced_step: 5400 },
		{ config_version: "v3", avg_cost_micros_per_priced_step: 1600 },
	],
};

/** The quick status, the costs (null while still loading) and the config are three separate reads. */
const serve = (quick: unknown = status, slow: unknown = costs) =>
	mocks.usePixel.mockImplementation((pixel: string) => {
		const data = pixel.startsWith("GetModelRouterConfig")
			? JSON.stringify(config)
			: pixel === ""
				? undefined
				: pixel.includes("withCosts=[true]")
					? slow
					: quick;
		return {
			status: data === undefined || data === null ? "LOADING" : "SUCCESS",
			data,
			refresh: vi.fn(),
		};
	});

beforeEach(() => {
	mocks.run.mockReset();
	mocks.run.mockResolvedValue({
		errors: [],
		pixelReturn: [{ operationType: ["OPERATION"], output: {} }],
	});
	serve();
});
afterEach(cleanup);

describe("RouterLearningCard", () => {
	it("shows the cost line, the models in use and the history", () => {
		render(<RouterLearningCard engineId="rt" />);
		expect(
			screen.getByText("Cost per step: $0.0054 -> $0.0016"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Read existing source files"),
		).toBeInTheDocument();
		expect(screen.getByText("luna")).toBeInTheDocument();
		expect(screen.getByText("sol")).toBeInTheDocument();
		expect(screen.getByText("Live")).toBeInTheDocument();
		expect(screen.getByText("Step B moved")).toBeInTheDocument();
		expect(screen.queryByText("Step C moved")).not.toBeInTheDocument();
		expect(screen.getByText("+2 more")).toBeInTheDocument();
		expect(screen.queryByText("Advanced")).not.toBeInTheDocument();
	});

	it("shows no cost line until the cost data has arrived", () => {
		serve(status, null);
		render(<RouterLearningCard engineId="rt" />);
		expect(screen.getByText("v3")).toBeInTheDocument();
		expect(screen.queryByText(/Cost per step/)).not.toBeInTheDocument();
	});

	it("turns learning on without replay workspace setup and off through SetRouterLearning", async () => {
		serve({ ...status, enabled: false });
		const { unmount } = render(<RouterLearningCard engineId="rt" />);
		fireEvent.click(screen.getByRole("switch"));
		await waitFor(() =>
			expect(mocks.run).toHaveBeenCalledWith(
				setRouterLearningPixel({
					engineId: "rt",
					enabled: true,
					optimizerModelId: "e-sol",
					minNewTasks: 1000,
				}),
			),
		);
		unmount();
		serve();
		render(<RouterLearningCard engineId="rt" />);
		fireEvent.click(screen.getByRole("switch"));
		await waitFor(() =>
			expect(mocks.run).toHaveBeenCalledWith(
				setRouterLearningPixel({ engineId: "rt", enabled: false }),
			),
		);
	});

	it("undoes to a version only after the confirmation", async () => {
		render(<RouterLearningCard engineId="rt" />);
		fireEvent.click(screen.getByRole("button", { name: "Undo to v1" }));
		expect(mocks.run).not.toHaveBeenCalled();
		fireEvent.click(
			await screen.findByRole("button", { name: "Roll back" }),
		);
		await waitFor(() =>
			expect(mocks.run).toHaveBeenCalledWith(
				rollbackRouterConfigPixel("rt", "v1"),
			),
		);
	});

	it("saves the new-task count through SetRouterLearning and shows how many are in", async () => {
		render(<RouterLearningCard engineId="rt" />);
		expect(screen.getByText(/295 so far/)).toBeInTheDocument();
		const field = screen.getByLabelText("Learn after this many new tasks");
		fireEvent.change(field, { target: { value: "500" } });
		fireEvent.blur(field);
		await waitFor(() =>
			expect(mocks.run).toHaveBeenCalledWith(
				setRouterLearningPixel({
					engineId: "rt",
					enabled: true,
					optimizerModelId: "e-sol",
					minNewTasks: 500,
				}),
			),
		);
	});

	it("saves the schedule choice through SetRouterLearning", async () => {
		render(<RouterLearningCard engineId="rt" />);
		fireEvent.change(screen.getByLabelText("Also check"), {
			target: { value: "weekly" },
		});
		await waitFor(() =>
			expect(mocks.run).toHaveBeenCalledWith(
				setRouterLearningPixel({
					engineId: "rt",
					enabled: true,
					optimizerModelId: "e-sol",
					minNewTasks: 1000,
					frequency: "weekly",
				}),
			),
		);
	});

	it("allows Resume while paused without replay workspace setup", async () => {
		serve({ ...status, paused: true });
		render(<RouterLearningCard engineId="rt" />);
		const resumeButton = screen.getByRole("button", { name: "Resume" });
		expect(resumeButton).toBeEnabled();
		fireEvent.click(resumeButton);
		await waitFor(() =>
			expect(mocks.run).toHaveBeenCalledWith(
				setRouterLearningPixel({
					engineId: "rt",
					enabled: true,
					optimizerModelId: "e-sol",
					minNewTasks: 1000,
				}),
			),
		);
	});
});
