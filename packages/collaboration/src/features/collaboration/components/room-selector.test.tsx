import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { RoomSelector } from "./room-selector";

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

beforeAll(() => {
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.setPointerCapture = () => undefined;
	HTMLElement.prototype.releasePointerCapture = () => undefined;
});

const twoRooms = [
	{
		id: "room-1",
		title: "Morning standup",
		lastActivity: "2026-11-11T08:00:00Z",
	},
	{ id: "room-2", title: "Q4 review", lastActivity: "2026-11-10T14:00:00Z" },
];

it("renders nothing when rooms is empty", () => {
	const { container } = render(
		<RoomSelector rooms={[]} onRoomSelect={vi.fn()} />,
	);
	expect(container).toBeEmptyDOMElement();
});

it("lists every room by name in the dropdown", async () => {
	const user = userEvent.setup();
	render(<RoomSelector rooms={twoRooms} onRoomSelect={vi.fn()} />);
	await user.click(screen.getByRole("button", { name: /switch to chat/i }));
	expect(
		await screen.findByRole("menuitem", { name: /morning standup/i }),
	).toBeInTheDocument();
	expect(
		screen.getByRole("menuitem", { name: /q4 review/i }),
	).toBeInTheDocument();
});

it("calls onRoomSelect with the room id when a room is selected", async () => {
	const user = userEvent.setup();
	const onRoomSelect = vi.fn();
	render(<RoomSelector rooms={twoRooms} onRoomSelect={onRoomSelect} />);
	await user.click(screen.getByRole("button", { name: /switch to chat/i }));
	await user.click(
		await screen.findByRole("menuitem", { name: /q4 review/i }),
	);
	expect(onRoomSelect).toHaveBeenCalledWith("room-2");
});

it("shows no timestamp text when lastActivity is empty", async () => {
	const user = userEvent.setup();
	render(
		<RoomSelector
			rooms={[
				{ id: "room-1", title: "No activity room", lastActivity: "" },
			]}
			onRoomSelect={vi.fn()}
		/>,
	);
	await user.click(screen.getByRole("button", { name: /switch to chat/i }));
	const item = await screen.findByRole("menuitem", {
		name: /no activity room/i,
	});
	expect(item).not.toHaveTextContent("Invalid Date");
	expect(item).not.toHaveTextContent("NaN");
});

it("falls back to Chat N when a room has no title", async () => {
	const user = userEvent.setup();
	render(
		<RoomSelector
			rooms={[{ id: "room-1", lastActivity: "" }]}
			onRoomSelect={vi.fn()}
		/>,
	);
	await user.click(screen.getByRole("button", { name: /switch to chat/i }));
	expect(
		await screen.findByRole("menuitem", { name: "Chat 1" }),
	).toBeInTheDocument();
});

it("uses the custom label on the trigger button", () => {
	render(
		<RoomSelector
			rooms={twoRooms}
			onRoomSelect={vi.fn()}
			label="View earlier chats"
		/>,
	);
	expect(
		screen.getByRole("button", { name: /view earlier chats/i }),
	).toBeInTheDocument();
});
