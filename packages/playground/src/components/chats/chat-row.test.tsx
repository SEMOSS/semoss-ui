import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import { ChatRow, type RoomItem } from "./chat-row";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRenameRoom = vi.fn();

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en" },
	}),
}));

vi.mock("@/hooks", () => ({
	useChat: () => ({
		chat: {
			renameRoom: mockRenameRoom,
		},
	}),
}));

vi.mock("@/utility", () => ({
	normalizeTimestamp: () => ({
		isValid: () => true,
		fromNow: () => "2 hours ago",
		format: () => "Jul 14, 2026 3:00 PM",
	}),
}));

vi.mock("react-router-dom", () => ({
	Link: ({
		to,
		children,
		...props
	}: { to: string; children?: React.ReactNode } & Record<
		string,
		unknown
	>) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

vi.mock("@semoss/ui/next", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/ui/next")>();
	return {
		...actual,
		toast: {
			success: vi.fn(),
			error: vi.fn(),
		},
	};
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseRoom: RoomItem = {
	ROOM_ID: "room-1",
	ROOM_NAME: "Test Chat",
	DATE_CREATED: "2026-07-14 15:00:00",
};

const defaultProps = {
	room: baseRoom,
	isSelected: false,
	isPinned: false,
	onToggleSelect: vi.fn(),
	onTogglePin: vi.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ChatRow", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("renders room name and relative time", () => {
		render(<ChatRow {...defaultProps} />);
		expect(screen.getByText("Test Chat")).toBeInTheDocument();
		expect(screen.getByText("2 hours ago")).toBeInTheDocument();
	});

	test("renders a link to the room", () => {
		render(<ChatRow {...defaultProps} />);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/room/room-1");
	});

	test("calls onToggleSelect when checkbox area is clicked", async () => {
		render(<ChatRow {...defaultProps} />);
		const selectZone = screen.getByRole("button", {
			name: "workspace:chats.selectChat",
		});
		fireEvent.click(selectZone);
		expect(defaultProps.onToggleSelect).toHaveBeenCalledTimes(1);
	});

	test("calls onTogglePin when pin button is clicked", async () => {
		render(<ChatRow {...defaultProps} />);
		const pinBtn = screen.getByTestId("chats-page--pin-room-1");
		fireEvent.click(pinBtn);
		expect(defaultProps.onTogglePin).toHaveBeenCalledTimes(1);
	});

	test("shows unpin label when isPinned is true", () => {
		render(<ChatRow {...defaultProps} isPinned />);
		const pinBtn = screen.getByTestId("chats-page--pin-room-1");
		expect(pinBtn).toHaveAttribute("aria-label", "workspace:chat.unpin");
	});

	test("enters editing mode on rename click", async () => {
		render(<ChatRow {...defaultProps} />);
		const renameBtn = screen.getByTestId("chats-page--rename-room-1");
		fireEvent.click(renameBtn);
		// Should show the input with the room name
		const input = screen.getByDisplayValue("Test Chat");
		expect(input).toBeInTheDocument();
	});

	test("saves rename on Enter and shows success toast", async () => {
		mockRenameRoom.mockResolvedValueOnce(undefined);
		const user = userEvent.setup();

		render(<ChatRow {...defaultProps} />);
		fireEvent.click(screen.getByTestId("chats-page--rename-room-1"));

		const input = screen.getByDisplayValue("Test Chat");
		await user.clear(input);
		await user.type(input, "New Name{Enter}");

		await waitFor(() => {
			expect(mockRenameRoom).toHaveBeenCalledWith("room-1", "New Name");
		});
		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith(
				"workspace:chat.renameSuccess",
			);
		});
	});

	test("shows error toast when rename is empty", async () => {
		const user = userEvent.setup();

		render(<ChatRow {...defaultProps} />);
		fireEvent.click(screen.getByTestId("chats-page--rename-room-1"));

		const input = screen.getByDisplayValue("Test Chat");
		await user.clear(input);
		await user.type(input, "{Enter}");

		expect(toast.error).toHaveBeenCalledWith("workspace:chat.renameEmpty");
		expect(mockRenameRoom).not.toHaveBeenCalled();
	});

	test("shows error toast when renameRoom rejects", async () => {
		mockRenameRoom.mockRejectedValueOnce(new Error("fail"));
		const user = userEvent.setup();

		render(<ChatRow {...defaultProps} />);
		fireEvent.click(screen.getByTestId("chats-page--rename-room-1"));

		const input = screen.getByDisplayValue("Test Chat");
		await user.clear(input);
		await user.type(input, "Updated{Enter}");

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith(
				"workspace:chat.renameFailed",
			);
		});
	});

	test("cancels rename on Escape", async () => {
		const user = userEvent.setup();

		render(<ChatRow {...defaultProps} />);
		fireEvent.click(screen.getByTestId("chats-page--rename-room-1"));

		const input = screen.getByDisplayValue("Test Chat");
		await user.type(input, "{Escape}");

		// Should be back to normal view
		expect(screen.getByText("Test Chat")).toBeInTheDocument();
		expect(screen.queryByDisplayValue("Test Chat")).not.toBeInTheDocument();
	});

	test("cancels rename via cancel button", () => {
		render(<ChatRow {...defaultProps} />);
		fireEvent.click(screen.getByTestId("chats-page--rename-room-1"));

		const cancelBtn = screen.getByRole("button", {
			name: "workspace:chat.cancel",
		});
		fireEvent.click(cancelBtn);

		expect(screen.getByText("Test Chat")).toBeInTheDocument();
		expect(screen.queryByDisplayValue("Test Chat")).not.toBeInTheDocument();
	});

	test("applies selected styling when isSelected is true", () => {
		const { container } = render(<ChatRow {...defaultProps} isSelected />);
		const row = container.firstElementChild;
		expect(row?.className).toContain("border-primary");
	});
});
