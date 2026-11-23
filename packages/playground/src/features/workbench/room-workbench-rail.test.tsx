import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { runInAction } from "mobx";
import type { ReactElement } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import { ROOM_PANEL_COMPONENTS } from "@/components/room/panels/room-panel.components";
import { RoomActionsProvider } from "@/features/room-actions/room-actions.context";
import { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";
import { RootStore } from "@/stores/root/root.store";
import { RoomWorkbenchRail } from "./room-workbench-rail";
import type { NewRoomWorkbenchPanels } from "./use-workbench-panels";

const mocks = vi.hoisted(() => ({
	navigate: vi.fn(),
	pinRoom: vi.fn(),
	closeRoom: vi.fn(),
	addWorkspace: vi.fn(),
	pinned: [] as { ROOM_ID: string }[],
}));

vi.mock("@/features/settings/settings-dialog.context", () => ({
	useSettingsDialog: () => ({ openSettings: vi.fn() }),
}));
vi.mock("react-router", () => ({ useNavigate: () => mocks.navigate }));
// the cog's actions read the favorites and act on the chat store; the room
// itself still needs the real SDK module around them
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	usePixel: () => ({ data: mocks.pinned, refresh: vi.fn() }),
}));
vi.mock("@/hooks/use-chat", () => ({
	useChat: () => ({
		chat: {
			keys: { roomCounter: 0 },
			pinRoom: mocks.pinRoom,
			closeRoom: mocks.closeRoom,
			addWorkspace: mocks.addWorkspace,
		},
	}),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	getI18n: () => ({ t: (key: string) => key }),
}));

