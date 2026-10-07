import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { roomPath } from "@/lib/workspace-paths";
import { useDashboard } from "./dashboard.context";
import { DashboardProvider } from "./dashboard-provider";

const mocks = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions: { run: mocks.run } }),
}));
vi.mock("./use-chat-history", () => ({
	useChatHistory: () => ({ rooms: [] }),
}));
vi.mock("./use-dashboard-layout", () => ({ useDashboardLayout: () => ({}) }));
vi.mock("./use-visible-resource", () => ({
	useVisibleResource: () => ({ data: [], refresh: vi.fn() }),
}));

function SavedRoom() {
	const { openRoom } = useDashboard();
	return (
		<button type="button" onClick={() => void openRoom("saved/room")}>
			Open saved conversation
		</button>
	);
}

it("opens the actual saved room directly without recovering a source thread", async () => {
	const router = createMemoryRouter([
		{
			Component: () => (
				<CollaborationSessionProvider
					initialState={createInitialCollaborationState()}
				>
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
	expect(mocks.run).not.toHaveBeenCalled();
	expect(screen.getByText("Saved room")).toBeVisible();
});
