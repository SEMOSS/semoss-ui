import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TooltipProvider } from "@semoss/ui/next";
import { WorkbenchProvider } from "../../contexts/workbench.context";
import { createWorkbenchStore } from "../../stores/workbench.store";
import type { WorkbenchLayout } from "../../types";
import { Workbench } from "./workbench";

let isMobile = true;
vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	useIsMobile: () => isMobile,
}));
const snapshot: WorkbenchLayout = {
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [],
		activeId: null,
		enableDeleteWhenEmpty: false,
	},
	panels: {},
};
beforeEach(() => {
	isMobile = true;
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		value: vi.fn(() => ({
			matches: false,
			addEventListener() {},
			removeEventListener() {},
		})),
	});
});
afterEach(() => vi.unstubAllGlobals());
function setup(
	mobileTopBorder?: "toolbar" | "drawer",
	layoutMode?: "auto" | "compact",
) {
	const store = createWorkbenchStore({ components: {} });
	const close = vi.fn();
	const view = () => (
		<TooltipProvider>
			<WorkbenchProvider store={store}>
				<Workbench
					snapshot={snapshot}
					mobileTopBorder={mobileTopBorder}
					layoutMode={layoutMode}
					borderSlots={{
						top: {
							before: (
								<>
									<button type="button">File</button>
									<button type="button">View</button>
								</>
							),
							after: (
								<button type="button" onClick={close}>
									Close workbench
								</button>
							),
						},
						left: {
							after: <button type="button">Left action</button>,
						},
					}}
				/>
			</WorkbenchProvider>
		</TooltipProvider>
	);
	const rendered = render(view());
	return { ...rendered, store, close, view };
}
it("keeps File, View, and Close visible on mobile even without panels and omits them from the drawer", async () => {
	const { close } = setup("toolbar");
	const toolbar = screen.getByTestId("workbench-mobile-toolbar");
	expect(
		within(toolbar)
			.getAllByRole("button")
			.map((button) => button.textContent),
	).toEqual(["File", "View", "Close workbench"]);
	fireEvent.click(screen.getByRole("button", { name: "Close workbench" }));
	expect(close).toHaveBeenCalledOnce();
	fireEvent.click(screen.getByRole("button", { name: "Panels and actions" }));
	const drawer = await screen.findByRole("dialog", { name: "Panels" });
	expect(
		within(drawer).getByRole("button", { name: "Left action" }),
	).toBeVisible();
	expect(within(drawer).queryByRole("button", { name: "File" })).toBeNull();
	expect(within(drawer).queryByRole("button", { name: "View" })).toBeNull();
	expect(
		within(drawer).queryByRole("button", { name: "Close workbench" }),
	).toBeNull();
});
it("preserves the existing drawer default for other hosts", async () => {
	setup();
	expect(screen.queryByTestId("workbench-mobile-toolbar")).toBeNull();
	expect(
		screen.queryByRole("button", { name: "Close workbench" }),
	).toBeNull();
	fireEvent.click(screen.getByRole("button", { name: "Panels and actions" }));
	const drawer = await screen.findByRole("dialog", { name: "Panels" });
	expect(
		within(drawer).getByRole("button", { name: "Close workbench" }),
	).toBeVisible();
});
it("moves the controls between desktop border and mobile toolbar without duplication", () => {
	isMobile = false;
	const { rerender, view, store } = setup("toolbar");
	expect(
		within(screen.getByTestId("workbench-border-top")).getByRole("button", {
			name: "File",
		}),
	).toBeVisible();
	isMobile = true;
	act(() => store.getState().layout.actions.setMobileLayout(true));
	rerender(view());
	expect(screen.getAllByRole("button", { name: "File" })).toHaveLength(1);
	expect(screen.getByTestId("workbench-mobile-toolbar")).toBeVisible();
});

it("lets a narrow host choose compact layout on a desktop viewport", () => {
	isMobile = false;
	setup("toolbar", "compact");
	expect(screen.getByTestId("workbench-mobile-toolbar")).toBeVisible();
	expect(screen.queryByTestId("workbench-border-top")).toBeNull();
});
