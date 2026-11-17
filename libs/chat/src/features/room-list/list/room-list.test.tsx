import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SidebarProvider } from "@semoss/ui/next";
import { RoomList } from "./room-list";
import type { RoomListItem } from "./room-list-groups";

const mocks = vi.hoisted(() => ({
	openRoom: vi.fn(),
	onRoomDeleted: vi.fn(),
	closeRoom: vi.fn(),
	renameRoom: vi.fn(),
	pinRoom: vi.fn(),
	reset: vi.fn(),
	rooms: [] as RoomListItem[],
	// the fake chat store, so a test can bump its room counter
	chat: null as null | {
		keys: { roomCounter: number };
		notify: () => void;
	},
}));

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/sdk/react", () => ({
	useSessionIteratorPixel: () => ({
		data: mocks.rooms,
		isLoading: false,
		isError: false,
		hasMore: false,
		next: vi.fn(),
		reset: mocks.reset,
	}),
}));
vi.mock("../../chat/provider/use-chat-session", async () => {
	const { fakeStore } = await import("../../../test/fake-store");
	const chat = fakeStore({
		keys: { roomCounter: 0 },
		optimisticRooms: {},
		removeOptimisticRoom: vi.fn(),
		closeRoom: mocks.closeRoom,
		renameRoom: mocks.renameRoom,
		pinRoom: mocks.pinRoom,
	});
	mocks.chat = chat;
	return { useChatSession: () => ({ chat }) };
});
vi.mock("../../chat/config/use-chat-config", () => ({
	useChatConfig: () => ({
		theme: { featureFlags: {}, sidebar: { chatHistoryDate: false } },
		navigation: {
			openRoom: mocks.openRoom,
			roomHref: (roomId: string) => `#/room/${roomId}`,
			onRoomDeleted: mocks.onRoomDeleted,
		},
	}),
}));

