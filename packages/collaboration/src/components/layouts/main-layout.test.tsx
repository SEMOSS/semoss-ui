import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useMain } from "@/app/main.context";
import { MainLayout } from "./main-layout";

const mainLayoutHarness = vi.hoisted(() => ({
	sessions: [] as { id: string; agentId: string }[],
	sidebarProps: null as {
		activeAgentId?: string;
		activeRoomId?: string;
	} | null,
}));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: {} }),
}));
vi.mock("@/features/agents/api/use-workspace-data", () => ({
	useWorkspaceData: () => ({
		agents: [],
		sessions: mainLayoutHarness.sessions,
		setSessions: vi.fn(),
		addPendingRoom: vi.fn(),
		isLoading: false,
		error: null,
	}),
}));
vi.mock("@/features/agents/api/use-save-agent", () => ({
	useSaveAgent: () => vi.fn(),
}));
vi.mock("@/components/sidebar/sidebar-header", () => ({
	SidebarHeader: () => null,
}));
vi.mock("@/components/sidebar/sidebar-footer", () => ({
	SidebarFooter: () => null,
}));
vi.mock("@/components/sidebar/sidebar-agents-list", () => ({
	SidebarAgentsList: ({
		onAgentVisited,
		activeAgentId,
		activeRoomId,
	}: {
		onAgentVisited: (agentId: string) => void;
		activeAgentId?: string;
		activeRoomId?: string;
	}) => {
		mainLayoutHarness.sidebarProps = { activeAgentId, activeRoomId };
		return (
			<button type="button" onClick={() => onAgentVisited("agent/one")}>
				Open agent
			</button>
		);
	},
}));

function StartSessionAction() {
	const { newRoom } = useMain();
	return (
		<button type="button" onClick={() => newRoom("agent/one")}>
			Start session
		</button>
	);
}

describe("MainLayout", () => {
	beforeAll(() => {
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: false,
				media: query,
				onchange: null,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});
	});

	beforeEach(() => {
		mainLayoutHarness.sessions = [];
		mainLayoutHarness.sidebarProps = null;
	});

	it("navigates explicit new-session actions to the new page", async () => {
		const user = userEvent.setup();
		const routes: RouteObject[] = [
			{
				path: "/",
				Component: MainLayout,
				children: [
					{ index: true, Component: StartSessionAction },
					{ path: "new", element: <div>New session page</div> },
				],
			},
		];
		const router = createMemoryRouter(routes);
		render(<RouterProvider router={router} />);

		await user.click(screen.getByRole("button", { name: "Start session" }));

		expect(router.state.location.pathname).toBe("/new");
		expect(router.state.location.search).toBe("?agentId=agent%2Fone");
		expect(screen.getByText("New session page")).toBeVisible();
	});

	it("navigates palette agent selections to the agent route", async () => {
		const user = userEvent.setup();
		const routes: RouteObject[] = [
			{
				path: "/",
				Component: MainLayout,
				children: [
					{ index: true, element: <div>Workspace</div> },
					{
						path: "agents/:agentId",
						element: <div>Agent page</div>,
					},
				],
			},
		];
		const router = createMemoryRouter(routes);
		render(<RouterProvider router={router} />);

		await user.click(screen.getByRole("button", { name: "Open agent" }));

		expect(router.state.location.pathname).toBe("/agents/agent%2Fone");
		expect(screen.getByText("Agent page")).toBeVisible();
	});

	it("marks only the room active on a direct room route", () => {
		mainLayoutHarness.sessions = [{ id: "room-one", agentId: "agent-one" }];
		const routes: RouteObject[] = [
			{
				path: "/",
				Component: MainLayout,
				children: [
					{
						path: "room/:roomId",
						element: <div>Room page</div>,
					},
				],
			},
		];
		const router = createMemoryRouter(routes, {
			initialEntries: ["/room/room-one"],
		});
		render(<RouterProvider router={router} />);

		expect(mainLayoutHarness.sidebarProps).toEqual({
			activeAgentId: undefined,
			activeRoomId: "room-one",
		});
	});
});