// a desktop window: the rail's icons are the compact size
beforeEach(() => {
	for (const mock of [mocks.navigate, mocks.pinRoom, mocks.closeRoom])
		mock.mockReset();
	mocks.addWorkspace.mockReset().mockResolvedValue("saved-agent");
	mocks.pinned = [];
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

/**
 * Build a room with OneDrive switched on, without network-backed loading. The
 * real blueprints are load-bearing: without them the dock dedupes on a shallow
 * compare of config, and a file panel's `mode` is a fresh object per call, so
 * every click would spawn another tab.
 */
function createRoom(): RoomStore {
	const room = new RoomStore({
		theme: new RootStore().theme,
		roomId: "panel-rail",
		panelComponents: ROOM_PANEL_COMPONENTS,
	});
	runInAction(() => {
		room.connectors.services = ["onedrive"];
	});
	return room;
}

/** The types open in the Workspace's main area, in order. */
const mainPanelTypes = (room: RoomStore) => {
	const { panels, tabsets } = room.workbench.getState().layout;
	return tabsets
		.flatMap((tabset) => tabset.panelIds)
		.map((pid) => panels[pid]?.type);
};

/** The rail inside the room's shared actions, which is what gives it its cog. */
function withActions(room: RoomStore, rail: ReactElement) {
	return <RoomActionsProvider room={room}>{rail}</RoomActionsProvider>;
}

/** Open the cog at the head of the rail. */
async function openCog(user: ReturnType<typeof userEvent.setup>) {
	await user.click(
		screen.getByRole("button", { name: "sidebar:actions.roomActions" }),
	);
}

// a rail with no `RoomActionsProvider` has no cog — as a new chat's has none
test("the rail lists every panel the room can open, and nothing else", () => {
	render(<RoomWorkbenchRail room={createRoom()} side="right" />);

	expect(
		screen.getAllByRole("button").map((b) => b.getAttribute("aria-label")),
	).toEqual([
		"workspacePlaces.files",
		"workspacePlaces.settings",
		"workspacePlaces.activity",
		"connectors:services.onedrive",
	]);
});

test("a panel selects its open tab and adds one when it is not open", () => {
	const room = createRoom();
	render(<RoomWorkbenchRail room={room} side="right" />);
	const [files, settings] = room.workbench
		.getState()
		.layout.tabsets.flatMap((tabset) => tabset.panelIds);

	// Settings is already a tab: select it, do not add a second
	fireEvent.click(
		screen.getByRole("button", { name: "workspacePlaces.settings" }),
	);
	expect(room.workbench.getState().layout.selection.panel).toBe(settings);
	expect(mainPanelTypes(room)).toEqual([
		FILE_PANEL_TYPES.FILE_EXPLORER,
		ROOM_PANEL_TYPES.CONFIGURATION,
	]);

	// the activity log is not open: it joins the main area
	fireEvent.click(
		screen.getByRole("button", { name: "workspacePlaces.activity" }),
	);
	expect(mainPanelTypes(room)).toEqual([
		FILE_PANEL_TYPES.FILE_EXPLORER,
		ROOM_PANEL_TYPES.CONFIGURATION,
		ROOM_PANEL_TYPES.AUDIT_LOG,
	]);
	const log = room.workbench.getState().layout.selection.panel;

	// and clicking it again re-selects that tab rather than adding another
	fireEvent.click(
		screen.getByRole("button", { name: "workspacePlaces.files" }),
	);
	expect(room.workbench.getState().layout.selection.panel).toBe(files);
	fireEvent.click(
		screen.getByRole("button", { name: "workspacePlaces.activity" }),
	);
	expect(room.workbench.getState().layout.selection.panel).toBe(log);
	expect(mainPanelTypes(room)).toHaveLength(3);
});

test("a panel drags onto the dock, except in a new chat, which prepares first", () => {
	const room = createRoom();
	const { rerender } = render(<RoomWorkbenchRail room={room} side="right" />);
	const activity = screen.getByRole("button", {
		name: "workspacePlaces.activity",
	});
	expect(activity).toHaveAttribute("draggable", "true");

	const data = new Map<string, string>();
	const dataTransfer = {
		effectAllowed: "none",
		setData: (type: string, value: string) => data.set(type, value),
		getData: (type: string) => data.get(type) ?? "",
		types: [] as string[],
	};
	fireEvent.dragStart(activity, { dataTransfer });

	// the dock reads this spec off the drop and spawns the panel it names
	expect(dataTransfer.effectAllowed).toBe("copy");
	expect([...data.keys()]).toEqual(["application/x-semoss-workbench-panel"]);
	expect(
		JSON.parse(data.get("application/x-semoss-workbench-panel") ?? ""),
	).toEqual({
		type: ROOM_PANEL_TYPES.AUDIT_LOG,
		config: {},
		name: "workspacePlaces.activity",
	});

	// a draft has no insight for a dropped panel to read, so it cannot drag
	rerender(
		<RoomWorkbenchRail
			room={room}
			newRoomPanels={{
				onOpenPanel: vi.fn(),
				isBusy: false,
				connectors: room.connectors,
			}}
			side="right"
		/>,
	);
	for (const button of screen.getAllByRole("button")) {
		expect(button).not.toHaveAttribute("draggable", "true");
	}
});

test("a new chat's rail prepares its room, and waits while it does", () => {
	const room = createRoom();
	const newRoomPanels: NewRoomWorkbenchPanels = {
		onOpenPanel: vi.fn(),
		isBusy: true,
		connectors: room.connectors,
	};
	const { rerender } = render(
		<RoomWorkbenchRail
			room={room}
			newRoomPanels={newRoomPanels}
			side="right"
		/>,
	);

	// Files needs the room's insight, so it waits; Settings does not
	expect(
		screen.getAllByRole("button", { name: "studio.preparingWorkspace" })[0],
	).toBeDisabled();
	fireEvent.click(
		screen.getByRole("button", { name: "workspacePlaces.settings" }),
	);
	expect(newRoomPanels.onOpenPanel).toHaveBeenLastCalledWith({
		kind: "settings",
	});

	rerender(
		<RoomWorkbenchRail
			room={room}
			newRoomPanels={{ ...newRoomPanels, isBusy: false }}
			side="right"
		/>,
	);
	fireEvent.click(
		screen.getByRole("button", { name: "workspacePlaces.files" }),
	);
	expect(newRoomPanels.onOpenPanel).toHaveBeenLastCalledWith({
		kind: "files",
	});
});

test("the cog leads the rail and lists the room's actions, with no Rename", async () => {
	const user = userEvent.setup();
	const room = createRoom();
	render(withActions(room, <RoomWorkbenchRail room={room} side="right" />));

	expect(screen.getAllByRole("button")[0]?.getAttribute("aria-label")).toBe(
		"sidebar:actions.roomActions",
	);
	await openCog(user);
	expect(
		screen.getAllByRole("menuitem").map((item) => item.textContent),
	).toEqual([
		"sidebar:actions.favorite",
		"room:workspace.publish",
		"sidebar:actions.download",
		"sidebar:actions.delete",
	]);
});

test("the cog favorites, and says unfavorite once the room is a favorite", async () => {
	const user = userEvent.setup();
	const room = createRoom();
	const { rerender } = render(
		withActions(room, <RoomWorkbenchRail room={room} side="right" />),
	);
	await openCog(user);
	await user.click(
		screen.getByRole("menuitem", { name: "sidebar:actions.favorite" }),
	);
	expect(mocks.pinRoom).toHaveBeenCalledWith("panel-rail", true);

	// the favorites read again once the pin lands; a fresh element re-renders
	mocks.pinned = [{ ROOM_ID: "panel-rail" }];
	rerender(withActions(room, <RoomWorkbenchRail room={room} side="right" />));
	await openCog(user);
	await user.click(
		screen.getByRole("menuitem", { name: "sidebar:actions.unfavorite" }),
	);
	expect(mocks.pinRoom).toHaveBeenCalledWith("panel-rail", false);
});

test("the cog's Delete removes the room and leaves its page", async () => {
	mocks.closeRoom.mockResolvedValue(undefined);
	const user = userEvent.setup();
	const room = createRoom();
	render(withActions(room, <RoomWorkbenchRail room={room} side="right" />));

	await openCog(user);
	await user.click(
		screen.getByRole("menuitem", { name: "sidebar:actions.delete" }),
	);

	expect(mocks.closeRoom).toHaveBeenCalledWith("panel-rail");
	await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/"));
});

test("the cog's Publish as Agent saves the room's instructions and tools", async () => {
	const user = userEvent.setup();
	const room = createRoom();
	room.setOptions({
		instructions: "Room instructions",
		mcp: [{ id: "tool-1", type: "PROJECT", name: "Tool" }],
	});
	render(withActions(room, <RoomWorkbenchRail room={room} side="right" />));

	await openCog(user);
	await user.click(
		screen.getByRole("menuitem", { name: "room:workspace.publish" }),
	);
	await user.type(
		await screen.findByLabelText("workspace.nameLabel"),
		"Published agent",
	);
	await user.click(
		screen.getByRole("button", { name: "workspace.publishButton" }),
	);

	await waitFor(() =>
		expect(mocks.addWorkspace).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Published agent",
				system_prompt: "Room instructions",
				mcp: [{ id: "tool-1", type: "PROJECT", name: "Tool" }],
			}),
		),
	);
});

test("the cog leaves out Favorite where the chat history is hidden", async () => {
	const user = userEvent.setup();
	const room = createRoom();
	runInAction(() => {
		room.theme.featureFlags = { hideChatHistory: true };
	});
	render(withActions(room, <RoomWorkbenchRail room={room} side="right" />));

	await openCog(user);
	expect(
		screen.queryByRole("menuitem", { name: "sidebar:actions.favorite" }),
	).toBeNull();
	expect(
		screen.getByRole("menuitem", { name: "room:workspace.publish" }),
	).toBeVisible();
});