beforeEach(() => {
	for (const mock of [
		mocks.openRoom,
		mocks.onRoomDeleted,
		mocks.closeRoom,
		mocks.renameRoom,
		mocks.pinRoom,
		mocks.reset,
	]) {
		mock.mockReset();
	}
	mocks.rooms = [
		{
			ROOM_ID: "room-1",
			ROOM_NAME: "Quarterly plan",
			DATE_CREATED: new Date().toISOString(),
		},
		{
			ROOM_ID: "room-2",
			ROOM_NAME: "Travel notes",
			DATE_CREATED: new Date().toISOString(),
		},
	];
	localStorage.clear();
	if (mocks.chat) mocks.chat.keys.roomCounter = 0;
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
 * The room list inside the sidebar it needs.
 *
 * @param activeRoomId - The room open now.
 * @param isVisible - Whether the list is on screen.
 * @returns The list.
 */
const roomList = (activeRoomId?: string, isVisible = true) => (
	<SidebarProvider>
		<RoomList
			isVisible={isVisible}
			activeRoomId={activeRoomId}
			onSearch={vi.fn()}
		/>
	</SidebarProvider>
);

/** Render the room list inside the sidebar it needs, with one room open. */
const renderRoomList = (activeRoomId?: string) =>
	render(roomList(activeRoomId));

test("each room links to its href and opens through the host", async () => {
	const user = userEvent.setup();
	renderRoomList();

	const link = screen.getByRole("link", { name: /Quarterly plan/ });
	expect(link).toHaveAttribute("href", "#/room/room-1");

	await user.click(link);
	expect(mocks.openRoom).toHaveBeenCalledWith("room-1");
});

test("a modified click is left to the browser", () => {
	renderRoomList();

	fireEvent.click(screen.getByRole("link", { name: /Travel notes/ }), {
		metaKey: true,
	});
	expect(mocks.openRoom).not.toHaveBeenCalled();
});

test("deleting the open room tells the host; another room does not", async () => {
	mocks.closeRoom.mockResolvedValue(undefined);
	const user = userEvent.setup();
	renderRoomList("room-1");

	const [openRoomMenu, otherRoomMenu] = screen.getAllByRole("button", {
		name: "actions.roomActions",
	});

	await user.click(otherRoomMenu);
	await user.click(screen.getByRole("menuitem", { name: "actions.delete" }));
	expect(mocks.closeRoom).toHaveBeenCalledWith("room-2");
	expect(mocks.onRoomDeleted).not.toHaveBeenCalled();

	await user.click(openRoomMenu);
	await user.click(screen.getByRole("menuitem", { name: "actions.delete" }));
	expect(mocks.onRoomDeleted).toHaveBeenCalledWith("room-1");
});

test("a double-click on a name, or F2 on its row, renames the room in place", async () => {
	mocks.renameRoom.mockResolvedValue(undefined);
	const user = userEvent.setup();
	renderRoomList();

	await user.dblClick(screen.getByText("Quarterly plan"));
	const field = screen.getByRole("textbox", { name: "header.renameLabel" });
	expect(field).toHaveFocus();
	await user.clear(field);
	await user.type(field, "Annual plan{Enter}");
	expect(mocks.renameRoom).toHaveBeenCalledWith("room-1", "Annual plan");
	await waitFor(() =>
		expect(
			screen.queryByRole("textbox", { name: "header.renameLabel" }),
		).toBeNull(),
	);

	// F2 on the other room's link starts its rename; Escape keeps its name
	fireEvent.keyDown(screen.getByRole("link", { name: /Travel notes/ }), {
		key: "F2",
	});
	const second = screen.getByRole("textbox", { name: "header.renameLabel" });
	expect(second).toHaveValue("Travel notes");
	fireEvent.keyDown(second, { key: "Escape" });
	expect(screen.getByRole("link", { name: /Travel notes/ })).toBeVisible();
	expect(mocks.renameRoom).toHaveBeenCalledTimes(1);
});

test("the menu favorites a room or takes it out, and opens on a right click", async () => {
	mocks.pinRoom.mockResolvedValue(undefined);
	mocks.rooms[1] = { ...mocks.rooms[1], PINNED: true };
	const user = userEvent.setup();
	renderRoomList();

	const [firstMenu] = screen.getAllByRole("button", {
		name: "actions.roomActions",
	});
	await user.click(firstMenu);
	await user.click(
		screen.getByRole("menuitem", { name: "actions.favorite" }),
	);
	expect(mocks.pinRoom).toHaveBeenCalledWith("room-1", true);

	// a right click on the favorite's row opens its own menu
	fireEvent.contextMenu(screen.getByRole("link", { name: /Travel notes/ }));
	const unfavorite = await screen.findByRole("menuitem", {
		name: "actions.unfavorite",
	});
	expect(screen.getAllByRole("menu")).toHaveLength(1);
	await user.click(unfavorite);
	expect(mocks.pinRoom).toHaveBeenLastCalledWith("room-2", false);
});

test("a room deleted here leaves the list at once, and comes back when the delete fails", async () => {
	let failDelete: (error: Error) => void = () => {};
	mocks.closeRoom.mockReturnValue(
		new Promise((_resolve, reject) => {
			failDelete = reject;
		}),
	);
	const user = userEvent.setup();
	renderRoomList();

	const [, secondMenu] = screen.getAllByRole("button", {
		name: "actions.roomActions",
	});
	await user.click(secondMenu);
	await user.click(screen.getByRole("menuitem", { name: "actions.delete" }));
	expect(screen.queryByRole("link", { name: /Travel notes/ })).toBeNull();

	await act(async () => failDelete(new Error("Not allowed")));
	expect(
		await screen.findByRole("link", { name: /Travel notes/ }),
	).toBeVisible();
	expect(mocks.reset).not.toHaveBeenCalled();
});

/**
 * The list's scrolling viewport, with a scroll position a test sets, since
 * jsdom lays nothing out.
 *
 * @param container - What the list rendered into.
 * @returns The viewport.
 */
const viewportOf = (container: HTMLElement) => {
	const viewport = container.querySelector<HTMLDivElement>(
		"[data-slot=scroll-area-viewport]",
	);
	if (!viewport) throw new Error("no viewport");
	let scrollTop = 0;
	Object.defineProperty(viewport, "scrollTop", {
		configurable: true,
		get: () => scrollTop,
		set: (value: number) => {
			scrollTop = value;
		},
	});
	return viewport;
};

test("the list goes back to where it was when it shows again", () => {
	// frames run at once
	vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
		callback(0);
		return 1;
	});
	const { container, rerender } = renderRoomList();
	const viewport = viewportOf(container);

	viewport.scrollTop = 300;
	fireEvent.scroll(viewport);
	rerender(roomList(undefined, false));
	// a closed sheet loses its place
	viewport.scrollTop = 0;
	rerender(roomList(undefined, true));
	expect(viewport.scrollTop).toBe(300);
});

test("a refetch starts the list at the top, and stays there when it shows again", () => {
	vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
		callback(0);
		return 1;
	});
	const { container, rerender } = renderRoomList();
	const viewport = viewportOf(container);
	// mounting neither refetches nor scrolls
	expect(mocks.reset).not.toHaveBeenCalled();

	viewport.scrollTop = 300;
	fireEvent.scroll(viewport);
	act(() => {
		if (!mocks.chat) throw new Error("no chat");
		mocks.chat.keys.roomCounter += 1;
		mocks.chat.notify();
	});
	expect(mocks.reset).toHaveBeenCalledTimes(1);
	expect(viewport.scrollTop).toBe(0);

	rerender(roomList(undefined, false));
	rerender(roomList(undefined, true));
	expect(viewport.scrollTop).toBe(0);
});
