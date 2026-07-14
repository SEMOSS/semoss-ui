import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { RoomSummary } from "../types";
import { RoomSidebar } from "./room-sidebar";

function room(overrides: Partial<RoomSummary> = {}): RoomSummary {
	return {
		roomId: "room-1",
		name: "Claim question",
		dateCreated: new Date(),
		pinned: false,
		...overrides,
	};
}

function baseProps() {
	return {
		pinnedRooms: [],
		rooms: [],
		activeRoomId: null,
		search: "",
		onSearchChange: vi.fn(),
		onLoadMore: vi.fn(),
		onSelectRoom: vi.fn(),
		onNewChat: vi.fn(),
		onRenameRoom: vi.fn(),
		onPinRoom: vi.fn(),
		onDeleteRoom: vi.fn(),
	};
}

describe("RoomSidebar", () => {
	it("renders rooms grouped under Favorites and shows Untitled for an empty name", () => {
		render(
			<RoomSidebar
				{...baseProps()}
				pinnedRooms={[room({ roomId: "p1", name: "", pinned: true })]}
				rooms={[room({ roomId: "r1", name: "Today's chat" })]}
			/>,
		);

		expect(screen.getByText("Favorites")).toBeInTheDocument();
		expect(screen.getByText("Untitled")).toBeInTheDocument();
		expect(screen.getByText("Today's chat")).toBeInTheDocument();
	});

	it("excludes a pinned room from also appearing in its date bucket", () => {
		render(
			<RoomSidebar
				{...baseProps()}
				pinnedRooms={[
					room({ roomId: "r1", name: "Pinned one", pinned: true }),
				]}
				rooms={[
					room({ roomId: "r1", name: "Pinned one", pinned: true }),
				]}
			/>,
		);

		expect(screen.getAllByText("Pinned one")).toHaveLength(1);
	});

	it("calls onSearchChange as the user types", async () => {
		const user = userEvent.setup();
		const onSearchChange = vi.fn();
		render(
			<RoomSidebar {...baseProps()} onSearchChange={onSearchChange} />,
		);

		await user.type(screen.getByPlaceholderText("Search"), "c");

		expect(onSearchChange).toHaveBeenCalledWith("c");
	});

	it("calls onNewChat when New Chat is clicked", async () => {
		const user = userEvent.setup();
		const onNewChat = vi.fn();
		render(<RoomSidebar {...baseProps()} onNewChat={onNewChat} />);

		await user.click(screen.getByRole("button", { name: "New Chat" }));

		expect(onNewChat).toHaveBeenCalled();
	});

	it("calls onSelectRoom with the room's id when a row is clicked", async () => {
		const user = userEvent.setup();
		const onSelectRoom = vi.fn();
		render(
			<RoomSidebar
				{...baseProps()}
				rooms={[room({ roomId: "r1", name: "Pick me" })]}
				onSelectRoom={onSelectRoom}
			/>,
		);

		await user.click(screen.getByText("Pick me"));

		expect(onSelectRoom).toHaveBeenCalledWith("r1");
	});

	it("calls onPinRoom/onRenameRoom/onDeleteRoom from the kebab menu with the right roomId", async () => {
		const user = userEvent.setup();
		const onPinRoom = vi.fn();
		const onDeleteRoom = vi.fn();
		render(
			<RoomSidebar
				{...baseProps()}
				rooms={[room({ roomId: "r1", name: "Target room" })]}
				onPinRoom={onPinRoom}
				onDeleteRoom={onDeleteRoom}
			/>,
		);

		await user.click(
			screen.getByRole("button", {
				name: "More actions for Target room",
			}),
		);
		await user.click(screen.getByRole("menuitem", { name: "Favorite" }));
		expect(onPinRoom).toHaveBeenCalledWith("r1", true);

		await user.click(
			screen.getByRole("button", {
				name: "More actions for Target room",
			}),
		);
		await user.click(screen.getByRole("menuitem", { name: "Delete" }));
		expect(onDeleteRoom).toHaveBeenCalledWith("r1");
	});

	it("commits an inline rename on Enter", async () => {
		const user = userEvent.setup();
		const onRenameRoom = vi.fn();
		render(
			<RoomSidebar
				{...baseProps()}
				rooms={[room({ roomId: "r1", name: "Old name" })]}
				onRenameRoom={onRenameRoom}
			/>,
		);

		await user.click(
			screen.getByRole("button", {
				name: "More actions for Old name",
			}),
		);
		await user.click(screen.getByRole("menuitem", { name: "Rename" }));

		const input = screen.getByDisplayValue("Old name");
		await user.clear(input);
		await user.type(input, "New name{Enter}");

		expect(onRenameRoom).toHaveBeenCalledWith("r1", "New name");
	});

	it("cancels an inline rename on Escape without calling onRenameRoom", async () => {
		const user = userEvent.setup();
		const onRenameRoom = vi.fn();
		render(
			<RoomSidebar
				{...baseProps()}
				rooms={[room({ roomId: "r1", name: "Old name" })]}
				onRenameRoom={onRenameRoom}
			/>,
		);

		await user.click(
			screen.getByRole("button", {
				name: "More actions for Old name",
			}),
		);
		await user.click(screen.getByRole("menuitem", { name: "Rename" }));
		await user.keyboard("{Escape}");

		expect(onRenameRoom).not.toHaveBeenCalled();
		expect(screen.getByText("Old name")).toBeInTheDocument();
	});

	it("shows an empty state when there are no rooms and nothing is loading", () => {
		render(<RoomSidebar {...baseProps()} isLoading={false} />);

		expect(screen.getByText("No conversations found.")).toBeInTheDocument();
	});

	it("does not show the empty state while loading", () => {
		render(<RoomSidebar {...baseProps()} isLoading={true} />);

		expect(
			screen.queryByText("No conversations found."),
		).not.toBeInTheDocument();
	});
});
