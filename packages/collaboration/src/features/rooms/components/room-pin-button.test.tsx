import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import { RoomTreeContext } from "@/features/room-tree/room-tree.context";
import type { RoomTreeState } from "@/features/room-tree/room-tree.types";
import { ROOM_HISTORY_CHANGED } from "../api/list-rooms";
import { pinRoom } from "../api/pin-room";
import { RoomPinButton } from "./room-pin-button";

vi.mock("../api/pin-room", () => ({ pinRoom: vi.fn() }));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: {}, insightId: "account-one" }),
}));
vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	toast: { error: vi.fn() },
}));

const tree: RoomTreeState = {
	rooms: [],
	pinnedRoomIds: ["older-pin"],
	pinsComplete: true,
	hasMore: false,
	isLoading: false,
	error: "",
	refresh: vi.fn(),
	retry: vi.fn(),
	loadMore: vi.fn(),
	scrollTop: { current: 0 },
};

beforeEach(() => {
	vi.resetAllMocks();
});

it("recognizes a pin outside the visible sidebar page", () => {
	render(
		<RoomTreeContext.Provider value={tree}>
			<RoomPinButton roomId="older-pin" roomName="Older room" />
		</RoomTreeContext.Provider>,
	);
	expect(
		screen.getByRole("button", { name: "Unpin room: Older room" }),
	).toHaveAttribute("aria-pressed", "true");
});

it("publishes only confirmed changes without changing room activity", async () => {
	let finish: (() => void) | undefined;
	vi.mocked(pinRoom).mockImplementationOnce(
		() =>
			new Promise<void>((resolve) => {
				finish = resolve;
			}),
	);
	const events: unknown[] = [];
	const observe = (event: Event) => {
		if (event instanceof CustomEvent) events.push(event.detail);
	};
	window.addEventListener(ROOM_HISTORY_CHANGED, observe);
	try {
		render(
			<RoomTreeContext.Provider value={tree}>
				<RoomPinButton roomId="new-pin" roomName="New room" />
			</RoomTreeContext.Provider>,
		);
		const user = userEvent.setup();
		const button = screen.getByRole("button", {
			name: "Pin room: New room",
		});
		await user.click(button);
		expect(button).toBeDisabled();
		expect(events).toEqual([]);
		await act(async () => finish?.());
		expect(events).toEqual([
			{
				scope: "account-one",
				roomId: "new-pin",
				roomName: "New room",
				pinned: true,
			},
		]);
		expect(button).not.toBeDisabled();
	} finally {
		window.removeEventListener(ROOM_HISTORY_CHANGED, observe);
	}
});

it("keeps the original pin state after failure and permits retry", async () => {
	vi.mocked(pinRoom).mockRejectedValueOnce(new Error("Offline"));
	render(
		<RoomTreeContext.Provider value={tree}>
			<RoomPinButton roomId="older-pin" roomName="Older room" />
		</RoomTreeContext.Provider>,
	);
	const button = screen.getByRole("button", {
		name: "Unpin room: Older room",
	});
	await userEvent.setup().click(button);
	await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Offline"));
	expect(button).toHaveAttribute("aria-pressed", "true");
	expect(button).not.toBeDisabled();
});
