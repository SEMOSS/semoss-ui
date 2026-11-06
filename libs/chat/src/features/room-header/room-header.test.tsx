import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { createConnectorsIntegration } from "../../connectors/connectors-integration";
import { requireRoomConnectors } from "../../connectors/room-connectors";
import { CONNECTOR_PANEL_TYPES } from "../../connectors/sources/connector-sources";
import * as chatContext from "../../host/chat.context";
import { createTestHostConfig } from "../../testing/test-host-config";
import { ROOM_PANEL_TYPES } from "../workbench/room-sidebar";
import { RoomUiStore } from "../workbench/room-ui.store";
import type { NewRoomWorkbenchPanels } from "../workbench/use-workbench-panels";
import { RoomHeader } from "./room-header";

const openSettings = vi.hoisted(() => vi.fn());
vi.mock("../settings/use-open-settings", () => ({
	useOpenSettings: () => openSettings,
}));
// a host with Workspace panels
vi.mock("../../host/chat.context", () => ({
	useChat: () => ({ config: { panelComponents: {} } }),
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
function createRoom(): RoomUiStore {
	const room = new RoomUiStore({
		roomId: "header-controls",
		host: createTestHostConfig({
			integrations: [createConnectorsIntegration()],
		}),
	});
	requireRoomConnectors(room).services = ["onedrive"];
	return room;
}

/** The header's own icons, in order. */
function getIconNames(): string[] {
	return screen
		.getAllByRole("button")
		.map((button) => button.getAttribute("aria-label") ?? "");
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

test("outside a room the header has no title, and no navigation outside the app layout", () => {
	render(<RoomHeader room={createRoom()} />);
	expect(screen.getByRole("banner")).toBeVisible();
	expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
	expect(
		screen.queryByRole("button", { name: "actions.openNavigation" }),
	).toBeNull();
});

test("the header shows More actions and the Workspace toggle, with no quick icons", () => {
	render(<RoomHeader room={createRoom()} />);

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

test("Open a Panel lists every panel and opens the Workspace on it", () => {
	const room = createRoom();
	render(<RoomHeader room={room} />);

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
	render(<RoomHeader room={room} />);
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

test("a new room waits while preparing and uses its own panel actions", () => {
	const room = createRoom();
	const newRoomPanels: NewRoomWorkbenchPanels = {
		onOpenPanel: vi.fn(),
		isBusy: true,
		draft: room,
	};
	const { rerender } = render(
		<RoomHeader room={room} newRoomPanels={newRoomPanels} />,
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
		<RoomHeader
			room={room}
			newRoomPanels={{ ...newRoomPanels, isBusy: false }}
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
		kind: "integration",
		type: CONNECTOR_PANEL_TYPES.ONEDRIVE,
		name: "connectors:services.onedrive",
	});
});

test("while the Workspace is open, More actions lists Close Workspace", () => {
	const room = createRoom();
	render(<RoomHeader room={room} />);
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

test("a host without Workspace panels gets no Workspace toggle or panel menu", () => {
	vi.spyOn(chatContext, "useChat").mockReturnValue({
		config: createTestHostConfig(),
	} as ReturnType<typeof chatContext.useChat>);
	render(<RoomHeader room={createRoom()} />);
	expect(
		screen.queryByRole("button", { name: "studio.openWorkspace" }),
	).toBeNull();
	const items = openMore();
	expect(items.length).toBeGreaterThan(0);
	expect(items).not.toContain("workspacePlaces.openPanel");
});
