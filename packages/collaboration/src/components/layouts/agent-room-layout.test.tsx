import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import { AgentRoomLayout } from "./agent-room-layout";

const harness = vi.hoisted(() => ({
	setOpenMobile: vi.fn(),
	toggleSidebar: vi.fn(),
	openRoom: vi.fn(),
	sessions: [
		{
			id: "room-1",
			agentId: "agent-1",
			modelId: "model-2",
			title: "Planning",
			origin: "You",
			status: "Ready",
			updatedAt: "2026-09-22T12:00:00Z",
			unread: false,
			pinned: false,
			preview: "",
			thread: [],
		},
	],
}));

vi.mock("@semoss/ui/next", () => ({
	Sidebar: ({ children }: { children: React.ReactNode }) => (
		<aside>{children}</aside>
	),
	SidebarProvider: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SidebarRail: () => <div />,
	useSidebar: () => ({
		isMobile: true,
		setOpenMobile: harness.setOpenMobile,
		state: "expanded",
		toggleSidebar: harness.toggleSidebar,
	}),
}));
vi.mock("@/app/main.context", () => ({
	useMain: () => ({
		sessions: harness.sessions,
		openRoom: harness.openRoom,
	}),
}));
vi.mock("@/features/agents/components/agent-rooms-list", () => ({
	AgentRoomsList: ({ onNewRoom }: { onNewRoom: () => void }) => (
		<button type="button" onClick={onNewRoom}>
			New session
		</button>
	),
}));

const routes: RouteObject[] = [
	{
		path: "/agents/:agentId",
		Component: AgentRoomLayout,
		children: [
			{ path: "new/:draftId", element: <div>Draft</div> },
			{ path: ":roomId", element: <div>Room</div> },
		],
	},
];

describe("AgentRoomLayout", () => {
	beforeEach(() => {
		harness.setOpenMobile.mockReset();
		harness.openRoom.mockReset();
	});

	it("opens a fresh draft with the current model and closes the mobile list", () => {
		const randomId = vi
			.spyOn(crypto, "randomUUID")
			.mockReturnValueOnce("00000000-0000-4000-8000-000000000001")
			.mockReturnValueOnce("00000000-0000-4000-8000-000000000002");
		const router = createMemoryRouter(routes, {
			initialEntries: ["/agents/agent-1/room-1"],
		});
		render(<RouterProvider router={router} />);

		fireEvent.click(screen.getByRole("button", { name: "New session" }));

		expect(router.state.location.pathname).toBe(
			"/agents/agent-1/new/00000000-0000-4000-8000-000000000001",
		);
		expect(router.state.location.search).toBe("?model=model-2");
		expect(harness.setOpenMobile).toHaveBeenCalledWith(false);

		fireEvent.click(screen.getByRole("button", { name: "New session" }));
		expect(router.state.location.pathname).toBe(
			"/agents/agent-1/new/00000000-0000-4000-8000-000000000002",
		);
		expect(router.state.location.search).toBe("?model=model-2");
		randomId.mockRestore();
	});
});
