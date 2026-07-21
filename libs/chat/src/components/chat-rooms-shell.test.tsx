import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ChatRoomsShell } from "./chat-rooms-shell";

const { useChatRoomsContext, ChatRoomsProvider, context } = vi.hoisted(() => {
	const context = {
		pinnedRooms: [],
		rooms: [],
		search: "",
		setSearch: vi.fn(),
		isLoading: false,
		isLoadingMore: false,
		hasMore: false,
		loadMore: vi.fn(),
		renameRoom: vi.fn(),
		pinRoom: vi.fn(),
		deleteRoom: vi.fn(),
		activeRoomId: null as string | null,
		setActiveRoom: vi.fn(),
		newChat: vi.fn(),
	};
	return {
		context,
		useChatRoomsContext: vi.fn(() => context),
		ChatRoomsProvider: ({ children }: { children: ReactNode }) => (
			<div data-testid="mock-chat-rooms-provider">{children}</div>
		),
	};
});

vi.mock("../chat-rooms-provider", () => ({
	useChatRoomsContext,
	ChatRoomsProvider,
}));

vi.mock("./chat-panel", () => ({
	ChatPanel: () => <div data-testid="chat-panel" />,
}));

vi.mock("./room-sidebar", () => ({
	RoomSidebar: ({
		onAllChats,
		onSelectRoom,
		onNewChat,
	}: {
		onAllChats: () => void;
		onSelectRoom: (roomId: string) => void;
		onNewChat: () => void;
	}) => (
		<div data-testid="room-sidebar">
			<button type="button" onClick={onAllChats}>
				All Chats
			</button>
			<button type="button" onClick={() => onSelectRoom("room-1")}>
				Select Room
			</button>
			<button type="button" onClick={onNewChat}>
				New Chat
			</button>
		</div>
	),
}));

vi.mock("./chat-rooms-page", () => ({
	ChatRoomsPage: ({
		onSelectRoom,
		onNewChat,
	}: {
		onSelectRoom: (roomId: string) => void;
		onNewChat: () => void;
	}) => (
		<div data-testid="chat-rooms-page">
			<button type="button" onClick={() => onSelectRoom("room-2")}>
				Select From All Chats
			</button>
			<button type="button" onClick={onNewChat}>
				New Chat From All Chats
			</button>
		</div>
	),
}));

describe("ChatRoomsShell", () => {
	it("renders chat view by default", () => {
		render(<ChatRoomsShell engineId="engine-1" />);

		expect(screen.getByTestId("room-sidebar")).toBeInTheDocument();
		expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
		expect(screen.queryByTestId("chat-rooms-page")).not.toBeInTheDocument();
	});

	it("switches to all chats view when All Chats is clicked", async () => {
		const user = userEvent.setup();
		render(<ChatRoomsShell engineId="engine-1" />);

		await user.click(screen.getByRole("button", { name: "All Chats" }));

		expect(screen.getByTestId("chat-rooms-page")).toBeInTheDocument();
		expect(screen.queryByTestId("room-sidebar")).not.toBeInTheDocument();
		expect(screen.queryByTestId("chat-panel")).not.toBeInTheDocument();
	});

	it("returns to chat view when selecting a room from all chats", async () => {
		const user = userEvent.setup();
		render(<ChatRoomsShell engineId="engine-1" />);

		await user.click(screen.getByRole("button", { name: "All Chats" }));
		await user.click(
			screen.getByRole("button", { name: "Select From All Chats" }),
		);

		expect(context.setActiveRoom).toHaveBeenCalledWith("room-2");
		expect(screen.getByTestId("room-sidebar")).toBeInTheDocument();
		expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
	});

	it("calls onAllChats callback when switching views", async () => {
		const user = userEvent.setup();
		const onAllChats = vi.fn();
		render(<ChatRoomsShell engineId="engine-1" onAllChats={onAllChats} />);

		await user.click(screen.getByRole("button", { name: "All Chats" }));

		expect(onAllChats).toHaveBeenCalled();
	});
});
