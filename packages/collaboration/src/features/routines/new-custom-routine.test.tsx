import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomRoutine } from "./custom-routine-schema";
import { NewCustomRoutine } from "./new-custom-routine";

// one actions object, as the provider gives
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
const api = vi.hoisted(() => ({ saveCustomRoutine: vi.fn() }));

vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
vi.mock("./custom-routine-api", () => ({
	saveCustomRoutine: api.saveCustomRoutine,
}));

afterEach(cleanup);
beforeEach(() => {
	api.saveCustomRoutine.mockReset();
});

function renderNew() {
	const onCreated = vi.fn();
	const onCancel = vi.fn();
	render(
		<NewCustomRoutine
			skills={[]}
			onCreated={onCreated}
			onCancel={onCancel}
		/>,
	);
	return { onCreated, onCancel, user: userEvent.setup() };
}

describe("New routine", () => {
	it("fills the routine from an idea and creates it as filled in", async () => {
		const { onCreated, user } = renderNew();
		await user.click(
			screen.getByRole("button", { name: "Monday priorities" }),
		);

		expect(screen.getByLabelText("Name (required)")).toHaveValue(
			"Monday priorities",
		);
		expect(screen.getByLabelText("Task (required)")).toHaveDisplayValue(
			/top five priorities/,
		);
		expect(screen.getByLabelText("Run time (required)")).toHaveValue(
			"07:30",
		);
		expect(screen.getByRole("button", { name: "Monday" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByRole("button", { name: "Tuesday" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
		expect(
			screen.getByRole("radio", { name: /Teams message to me/ }),
		).toBeChecked();
		// a routine that is not saved has no folder for its files yet
		expect(
			screen.getByText(/You can add them once the routine is created/),
		).toBeVisible();

		const created = { id: "new-1" } as CustomRoutine;
		api.saveCustomRoutine.mockResolvedValue(created);
		await user.click(
			screen.getByRole("button", { name: "Create routine" }),
		);
		expect(api.saveCustomRoutine).toHaveBeenCalledWith(
			insight.actions,
			expect.objectContaining({
				enabled: true,
				name: "Monday priorities",
				days: ["MON"],
				time: "07:30",
				delivery: "teams",
				skills: [],
				tools: [],
			}),
		);
		expect(onCreated).toHaveBeenCalledWith(created);
	});

	it("starts blank from scratch, goes back to the ideas, and keeps a refused routine open", async () => {
		const { onCreated, user } = renderNew();
		await user.click(
			screen.getByRole("button", { name: /Start from scratch/ }),
		);
		expect(screen.getByLabelText("Name (required)")).toHaveValue("");
		expect(screen.getByLabelText("Task (required)")).toHaveValue("");
		expect(screen.getByRole("radio", { name: /Email me/ })).toBeChecked();

		await user.click(screen.getByRole("button", { name: "Back to ideas" }));
		await user.click(
			screen.getByRole("button", { name: "Client asks digest" }),
		);
		api.saveCustomRoutine.mockRejectedValue(
			new Error("You can have at most 10 routines."),
		);
		await user.click(
			screen.getByRole("button", { name: "Create routine" }),
		);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"You can have at most 10 routines.",
		);
		expect(screen.getByLabelText("Name (required)")).toHaveValue(
			"Client asks digest",
		);
		expect(onCreated).not.toHaveBeenCalled();
	});

	it("offers a blank start before the ideas", () => {
		renderNew();
		const [first, ...ideas] = within(screen.getByRole("list")).getAllByRole(
			"button",
		);
		expect(first).toHaveAccessibleName(/^Start from scratch/);
		expect(ideas[0]).toHaveAccessibleName("Client asks digest");
	});

	it("leaves without creating", async () => {
		const { onCancel, user } = renderNew();
		await user.click(screen.getByRole("button", { name: "Cancel" }));
		expect(onCancel).toHaveBeenCalled();
		expect(api.saveCustomRoutine).not.toHaveBeenCalled();
	});
});
