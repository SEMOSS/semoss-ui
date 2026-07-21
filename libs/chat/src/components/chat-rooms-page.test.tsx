import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RoomSummary } from "../types";
import { ChatRoomsPage } from "./chat-rooms-page";

const { useChatRoomsContext } = vi.hoisted(() => ({
	useChatRoomsContext: vi.fn(),
}));

vi.mock("../chat-rooms-provider", () => ({
	useChatRoomsContext,
}));

function room(overrides: Partial<RoomSummary> = {}): RoomSummary {
	return {
		roomId: "room-1",
		name: "Claim review",
		dateCreated: new Date("2026-07-20T12:00:00.000Z"),
		pinned: false,
		...overrides,
	};
}

function stubRoomsContext() {
	return {
		pinnedRooms: [],
		rooms: [],
		search: "",
		setSearch: vi.fn(),
		isLoading: false,
		isLoadingMore: false,
		hasMore: false,
		loadMore: vi.fn(),
		renameRoom: vi.fn().mockResolvedValue(undefined),
		pinRoom: vi.fn().mockResolvedValue(undefined),
		deleteRoom: vi.fn().mockResolvedValue(undefined),
		activeRoomId: null,
		setActiveRoom: vi.fn(),
		newChat: vi.fn(),
	};
}

describe("ChatRoomsPage", () => {
	it("renders title and search field", () => {
		useChatRoomsContext.mockReturnValue(stubRoomsContext());

		render(<ChatRoomsPage />);

		expect(screen.getByText("All Chats")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
	});

	it("selects a room row and calls callback", async () => {
		const user = userEvent.setup();
		const context = stubRoomsContext();
		const onSelectRoom = vi.fn();
		context.rooms = [room({ roomId: "r1", name: "Select me" })];
		useChatRoomsContext.mockReturnValue(context);

		render(<ChatRoomsPage onSelectRoom={onSelectRoom} />);

		await user.click(screen.getByRole("button", { name: "Select me" }));

		expect(context.setActiveRoom).toHaveBeenCalledWith("r1");
		expect(onSelectRoom).toHaveBeenCalledWith("r1");
	});

	it("supports inline rename", async () => {
		const user = userEvent.setup();
		const context = stubRoomsContext();
		context.rooms = [room({ roomId: "r1", name: "Old name" })];
		useChatRoomsContext.mockReturnValue(context);

		render(<ChatRoomsPage />);

		await user.click(
			screen.getByRole("button", { name: "Rename Old name" }),
		);
		const input = screen.getByDisplayValue("Old name");
		await user.clear(input);
		await user.type(input, "New name{Enter}");

		expect(context.renameRoom).toHaveBeenCalledWith("r1", "New name");
	});

	it("supports bulk delete from the selection toolbar", async () => {
		const user = userEvent.setup();
		const context = stubRoomsContext();
		context.rooms = [
			room({ roomId: "r1", name: "First" }),
			room({ roomId: "r2", name: "Second" }),
		];
		useChatRoomsContext.mockReturnValue(context);

		render(<ChatRoomsPage />);

		await user.click(screen.getByLabelText("Select chat First"));
		await user.click(screen.getByRole("button", { name: "Delete" }));
		const dialog = screen.getByRole("dialog");
		await user.click(
			within(dialog).getByRole("button", { name: "Delete" }),
		);

		expect(context.deleteRoom).toHaveBeenCalledWith("r1");
	});
});
