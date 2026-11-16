import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SidebarProvider } from "@semoss/ui/next";
import { RoomList } from "./room-list";
import type { RoomListItem } from "./room-list-groups";

const mocks = vi.hoisted(() => ({
	openRoom: vi.fn(),
	onRoomDeleted: vi.fn(),
	closeRoom: vi.fn(),
	reset: vi.fn(),
	rooms: [] as RoomListItem[],
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
vi.mock("../chat/use-chat-session", async () => {
	const { fakeStore } = await import("../../test/fake-store");
	const chat = fakeStore({
		keys: { roomCounter: 0 },
		optimisticRooms: {},
		removeOptimisticRoom: vi.fn(),
		closeRoom: mocks.closeRoom,
	});
	return { useChatSession: () => ({ chat }) };
});
vi.mock("../chat-config/use-chat-config", () => ({
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

const renderSection = (activeRoomId?: string) =>
	render(
		<SidebarProvider>
			<RoomList
				isVisible
				activeRoomId={activeRoomId}
				onSearch={vi.fn()}
			/>
		</SidebarProvider>,
	);

test("each room links to its href and opens through the host", async () => {
	const user = userEvent.setup();
	renderSection();

	const link = screen.getByRole("link", { name: /Quarterly plan/ });
	expect(link).toHaveAttribute("href", "#/room/room-1");

	await user.click(link);
	expect(mocks.openRoom).toHaveBeenCalledWith("room-1");
});

test("a modified click is left to the browser", () => {
	renderSection();

	fireEvent.click(screen.getByRole("link", { name: /Travel notes/ }), {
		metaKey: true,
	});
	expect(mocks.openRoom).not.toHaveBeenCalled();
});

test("deleting the open room tells the host; another room does not", async () => {
	mocks.closeRoom.mockResolvedValue(undefined);
	const user = userEvent.setup();
	renderSection("room-1");

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
