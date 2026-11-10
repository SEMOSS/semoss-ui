import { fireEvent, render, screen, within } from "@testing-library/react";
import { runInAction } from "mobx";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { NewRoomWorkbenchPanels } from "@/features/workbench/use-workbench-panels";
import { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";
import { RootStore } from "@/stores/root/root.store";
import { RoomActionsMenu } from "./room-actions-menu";

const openSettings = vi.hoisted(() => vi.fn());
vi.mock("@/features/settings/settings-dialog.context", () => ({
	useSettingsDialog: () => ({ openSettings }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	getI18n: () => ({ t: (key: string) => key }),
}));

// a desktop window: the rail's icons are the compact size
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
		roomId: "header-controls",
		panelComponents: {},
	});
	runInAction(() => {
		room.connectors.services = ["onedrive"];
	});
	return room;
}

/** Open the More actions menu and list its top-level items. */
function openMore(): string[] {
	fireEvent.keyDown(
		screen.getByRole("button", { name: "studio.moreActions" }),
		{ key: "Enter" },
	);
	return within(screen.getByRole("menu"))
		.getAllByRole("menuitem")
		.map((item) => item.textContent ?? "");
}

/** Open the More actions menu's Open a Panel submenu and list its panels. */
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

test("More actions lists the Workspace and Settings sections", () => {
	render(<RoomActionsMenu room={createRoom()} isVertical />);

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

test("Open a Panel lists every panel and opens the Workspace on it", () => {
	const room = createRoom();
	render(<RoomActionsMenu room={room} isVertical />);

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

test("a new room waits while preparing, and its panels prepare the room", () => {
	const room = createRoom();
	const newRoomPanels: NewRoomWorkbenchPanels = {
		onOpenPanel: vi.fn(),
		isBusy: true,
		connectors: room.connectors,
	};
	const { rerender } = render(
		<RoomActionsMenu
			room={room}
			newRoomPanels={newRoomPanels}
			isVertical
		/>,
	);

	openPanelMenu();
	expect(
		screen.getByRole("menuitem", { name: "studio.preparingWorkspace" }),
	).toHaveAttribute("aria-disabled", "true");
	fireEvent.click(
		screen.getByRole("menuitem", { name: "workspacePlaces.settings" }),
	);
	expect(newRoomPanels.onOpenPanel).toHaveBeenLastCalledWith({
		kind: "settings",
	});
	closeMenus();

	rerender(
		<RoomActionsMenu
			room={room}
			newRoomPanels={{ ...newRoomPanels, isBusy: false }}
			isVertical
		/>,
	);
	for (const [name, kind] of [
		["workspacePlaces.files", "files"],
		["workspacePlaces.activity", "activity"],
	] as const) {
		openPanelMenu();
		fireEvent.click(screen.getByRole("menuitem", { name }));
		expect(newRoomPanels.onOpenPanel).toHaveBeenLastCalledWith({ kind });
		closeMenus();
	}
	openPanelMenu();
	fireEvent.click(
		screen.getByRole("menuitem", { name: "connectors:services.onedrive" }),
	);
	expect(newRoomPanels.onOpenPanel).toHaveBeenLastCalledWith({
		kind: "connector",
		service: "onedrive",
	});
});

test("More actions has no Close Workspace; the header toggle closes it", () => {
	const room = createRoom();
	room.openSidebar();
	render(<RoomActionsMenu room={room} isVertical />);
	expect(openMore()).not.toContain("studio.closeWorkspace");
});
