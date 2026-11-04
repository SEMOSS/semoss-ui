import { fireEvent, render, screen, within } from "@testing-library/react";
import { runInAction } from "mobx";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { RoomStore } from "@/stores/room/room.store";
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

/** Open the More menu and list its places. */
function openMore(): string[] {
	fireEvent.keyDown(
		screen.getByRole("button", { name: "workspacePlaces.more" }),
		{ key: "Enter" },
	);
	return screen
		.getAllByRole("menuitem")
		.map((item) => item.textContent ?? "");
}

test("shows Files and Settings as icons, and the rest of the places under More", () => {
	render(<WorkspaceQuickActions room={createRoom()} />);

	expect(getIconNames()).toEqual([
		"workspacePlaces.files",
		"workspacePlaces.settings",
		"workspacePlaces.more",
	]);
	expect(openMore()).toEqual([
		"workspacePlaces.activity",
		"connectors:services.onedrive",
		"sidebar:settings.sections.connectors",
	]);
	fireEvent.click(
		screen.getByRole("menuitem", {
			name: "sidebar:settings.sections.connectors",
		}),
	);
	expect(openSettings).toHaveBeenCalledWith("connectors");
});

test("a place opens the Workspace on it, and closes the Workspace while in front", () => {
	const room = createRoom();
	render(<WorkspaceQuickActions room={room} />);
	const files = screen.getByRole("button", { name: "workspacePlaces.files" });
	const settings = screen.getByRole("button", {
		name: "workspacePlaces.settings",
	});

	fireEvent.click(files);
	expect(room.sidebar.isOpen).toBe(true);
	expect(files).toHaveAttribute("aria-pressed", "true");

	fireEvent.click(settings);
	expect(settings).toHaveAttribute("aria-pressed", "true");
	expect(files).toHaveAttribute("aria-pressed", "false");

	fireEvent.click(settings);
	expect(room.sidebar.isOpen).toBe(false);
	expect(settings).toHaveAttribute("aria-pressed", "false");
	expect(room.workbench.getState().layout.openPanelIds).toHaveLength(2);
});

test("a draft waits while preparing and uses its own actions", () => {
	const room = createRoom();
	const draft: DraftWorkspacePlaces = {
		onOpenFiles: vi.fn(),
		onOpenSettings: vi.fn(),
		onOpenActivity: vi.fn(),
		onOpenSource: vi.fn(),
		isPreparing: true,
		connectors: room.connectors,
	};
	const { rerender } = render(
		<WorkspaceQuickActions room={room} draft={draft} />,
	);

	const files = screen.getByRole("button", { name: "workspacePlaces.files" });
	expect(files).toBeDisabled();
	expect(files).toHaveAttribute("aria-busy", "true");
	fireEvent.click(
		screen.getByRole("button", { name: "workspacePlaces.settings" }),
	);
	expect(draft.onOpenSettings).toHaveBeenCalledTimes(1);

	rerender(
		<WorkspaceQuickActions
			room={room}
			draft={{ ...draft, isPreparing: false }}
		/>,
	);
	fireEvent.click(
		screen.getByRole("button", { name: "workspacePlaces.files" }),
	);
	expect(draft.onOpenFiles).toHaveBeenCalledTimes(1);
	openMore();
	fireEvent.click(
		screen.getByRole("menuitem", { name: "workspacePlaces.activity" }),
	);
	expect(draft.onOpenActivity).toHaveBeenCalledTimes(1);
	openMore();
	fireEvent.click(
		screen.getByRole("menuitem", { name: "connectors:services.onedrive" }),
	);
	expect(draft.onOpenSource).toHaveBeenCalledWith("onedrive");
});

test("while the Workspace is open, a close icon ends the row and Other lists Close Workspace", () => {
	const room = createRoom();
	render(<WorkspaceQuickActions room={room} />);
	expect(
		screen.queryByRole("button", { name: "studio.closeWorkspace" }),
	).toBeNull();
	expect(openMore()).not.toContain("studio.closeWorkspace");
	fireEvent.keyDown(document.activeElement ?? document.body, {
		key: "Escape",
	});

	fireEvent.click(
		screen.getByRole("button", { name: "workspacePlaces.files" }),
	);
	expect(getIconNames().at(-1)).toBe("studio.closeWorkspace");
	expect(openMore()).toContain("studio.closeWorkspace");
	fireEvent.click(
		screen.getByRole("menuitem", { name: "studio.closeWorkspace" }),
	);
	expect(room.sidebar.isOpen).toBe(false);

	fireEvent.click(
		screen.getByRole("button", { name: "workspacePlaces.files" }),
	);
	fireEvent.click(
		screen.getByRole("button", { name: "studio.closeWorkspace" }),
	);
	expect(room.sidebar.isOpen).toBe(false);
	expect(room.workbench.getState().layout.openPanelIds).toHaveLength(1);
});
