import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Env } from "@semoss/sdk/react";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { listRoomTree } from "@/features/room-tree/api/list-room-tree";
import { roomTreeActivityStorageKey } from "@/features/room-tree/room-tree-activity";
import { roomPath } from "@/lib/workspace-paths";
import { useDashboard } from "./dashboard.context";
import { DashboardProvider } from "./dashboard-provider";

const mocks = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock("@/features/room-tree/api/list-room-tree", () => ({
	listRoomTree: vi.fn(),
}));
vi.mock("@/features/attention/attention-provider", () => ({
	AttentionProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({
		actions: { run: mocks.run },
		insightId: "insight-one",
	}),
}));
vi.mock("./use-chat-history", () => ({
	useChatHistory: () => ({ rooms: [] }),
}));
vi.mock("./use-dashboard-layout", () => ({ useDashboardLayout: () => ({}) }));
vi.mock("./use-visible-resource", () => ({
	useVisibleResource: () => ({ data: [], refresh: vi.fn() }),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
	localStorage.clear();
});

function SavedRoom() {
	const { openRoom } = useDashboard();
	return (
		<button type="button" onClick={() => void openRoom("saved/room")}>
			Open saved conversation
		</button>
	);
}

it("opens the actual saved room directly without recovering a source thread", async () => {
	const initialState = createInitialCollaborationState();
	const savedAt = "2026-10-08T12:00:00.000Z";
	const activityStorageKey = roomTreeActivityStorageKey(
		initialState.profile.email || initialState.profile.id,
		`${window.location.origin}${Env.MODULE}${window.location.pathname}`,
	);
	localStorage.setItem(
		activityStorageKey,
		JSON.stringify({ "saved/room": savedAt }),
	);
	vi.mocked(listRoomTree).mockResolvedValue({
		rooms: [],
	});
	const router = createMemoryRouter([
		{
			Component: () => (
				<CollaborationSessionProvider initialState={initialState}>
					<DashboardProvider>
						<Outlet />
					</DashboardProvider>
				</CollaborationSessionProvider>
			),
			children: [
				{ path: "/", Component: SavedRoom },
				{ path: "/thread/:threadId", element: <p>Saved room</p> },
			],
		},
	]);
	render(<RouterProvider router={router} />);
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Open saved conversation" }));
	await waitFor(() =>
		expect(router.state.location.pathname).toBe(roomPath("saved/room")),
	);
	expect(router.state.location.state).toBeNull();
	// The shell reads grouped history once; opening a saved room needs no source lookup.
	expect(listRoomTree).toHaveBeenCalledOnce();
	expect(vi.mocked(listRoomTree).mock.calls[0]?.[1]?.get("saved/room")).toBe(
		savedAt,
	);
	expect(mocks.run).not.toHaveBeenCalled();
	expect(screen.getByText("Saved room")).toBeVisible();
});
