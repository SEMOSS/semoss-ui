import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useMain } from "@/app/main.context";
import { MainLayout } from "./main-layout";

const mainLayoutHarness = vi.hoisted(() => ({
	sessions: [] as { id: string; agentId: string }[],
	updateRoom: vi.fn(),
	removeRoom: vi.fn(),
	sidebarProps: null as {
		activeAgentId?: string;
		activeRoomId?: string;
		onRoomRename: (roomId: string, name: string) => Promise<void>;
		onRoomDelete: (roomId: string) => Promise<void>;
	} | null,
}));

const roomMutations = vi.hoisted(() => ({
	renameRoom: vi.fn(),
	deleteRoom: vi.fn(),
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
		updateRoom: mainLayoutHarness.updateRoom,
		removeRoom: mainLayoutHarness.removeRoom,
		isLoading: false,
		error: null,
	}),
}));
vi.mock("@/features/agents/api/use-save-agent", () => ({
	useSaveAgent: () => vi.fn(),
}));
vi.mock("@/features/rooms/api/rename-room", () => ({
	renameRoom: roomMutations.renameRoom,
}));
vi.mock("@/features/rooms/api/delete-room", () => ({
	deleteRoom: roomMutations.deleteRoom,
}));
vi.mock("@/components/sidebar/sidebar-header", () => ({
	SidebarHeader: () => null,
}));
vi.mock("@/components/sidebar/sidebar-footer", () => ({
	SidebarFooter: () => null,
}));
vi.mock("@/components/sidebar/sidebar-agents-list", () => ({
	SidebarAgentsList: ({
		activeAgentId,
		activeRoomId,
		onRoomRename,
		onRoomDelete,
	}: {
		activeAgentId?: string;
		activeRoomId?: string;
		onRoomRename: (roomId: string, name: string) => Promise<void>;
		onRoomDelete: (roomId: string) => Promise<void>;
	}) => {
		mainLayoutHarness.sidebarProps = {
			activeAgentId,
			activeRoomId,
			onRoomRename,
			onRoomDelete,
		};
		return null;
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
		mainLayoutHarness.updateRoom.mockReset();
		mainLayoutHarness.removeRoom.mockReset();
		mainLayoutHarness.sidebarProps = null;
		roomMutations.renameRoom.mockReset();
		roomMutations.renameRoom.mockResolvedValue(undefined);
		roomMutations.deleteRoom.mockReset();
		roomMutations.deleteRoom.mockResolvedValue(undefined);
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

		expect(mainLayoutHarness.sidebarProps).toMatchObject({
			activeAgentId: undefined,
			activeRoomId: "room-one",
		});
	});

	it("renames rooms through the sidebar and updates local room state", async () => {
		const routes: RouteObject[] = [
			{
				path: "/",
				Component: MainLayout,
				children: [{ index: true, element: <div>Home page</div> }],
			},
		];
		const router = createMemoryRouter(routes);
		render(<RouterProvider router={router} />);

		await act(async () => {
			await mainLayoutHarness.sidebarProps?.onRoomRename(
				"room-one",
				"Renamed room",
			);
		});

		expect(roomMutations.renameRoom).toHaveBeenCalledWith(
			expect.anything(),
			"room-one",
			"Renamed room",
		);
		expect(mainLayoutHarness.updateRoom).toHaveBeenCalledWith("room-one", {
			title: "Renamed room",
		});
	});

	it("deletes the active room and navigates to the new-room page", async () => {
		mainLayoutHarness.sessions = [{ id: "room-one", agentId: "agent-one" }];
		const routes: RouteObject[] = [
			{
				path: "/",
				Component: MainLayout,
				children: [
					{ path: "room/:roomId", element: <div>Room page</div> },
					{ path: "new", element: <div>New session page</div> },
				],
			},
		];
		const router = createMemoryRouter(routes, {
			initialEntries: ["/room/room-one"],
		});
		render(<RouterProvider router={router} />);

		await act(async () => {
			await mainLayoutHarness.sidebarProps?.onRoomDelete("room-one");
		});

		expect(roomMutations.deleteRoom).toHaveBeenCalledWith(
			expect.anything(),
			"room-one",
		);
		expect(mainLayoutHarness.removeRoom).toHaveBeenCalledWith("room-one");
		expect(router.state.location.pathname).toBe("/new");
		expect(router.state.location.search).toBe("");
	});
});
