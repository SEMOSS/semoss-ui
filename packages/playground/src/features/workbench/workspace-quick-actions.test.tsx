import { fireEvent, render, screen, within } from "@testing-library/react";
import { runInAction } from "mobx";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";
import { RootStore } from "@/stores/root/root.store";
import type { DraftWorkspacePlaces } from "./use-workspace-places";
import { WorkspaceQuickActions } from "./workspace-quick-actions";

const openSettings = vi.hoisted(() => vi.fn());
vi.mock("@/features/settings/settings-dialog.context", () => ({
	useSettingsDialog: () => ({ openSettings }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	getI18n: () => ({ t: (key: string) => key }),
}));

// a desktop window: the header's icons are the compact size
beforeEach(() => {
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	);
});
afterEach(() => vi.unstubAllGlobals());

/** Build a room with OneDrive switched on, without network-backed loading. */
function createRoom(): RoomStore {
	const room = new RoomStore({
		theme: new RootStore().theme,
		roomId: "quick-actions",
		panelComponents: {},
	});
	runInAction(() => {
		room.connectors.services = ["onedrive"];
	});
	return room;
}

/** The header's own icons, in order. */
function getIconNames(): string[] {
	const nav = screen.getByRole("navigation", { name: "studio.workArea" });
	return within(nav)
		.getAllByRole("button")
		.map((button) => button.getAttribute("aria-label") ?? "");
}

/** Open the Other menu and list its top-level items. */
function openMore(): string[] {
	fireEvent.keyDown(
		screen.getByRole("button", { name: "studio.moreActions" }),
		{ key: "Enter" },
	);
	return within(screen.getByRole("menu"))
		.getAllByRole("menuitem")
		.map((item) => item.textContent ?? "");
}

/** Open the Other menu's Open a Panel submenu and list its places. */
function openPanelMenu(): string[] {
	openMore();
	fireEvent.keyDown(
		screen.getByRole("menuitem", { name: "workspacePlaces.openPanel" }),
		{ key: "Enter" },
	);
	const [, submenu] = screen.getAllByRole("menu");
	if (!submenu) throw new Error("Open a Panel did not open");
	return within(submenu)
		.getAllByRole("menuitem")
		.map((item) => item.textContent ?? "");
}

/** Close any open menu. */
function closeMenus(): void {
	fireEvent.keyDown(document.activeElement ?? document.body, {
		key: "Escape",
	});
}

test("the header shows Other and the Workspace toggle, with no quick icons", () => {
	render(<WorkspaceQuickActions room={createRoom()} />);

	expect(getIconNames()).toEqual([
		"studio.moreActions",
		"studio.openWorkspace",
	]);
	expect(openMore()).toEqual([
		"workspacePlaces.openPanel",
		"sidebar:settings.sections.connectors",
	]);
	fireEvent.click(
		screen.getByRole("menuitem", {
			name: "sidebar:settings.sections.connectors",
		}),
	);
	expect(openSettings).toHaveBeenCalledWith("connectors");
});

test("Open a Panel lists every place and opens the Workspace on it", () => {
	const room = createRoom();
	render(<WorkspaceQuickActions room={room} />);

	expect(openPanelMenu()).toEqual([
		"workspacePlaces.files",
		"workspacePlaces.settings",
		"workspacePlaces.activity",
		"connectors:services.onedrive",
	]);
	fireEvent.click(
		screen.getByRole("menuitem", { name: "workspacePlaces.settings" }),
	);

	const { borders, panels } = room.workbench.getState().layout;
	expect(room.sidebar.isOpen).toBe(true);
	expect(panels[borders.left.activeId ?? ""]?.type).toBe(
		ROOM_PANEL_TYPES.CONFIGURATION,
	);
});

test("the toggle opens the Workspace as it was left and closes it", () => {
	const room = createRoom();
	render(<WorkspaceQuickActions room={room} />);
	const toggle = screen.getByRole("button", { name: "studio.openWorkspace" });
	expect(toggle).toHaveAttribute("aria-pressed", "false");

	fireEvent.click(toggle);
	expect(room.sidebar.isOpen).toBe(true);
	expect(toggle).toHaveAttribute("aria-label", "studio.closeWorkspace");
	expect(toggle).toHaveAttribute("aria-pressed", "true");
	// the rail stays collapsed: nothing is opened for the user
	expect(room.workbench.getState().layout.borders.left.activeId).toBeNull();

	fireEvent.click(toggle);
	expect(room.sidebar.isOpen).toBe(false);
	expect(toggle).toHaveAttribute("aria-label", "studio.openWorkspace");
});

test("a draft waits while preparing and uses its own actions", () => {
	const room = createRoom();
	const draft: DraftWorkspacePlaces = {
		onOpenFiles: vi.fn(),
		onOpenSettings: vi.fn(),
		onOpenActivity: vi.fn(),
		onOpenWorkspace: vi.fn(),
		onOpenSource: vi.fn(),
		isPreparing: true,
		connectors: room.connectors,
	};
	const { rerender } = render(
		<WorkspaceQuickActions room={room} draft={draft} />,
	);

	openPanelMenu();
	expect(
		screen.getByRole("menuitem", { name: "studio.preparingWorkspace" }),
	).toHaveAttribute("aria-disabled", "true");
	fireEvent.click(
		screen.getByRole("menuitem", { name: "workspacePlaces.settings" }),
	);
	expect(draft.onOpenSettings).toHaveBeenCalledTimes(1);
	closeMenus();

	rerender(
		<WorkspaceQuickActions
			room={room}
			draft={{ ...draft, isPreparing: false }}
		/>,
	);
	for (const [name, action] of [
		["workspacePlaces.files", draft.onOpenFiles],
		["workspacePlaces.activity", draft.onOpenActivity],
	] as const) {
		openPanelMenu();
		fireEvent.click(screen.getByRole("menuitem", { name }));
		expect(action).toHaveBeenCalledTimes(1);
		closeMenus();
	}
	openPanelMenu();
	fireEvent.click(
		screen.getByRole("menuitem", { name: "connectors:services.onedrive" }),
	);
	expect(draft.onOpenSource).toHaveBeenCalledWith("onedrive");
});

test("while the Workspace is open, Other lists Close Workspace", () => {
	const room = createRoom();
	render(<WorkspaceQuickActions room={room} />);
	expect(openMore()).not.toContain("studio.closeWorkspace");
	closeMenus();

	fireEvent.click(
		screen.getByRole("button", { name: "studio.openWorkspace" }),
	);
	expect(openMore()).toContain("studio.closeWorkspace");
	fireEvent.click(
		screen.getByRole("menuitem", { name: "studio.closeWorkspace" }),
	);
	expect(room.sidebar.isOpen).toBe(false);
});
