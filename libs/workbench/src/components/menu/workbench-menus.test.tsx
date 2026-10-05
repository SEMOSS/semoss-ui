import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DropdownMenuItem } from "@semoss/ui/next";
import { getWorkbenchMenuLabel } from "../../constants/workbench-menu.constants";
import { WorkbenchProvider } from "../../contexts/workbench.context";
import { createWorkbenchStore } from "../../stores/workbench.store";
import type { WorkbenchLayout } from "../../types";
import { WorkbenchPanelLayer } from "../panel/workbench-panel-layer";
import { WorkbenchMenus } from "./workbench-menus";

/** Local editor state must survive rearrangement and combining its tab group. */
function DraftEditor() {
	const [draft, setDraft] = useState("Unsaved draft");
	return (
		<input
			aria-label="Draft"
			value={draft}
			onChange={(event) => setDraft(event.target.value)}
		/>
	);
}

const SNAPSHOT: WorkbenchLayout = {
	tree: {
		type: "row",
		id: "root",
		size: 1,
		children: [
			{
				type: "tabset",
				id: "one",
				size: 1,
				panelIds: ["a"],
				activeId: "a",
			},
			{
				type: "tabset",
				id: "two",
				size: 1,
				panelIds: ["b"],
				activeId: "b",
			},
		],
	},
	panels: {
		a: { id: "a", type: "editor", name: "Alpha" },
		b: { id: "b", type: "editor", name: "Beta" },
	},
	selectedPanelId: "a",
};

function setup(isMobile = false) {
	const store = createWorkbenchStore({
		components: { editor: { content: DraftEditor, mount: "keepAlive" } },
	});
	store.getState().layout.actions.loadSnapshot(SNAPSHOT);
	store.getState().layout.actions.setMobileLayout(isMobile);
	const onNavigate = vi.fn();
	render(
		<WorkbenchProvider store={store}>
			<WorkbenchMenus onNavigate={onNavigate} />
			<WorkbenchPanelLayer />
		</WorkbenchProvider>,
	);
	return { store, onNavigate };
}

/** Open a Radix menu using its keyboard contract. */
function openMenu(name: string) {
	const trigger = screen.getByRole("button", { name });
	fireEvent.keyDown(trigger, { key: "Enter" });
	return trigger;
}

/** Reach panel navigation through View using the submenu keyboard contract. */
async function openNavigate(viewName = "View") {
	openMenu(viewName);
	fireEvent.keyDown(
		await screen.findByRole("menuitem", { name: "Navigate" }),
		{ key: "ArrowRight" },
	);
}

