import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { SidebarProvider } from "@semoss/ui/next";
import { RoomHistory } from "./room-history";

// the list and the dialog test themselves; these stand in for them
vi.mock("./list/room-list", () => ({
	RoomList: ({
		isVisible,
		activeRoomId,
		onOpenSearch,
	}: {
		isVisible: boolean;
		activeRoomId?: string;
		onOpenSearch: () => void;
	}) => (
		<button type="button" onClick={onOpenSearch}>
			{`list ${isVisible ? "shown" : "hidden"} ${activeRoomId ?? ""}`}
		</button>
	),
}));
vi.mock("./search/room-history-search", () => ({
	RoomHistorySearch: ({ open }: { open: boolean }) =>
		open ? <div role="dialog" aria-label="search" /> : null,
}));

beforeEach(() => {
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	);
});

test("the list shows while the sidebar is open, and opens search from its button or the shortcut", () => {
	render(
		<SidebarProvider open={true} onOpenChange={vi.fn()}>
			<RoomHistory activeRoomId="room-1" />
		</SidebarProvider>,
	);
	const list = screen.getByRole("button", { name: "list shown room-1" });
	expect(screen.queryByRole("dialog")).toBeNull();

	fireEvent.click(list);
	expect(screen.getByRole("dialog", { name: "search" })).toBeInTheDocument();
});

test("Cmd+K opens search", () => {
	render(
		<SidebarProvider open={false} onOpenChange={vi.fn()}>
			<RoomHistory />
		</SidebarProvider>,
	);
	expect(screen.getByRole("button", { name: /list hidden/ })).toBeVisible();

	act(() => {
		fireEvent.keyDown(window, { key: "k", metaKey: true });
	});
	expect(screen.getByRole("dialog", { name: "search" })).toBeInTheDocument();
});
