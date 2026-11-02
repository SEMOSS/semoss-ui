import { fireEvent, render, screen, within } from "@testing-library/react";
import { runInAction } from "mobx";
import { expect, test, vi } from "vitest";
import { RoomStore } from "@/stores/room/room.store";
import { RootStore } from "@/stores/root/root.store";
import type { DraftWorkspacePlaces } from "./use-workspace-places";
import { WorkspaceRail } from "./workspace-rail";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	getI18n: () => ({ t: (key: string) => key }),
}));

/** Build a room with OneDrive switched on, without network-backed loading. */
function createRoom(): RoomStore {
	const room = new RoomStore({
		theme: new RootStore().theme,
		roomId: "rail",
		panelComponents: {},
	});
	runInAction(() => {
		room.connectors.services = ["onedrive"];
	});
	return room;
}

/** The rail's place names, in order. */
function getPlaceNames(): string[] {
	const rail = screen.getByRole("navigation", { name: "studio.workArea" });
	return within(rail)
		.getAllByRole("button")
		.map((button) => button.getAttribute("aria-label") ?? "");
}

test("lists the room's places, then the connector viewers the chat can show", () => {
	render(<WorkspaceRail room={createRoom()} />);

	expect(getPlaceNames()).toEqual([
		"workspacePlaces.files",
		"workspacePlaces.tools",
		"workspacePlaces.activity",
		"workspacePlaces.settings",
		"connectors:services.onedrive",
	]);
});

test("a place opens the Workspace on it, and closes the Workspace while in front", () => {
	const room = createRoom();
	render(<WorkspaceRail room={room} />);
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

test("a draft has no Chat Tools, waits while preparing, and uses its own actions", () => {
	const room = createRoom();
	const draft: DraftWorkspacePlaces = {
		onOpenFiles: vi.fn(),
		onOpenSettings: vi.fn(),
		onOpenSource: vi.fn(),
		isPreparing: true,
		connectors: room.connectors,
	};
	const { rerender } = render(<WorkspaceRail room={room} draft={draft} />);

	expect(getPlaceNames()).toEqual([
		"workspacePlaces.files",
		"workspacePlaces.settings",
		"connectors:services.onedrive",
	]);
	const files = screen.getByRole("button", { name: "workspacePlaces.files" });
	expect(files).toBeDisabled();
	expect(files).toHaveAttribute("aria-busy", "true");
	fireEvent.click(
		screen.getByRole("button", { name: "workspacePlaces.settings" }),
	);
	expect(draft.onOpenSettings).toHaveBeenCalledTimes(1);

	const prepared = { ...draft, isPreparing: false, onOpenActivity: vi.fn() };
	rerender(<WorkspaceRail room={room} draft={prepared} />);
	expect(getPlaceNames()).toContain("workspacePlaces.activity");
	fireEvent.click(
		screen.getByRole("button", { name: "workspacePlaces.files" }),
	);
	fireEvent.click(
		screen.getByRole("button", { name: "connectors:services.onedrive" }),
	);
	expect(prepared.onOpenFiles).toHaveBeenCalledTimes(1);
	expect(prepared.onOpenSource).toHaveBeenCalledWith("onedrive");
});