describe("Workbench menus", () => {
	it("offers only whole-workbench actions and preserves editor DOM and drafts through presets", async () => {
		const { store } = setup();
		const editors = screen.getAllByLabelText("Draft");
		fireEvent.change(editors[0], { target: { value: "Keep these edits" } });
		openMenu("View");
		const layout = await screen.findByRole("menuitem", { name: "Layout" });
		fireEvent.keyDown(layout, { key: "ArrowRight" });
		fireEvent.click(
			await screen.findByRole("menuitem", {
				name: "Combine into One Group",
			}),
		);
		expect(store.getState().layout.tabsets).toHaveLength(1);
		expect(screen.getAllByLabelText("Draft")[0]).toBe(editors[0]);
		expect(editors[0]).toHaveValue("Keep these edits");
		expect(screen.getAllByLabelText("Draft")[1]).toBe(editors[1]);
		await openNavigate();
		expect(
			await screen.findByRole("menuitemradio", { name: "Alpha" }),
		).toHaveAttribute("aria-checked", "true");
		expect(
			screen.queryByRole("menuitem", {
				name: /^(Save|Rename|Pin|Close)/,
			}),
		).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("menuitemradio", { name: "Beta" }));
		expect(store.getState().layout.selection.panel).toBe("b");
	});

	it("nests Navigate under View and returns focus after keyboard dismissal", async () => {
		setup();
		expect(
			screen.queryByRole("button", { name: "Navigate" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Help" }),
		).not.toBeInTheDocument();
		const view = openMenu("View");
		const navigate = await screen.findByRole("menuitem", {
			name: "Navigate",
		});
		fireEvent.keyDown(navigate, { key: "ArrowRight" });
		const next = await screen.findByRole("menuitem", {
			name: "Next Panel",
		});
		fireEvent.keyDown(next, { key: "ArrowLeft" });
		await waitFor(() => expect(navigate).toHaveFocus());
		expect(
			screen.queryByRole("menuitem", { name: "Next Panel" }),
		).not.toBeInTheDocument();
		fireEvent.keyDown(navigate, { key: "Escape" });
		await waitFor(() => expect(view).toHaveFocus());
	});

	it("opens the palette and toggles occupied borders without deleting their panels", async () => {
		const { store } = setup();
		act(() =>
			store.getState().layout.actions.movePanel("b", {
				kind: "border",
				side: "right",
			}),
		);
		openMenu("View");
		const side = await screen.findByRole("menuitemcheckbox", {
			name: "Right Side Area",
		});
		expect(side).toHaveAttribute("aria-checked", "true");
		fireEvent.click(side);
		expect(store.getState().layout.borders.right.activeId).toBeNull();
		expect(store.getState().layout.panels.b).toBeDefined();
		openMenu("View");
		fireEvent.click(
			await screen.findByRole("menuitem", { name: "Command Palette…" }),
		);
		await waitFor(() =>
			expect(store.getState().command.isCommandOpen).toBe(true),
		);
	});

	it("adapts to mobile and dismisses the host drawer after navigation", async () => {
		const { store, onNavigate } = setup(true);
		openMenu("View");
		await screen.findByRole("menuitem", { name: "Command Palette…" });
		expect(
			screen.queryByRole("menuitem", { name: "Layout" }),
		).not.toBeInTheDocument();
		fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
		await waitFor(() =>
			expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
		);
		await openNavigate();
		fireEvent.click(
			await screen.findByRole("menuitem", { name: "Next Panel" }),
		);
		expect(store.getState().layout.mobileActivePanelId).toBe("b");
		expect(onNavigate).toHaveBeenCalledTimes(1);
	});

	it("supports empty workbenches, translated copy and host-owned maximize", async () => {
		const store = createWorkbenchStore({ components: {} });
		const onToggle = vi.fn();
		render(
			<WorkbenchProvider store={store}>
				<WorkbenchMenus
					translate={(key) =>
						key === "view"
							? "Affichage"
							: getWorkbenchMenuLabel(key)
					}
					maximize={{ isMaximized: false, onToggle }}
				/>
			</WorkbenchProvider>,
		);
		openMenu("Affichage");
		fireEvent.click(
			await screen.findByRole("menuitem", { name: "Maximize Work Area" }),
		);
		expect(onToggle).toHaveBeenCalledOnce();
		await openNavigate("Affichage");
		expect(
			await screen.findByRole("menuitem", { name: "Next Panel" }),
		).toHaveAttribute("aria-disabled", "true");
		expect(
			screen.getByRole("menuitem", { name: "No open panels" }),
		).toBeInTheDocument();
	});
});

it("allows a host section to replace Navigate without changing shared defaults", async () => {
	const store = createWorkbenchStore({ components: {} });
	const openSettings = vi.fn();
	render(
		<WorkbenchProvider store={store}>
			<WorkbenchMenus
				showNavigation={false}
				viewItems={
					<DropdownMenuItem onSelect={openSettings}>
						Settings
					</DropdownMenuItem>
				}
			/>
		</WorkbenchProvider>,
	);
	openMenu("View");
	expect(
		await screen.findByRole("menuitem", { name: "Settings" }),
	).toBeVisible();
	expect(screen.queryByRole("menuitem", { name: "Navigate" })).toBeNull();
	expect(screen.getByRole("menuitem", { name: "Layout" })).toBeVisible();
	expect(
		screen.getByRole("menuitem", { name: "Command Palette…" }),
	).toBeVisible();
	fireEvent.click(screen.getByRole("menuitem", { name: "Settings" }));
	expect(openSettings).toHaveBeenCalledTimes(1);
});
