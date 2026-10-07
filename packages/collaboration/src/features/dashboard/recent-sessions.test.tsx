import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RoomRow } from "@/features/rooms/api/room-schemas";
import { RecentSessions } from "./recent-sessions";

const dashboard = vi.hoisted(() => ({
	openRoom: vi.fn(),
	openingRoom: null as string | null,
	history: {
		rooms: [] as RoomRow[],
		isLoading: false,
		error: "",
		hasMore: false,
		loadMore: vi.fn(),
		retry: vi.fn(),
	},
}));

vi.mock("./dashboard.context", () => ({ useDashboard: () => dashboard }));

beforeEach(() => {
	vi.clearAllMocks();
	dashboard.openingRoom = null;
	dashboard.history.isLoading = false;
	dashboard.history.error = "";
	dashboard.history.hasMore = false;
	dashboard.history.rooms = Array.from({ length: 12 }, (_, index) => ({
		roomId: `room-${index}`,
		roomName: `Session ${index}`,
		dateUpdated: new Date(Date.UTC(2026, 9, 7, 12 - index)).toISOString(),
	}));
});
afterEach(cleanup);

it("shows the newest five with dates and progressively reveals loaded rooms", async () => {
	const user = userEvent.setup();
	// Server refreshes may retain older pages ahead of newer records.
	dashboard.history.rooms.reverse();
	render(<RecentSessions />);
	expect(screen.getAllByRole("listitem")).toHaveLength(5);
	expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Session 0");
	expect(
		screen.getAllByRole("listitem")[0].querySelector("time"),
	).toHaveAttribute("datetime", "2026-10-07T12:00:00.000Z");
	await user.click(
		screen.getByRole("button", { name: "Show more sessions" }),
	);
	expect(screen.getAllByRole("listitem")).toHaveLength(10);
	expect(dashboard.history.loadMore).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Session 9" }));
	expect(dashboard.openRoom).toHaveBeenCalledExactlyOnceWith("room-9");
});

it("requests another page only when the displayed saved rooms are exhausted", async () => {
	const user = userEvent.setup();
	dashboard.history.rooms = dashboard.history.rooms.slice(0, 5);
	dashboard.history.hasMore = true;
	const { rerender } = render(<RecentSessions />);
	await user.click(
		screen.getByRole("button", { name: "Show more sessions" }),
	);
	expect(dashboard.history.loadMore).toHaveBeenCalledOnce();
	dashboard.history.isLoading = true;
	rerender(<RecentSessions />);
	expect(
		screen.getByRole("button", { name: "Show more sessions" }),
	).toBeDisabled();
	expect(
		screen.getByRole("status", { name: "Loading recent sessions" }),
	).toBeVisible();
	expect(screen.getAllByRole("listitem")).toHaveLength(5);
});

it("retains existing sessions on failure and retries the failed history read", async () => {
	const user = userEvent.setup();
	dashboard.history.error = "Sessions could not be refreshed.";
	dashboard.openingRoom = "room-0";
	render(<RecentSessions />);
	expect(screen.getByRole("alert")).toHaveTextContent(
		dashboard.history.error,
	);
	expect(
		screen.getByRole("button", { name: "Opening Session 0" }),
	).toBeDisabled();
	expect(screen.getAllByRole("listitem")).toHaveLength(5);
	await user.click(
		screen.getByRole("button", { name: "Retry recent sessions" }),
	);
	expect(dashboard.history.retry).toHaveBeenCalledOnce();
	expect(
		screen.queryByText(/after your first message/),
	).not.toBeInTheDocument();
});

it("distinguishes an empty history from an unsuccessful read", () => {
	dashboard.history.rooms = [];
	dashboard.history.error = "Sessions are unavailable.";
	const { rerender } = render(<RecentSessions />);
	expect(
		screen.queryByText(/after your first message/),
	).not.toBeInTheDocument();
	dashboard.history.error = "";
	rerender(<RecentSessions />);
	expect(screen.getByText(/after your first message/)).toBeVisible();
});
