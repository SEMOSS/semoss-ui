import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TooltipProvider } from "@semoss/ui/next";
import { WorkbenchProvider } from "../../contexts/workbench.context";
import { createWorkbenchStore } from "../../stores/workbench.store";
import type { WorkbenchLayout } from "../../types";
import { Workbench } from "./workbench";

const snapshot: WorkbenchLayout = {
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [],
		activeId: null,
		enableDeleteWhenEmpty: false,
	},
	panels: {
		files: { id: "files", type: "files", name: "Files" },
	},
	borders: {
		left: { panelIds: ["files"], activeId: "files", size: 300 },
	},
};

beforeEach(() => {
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({
			matches: false,
			addEventListener() {},
			removeEventListener() {},
		})),
	);
});
afterEach(() => vi.unstubAllGlobals());

it("shows the center pane only while it has content and keeps the browser and drop slot available", () => {
	const store = createWorkbenchStore({
		components: {
			files: { name: "Files", content: () => <p>Browse files</p> },
			preview: { name: "Document", content: () => <p>File preview</p> },
		},
	});
	const actions = store.getState().layout.actions;
	const registerSlot = vi.spyOn(actions, "registerSlotElement");
	render(
		<TooltipProvider>
			<WorkbenchProvider store={store}>
				<Workbench snapshot={snapshot} />
			</WorkbenchProvider>
		</TooltipProvider>,
	);
	const main = screen.getByTestId("workbench-tabset-main");
	const slot = main.querySelector('[data-body="main"]');
	expect(slot).toBeInTheDocument();
	expect(registerSlot).toHaveBeenCalledWith("main", slot);
	expect(main).not.toHaveClass("border");
	expect(main).not.toHaveClass("bg-card");
	expect(within(main).queryByRole("tablist")).toBeNull();
	expect(screen.queryByText("No panel here.")).toBeNull();
	expect(screen.getByRole("tab", { name: "Files" })).toBeVisible();

	let previewId = "";
	act(() => {
		previewId = actions.selectPanel("preview");
	});
	expect(main).toHaveClass("border", "bg-card");
	expect(within(main).getByRole("tab", { name: "Document" })).toBeVisible();
	expect(main.querySelector('[data-body="main"]')).toBe(slot);

	act(() => actions.closePanel(previewId));
	expect(main).not.toHaveClass("border");
	expect(main).not.toHaveClass("bg-card");
	expect(within(main).queryByRole("tablist")).toBeNull();
	expect(screen.queryByText("No panel here.")).toBeNull();
	expect(main.querySelector('[data-body="main"]')).toBe(slot);
	expect(screen.getByRole("tab", { name: "Files" })).toBeVisible();
	expect(store.getState().layout.borders.left.activeId).toBe("files");
});
