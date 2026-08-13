import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import "@testing-library/jest-dom";

const METADATA = {
	engineId: "e1",
	modelId: "gpt-5",
	reasoning: true,
	reasoningConfig: {
		default_effort: "medium",
		mandatory: false,
		// Stored strongest first, the way providers write it.
		supported_efforts: ["max", "high", "medium", "low"],
		supports_max_tokens: true,
	},
};

vi.mock("@semoss/sdk/react", () => ({
	usePixel: (pixel: string) => {
		if (pixel.startsWith("GetModelMetadata")) {
			return { status: "SUCCESS", data: METADATA, refresh: () => {} };
		}
		if (pixel.startsWith("GetStaticModelMetadata")) {
			return {
				status: "SUCCESS",
				data: { id: "gpt-5", reasoning: true },
				refresh: () => {},
			};
		}
		return { status: "INITIAL", data: undefined, refresh: () => {} };
	},
}));

vi.mock("@/hooks", () => ({
	useRootStore: () => ({ configStore: { runPixel: async () => ({}) } }),
}));

const { EngineModelSettings } = await import("./engine-model-settings");

const EFFORT_WARNING =
	"engine-model-settings--reasoning-default-effort-warning";

const efforts = () =>
	within(
		screen.getByTestId(
			"engine-model-settings--reasoning-supported-efforts",
		),
	);

const stateOf = (label: string) =>
	efforts().getByText(label).getAttribute("data-state");

test("renders stored efforts weakest to strongest, all selected", () => {
	render(<EngineModelSettings engineId="e1" permission="OWNER" />);

	expect(
		efforts()
			.getAllByRole("button")
			.map((button) => button.textContent),
	).toEqual(["Low", "Medium", "High", "Max"]);

	for (const label of ["Low", "Medium", "High", "Max"]) {
		expect(stateOf(label)).toBe("on");
	}
	expect(screen.queryByTestId(EFFORT_WARNING)).not.toBeInTheDocument();
});

test("deselecting one effort leaves the others selected", () => {
	render(<EngineModelSettings engineId="e1" permission="OWNER" />);

	fireEvent.click(efforts().getByText("High"));

	expect(stateOf("High")).toBe("off");
	expect(stateOf("Low")).toBe("on");
	expect(stateOf("Medium")).toBe("on");
	expect(stateOf("Max")).toBe("on");

	// Medium is still selected, so the default effort has nothing to warn about.
	expect(screen.queryByTestId(EFFORT_WARNING)).not.toBeInTheDocument();
});

test("moves the default effort to the nearest one still selected", () => {
	render(<EngineModelSettings engineId="e1" permission="OWNER" />);

	// Medium is the stored default, so deselecting it has to rehome the default
	// rather than leave it pointing at an unselected effort.
	fireEvent.click(efforts().getByText("Medium"));

	expect(
		screen.getByTestId("engine-model-settings--reasoning-default-effort"),
	).toHaveTextContent("Low");
	expect(screen.queryByTestId(EFFORT_WARNING)).not.toBeInTheDocument();
});

test("hides the effort fields while reasoning is off", () => {
	render(<EngineModelSettings engineId="e1" permission="OWNER" />);

	fireEvent.click(screen.getByTestId("engine-model-settings--reasoning"));

	expect(
		screen.queryByTestId(
			"engine-model-settings--reasoning-supported-efforts",
		),
	).not.toBeInTheDocument();
	expect(
		screen.queryByTestId("engine-model-settings--reasoning-default-effort"),
	).not.toBeInTheDocument();

	// Switching it back on restores the stored selection untouched.
	fireEvent.click(screen.getByTestId("engine-model-settings--reasoning"));

	for (const label of ["Low", "Medium", "High", "Max"]) {
		expect(stateOf(label)).toBe("on");
	}
});

test("keeps the last effort selected while reasoning is on", () => {
	render(<EngineModelSettings engineId="e1" permission="OWNER" />);

	for (const label of ["Low", "Medium", "High", "Max"]) {
		fireEvent.click(efforts().getByText(label));
	}

	// The final deselection is refused, so one effort survives.
	expect(
		["Low", "Medium", "High", "Max"].filter(
			(label) => stateOf(label) === "on",
		),
	).toHaveLength(1);
});
