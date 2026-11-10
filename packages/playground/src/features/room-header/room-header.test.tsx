import { fireEvent, render, screen } from "@testing-library/react";
import { runInAction } from "mobx";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { RoomStore } from "@/stores/room/room.store";
import { RootStore } from "@/stores/root/root.store";
import { RoomHeader } from "./room-header";

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
		roomId: "header-controls",
		panelComponents: {},
	});
	runInAction(() => {
		room.connectors.services = ["onedrive"];
	});
	return room;
}

/** The header's own icons, in order. */
function getIconNames(): string[] {
	return screen
		.getAllByRole("button")
		.map((button) => button.getAttribute("aria-label") ?? "");
}

test("outside a room the header has no title, and no navigation outside the app layout", () => {
	render(<RoomHeader room={createRoom()} />);
	expect(screen.getByRole("banner")).toBeVisible();
	expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
	expect(
		screen.queryByRole("button", { name: "actions.openNavigation" }),
	).toBeNull();
});

test("the header holds only the Workspace toggle; More actions is on the rail", () => {
	render(<RoomHeader room={createRoom()} />);
	expect(getIconNames()).toEqual(["studio.openWorkspace"]);
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
