import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";

const useIteratorPixelMock = vi.hoisted(() => vi.fn());

vi.mock("@semoss/sdk/react", () => ({
	useIteratorPixel: useIteratorPixelMock,
}));

import type { PlaygroundRoomRow } from "@/features/rooms/api/room-schemas";
import { SessionsPage } from "./sessions.page";

function room(
	id: string,
	workspaceId: string | null,
	title: string,
	overrides: Partial<PlaygroundRoomRow> = {},
): PlaygroundRoomRow {
	return {
		ROOM_ID: id,
		ROOM_NAME: title,
		WORKSPACE_ID: workspaceId,
		DATE_UPDATED: new Date().toISOString(),
		...overrides,
	};
}

function setRoomsQuery({
	rooms,
	isLoading = false,
	error,
	hasMore = false,
	next = vi.fn(),
	reset = vi.fn(),
}: {
	rooms: PlaygroundRoomRow[];
	isLoading?: boolean;
	error?: Error;
	hasMore?: boolean;
	next?: () => void;
	reset?: () => void;
}) {
	useIteratorPixelMock.mockReturnValue({
		data: rooms,
		totalCount: hasMore ? Number.POSITIVE_INFINITY : rooms.length,
		isError: Boolean(error),
		error,
		isLoading,
		hasMore,
		next,
		reset,
	});
}

function getRoomsStatement(limit = 100, offset = 0) {
	const createStatement = useIteratorPixelMock.mock.lastCall?.[0] as
		| ((pageLimit: number, pageOffset: number) => string)
		| undefined;
	if (!createStatement) throw new Error("Rooms iterator was not called.");
	return createStatement(limit, offset);
}

const routes: RouteObject[] = [
	{ path: "/room", Component: SessionsPage },
	{ path: "/new", element: <div>New session page</div> },
	{
		path: "/room/:roomId",
		element: <div>Room page</div>,
	},
];

function renderSessions({
	rooms,
	isLoading = false,
	error,
	hasMore = false,
	next,
	reset,
	initialEntry = "/room",
}: {
	rooms: PlaygroundRoomRow[];
	isLoading?: boolean;
	error?: Error;
	hasMore?: boolean;
	next?: () => void;
	reset?: () => void;
	initialEntry?: string;
}) {
	setRoomsQuery({ rooms, isLoading, error, hasMore, next, reset });
	const router = createMemoryRouter(routes, {
		initialEntries: [initialEntry],
	});
	const view = render(<RouterProvider router={router} />);
	return { router, ...view };
}

async function chooseSelectOption(
	user: ReturnType<typeof userEvent.setup>,
	label: string,
	option: string,
) {
	await user.click(screen.getByRole("combobox", { name: label }));
	await user.click(await screen.findByRole("option", { name: option }));
}

describe("SessionsPage", () => {
	beforeAll(() => {
		Object.defineProperties(HTMLElement.prototype, {
			hasPointerCapture: {
				configurable: true,
				value: () => false,
			},
			setPointerCapture: {
				configurable: true,
				value: () => undefined,
			},
			releasePointerCapture: {
				configurable: true,
				value: () => undefined,
			},
		});
	});

	beforeEach(() => {
		useIteratorPixelMock.mockReset();
	});

	it("shows every room returned by GetPlaygroundRooms", () => {
		renderSessions({
			rooms: [
				room("first", "workspace-one", "First room"),
				room("second", "workspace-two", "Second room"),
				room("unassigned", null, "Unassigned room"),
			],
		});

		expect(screen.getByText("First room")).toBeVisible();
		expect(screen.getByText("Second room")).toBeVisible();
		expect(screen.getByText("Unassigned room")).toBeVisible();
		expect(screen.getByText(/workspace-one/)).toBeVisible();
		expect(screen.getByText(/workspace-two/)).toBeVisible();
		expect(screen.getByText(/No workspace/)).toBeVisible();
		expect(screen.getByText("3 sessions shown")).toBeVisible();
		expect(getRoomsStatement()).toBe(
			'GetPlaygroundRooms(limit=[101], offset=[0], sort=["DESC"], includeUnnamedRooms=[true]);',
		);
		expect(
			screen.queryByRole("button", { name: "Load more sessions" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("checkbox", {
				name: "Include quiet background runs",
			}),
		).not.toBeInTheDocument();
		expect(useIteratorPixelMock.mock.lastCall?.[3]).toEqual({ limit: 100 });
	});

	it("uses a one-room lookahead to hide pagination after a full final page", () => {
		renderSessions({ rooms: [] });
		const getTotalCount = useIteratorPixelMock.mock.lastCall?.[1] as
			| ((response: unknown) => number)
			| undefined;
		const getData = useIteratorPixelMock.mock.lastCall?.[2] as
			| ((response: unknown) => PlaygroundRoomRow[])
			| undefined;
		if (!getTotalCount || !getData) {
			throw new Error("Rooms iterator callbacks were not provided.");
		}

		const fullPage = Array.from({ length: 100 }, (_, index) =>
			room(`room-${index}`, "workspace-one", `Room ${index}`),
		);
		const lookaheadRoom = room("room-100", "workspace-one", "Room 100");

		expect(getTotalCount(fullPage)).toBe(-1);
		expect(getTotalCount([...fullPage, lookaheadRoom])).toBe(
			Number.POSITIVE_INFINITY,
		);
		expect(getData([...fullPage, lookaheadRoom])).toEqual(fullPage);
	});

	it("shows query failures and retries them", async () => {
		const user = userEvent.setup();
		const reset = vi.fn();
		renderSessions({
			rooms: [],
			error: new Error("Rooms are unavailable."),
			reset,
		});

		expect(screen.getByText("Could not load sessions")).toBeVisible();
		expect(screen.getByText("Rooms are unavailable.")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Try again" }));
		expect(reset).toHaveBeenCalledOnce();
	});

	it("opens rooms directly and starts an unscoped session", async () => {
		const user = userEvent.setup();
		const { router } = renderSessions({
			rooms: [room("research-room", null, "Research room")],
		});

		await user.click(screen.getByRole("button", { name: /Research room/ }));
		expect(router.state.location.pathname).toBe("/room/research-room");

		await act(() => router.navigate("/room"));
		await user.click(screen.getByRole("button", { name: "New session" }));
		expect(router.state.location.pathname).toBe("/new");
	});

	it("filters by WORKSPACE_ID and clears its query parameter", async () => {
		const user = userEvent.setup();
		const { router } = renderSessions({
			rooms: [
				room("first", "workspace-one", "First room"),
				room("second", "workspace/two", "Second room"),
			],
			initialEntry: "/room?agentId=workspace%2Ftwo",
		});

		expect(screen.getByText("Second room")).toBeVisible();
		expect(screen.queryByText("First room")).not.toBeInTheDocument();
		expect(
			screen.getByRole("combobox", { name: "Filter by workspace" }),
		).toHaveTextContent("workspace/two");
		expect(getRoomsStatement()).toBe(
			'GetPlaygroundRooms(limit=[101], offset=[0], sort=["DESC"], roomOptionsSearch=["workspace/two"], includeUnnamedRooms=[true]);',
		);

		await chooseSelectOption(user, "Filter by workspace", "All workspaces");

		expect(screen.getByText("First room")).toBeVisible();
		expect(screen.getByText("Second room")).toBeVisible();
		expect(router.state.location.search).toBe("");
		expect(getRoomsStatement()).toBe(
			'GetPlaygroundRooms(limit=[101], offset=[0], sort=["DESC"], includeUnnamedRooms=[true]);',
		);
	});

	it("keeps a deep-linked WORKSPACE_ID before its rooms load", () => {
		renderSessions({
			rooms: [
				room("first", "workspace-one", "First room"),
				room("second", "workspace-two", "Second room"),
			],
			initialEntry: "/room?agentId=missing-workspace",
		});

		expect(screen.queryByText("First room")).not.toBeInTheDocument();
		expect(screen.queryByText("Second room")).not.toBeInTheDocument();
		expect(
			screen.getByRole("combobox", { name: "Filter by workspace" }),
		).toHaveTextContent("missing-workspace");
		expect(getRoomsStatement()).toContain(
			'roomOptionsSearch=["missing-workspace"]',
		);
	});

	it("keeps a workspace filter when it has no loaded rooms", () => {
		renderSessions({
			rooms: [],
			initialEntry: "/room?agentId=empty-workspace",
		});

		expect(
			screen.getByRole("combobox", { name: "Filter by workspace" }),
		).toHaveTextContent("empty-workspace");
		expect(screen.getByText("No matching sessions")).toBeVisible();
		expect(getRoomsStatement()).toBe(
			'GetPlaygroundRooms(limit=[101], offset=[0], sort=["DESC"], roomOptionsSearch=["empty-workspace"], includeUnnamedRooms=[true]);',
		);
	});

	it("applies the available source and period filters", async () => {
		const user = userEvent.setup();
		renderSessions({
			rooms: [
				room("current", "workspace-one", "Current room"),
				room("old", "workspace-two", "Old room", {
					DATE_UPDATED: "2020-01-01T00:00:00.000Z",
				}),
			],
		});

		expect(screen.queryByText("Old room")).not.toBeInTheDocument();
		await chooseSelectOption(user, "Time range", "All time");
		expect(screen.getByText("Old room")).toBeVisible();

		await chooseSelectOption(
			user,
			"Filter activity source",
			"Automated & hooks",
		);
		expect(screen.getByText("No matching sessions")).toBeVisible();

		await user.click(
			screen.getByRole("button", { name: "Show all sessions" }),
		);
		expect(screen.getByText("Current room")).toBeVisible();
		expect(screen.getByText("Old room")).toBeVisible();
	});

	it("loads the next 100 rooms near the bottom and from a keyboard control", async () => {
		const user = userEvent.setup();
		const next = vi.fn();
		renderSessions({
			rooms: [room("first", "workspace-one", "First room")],
			hasMore: true,
			next,
		});

		expect(getRoomsStatement(100, 100)).toContain(
			"limit=[101], offset=[100]",
		);
		await user.click(
			screen.getByRole("button", { name: "Load more sessions" }),
		);
		expect(next).toHaveBeenCalledOnce();

		const scrollContainer = screen.getByRole("main").parentElement;
		if (!scrollContainer)
			throw new Error("Missing sessions scroll container.");
		Object.defineProperties(scrollContainer, {
			scrollHeight: { configurable: true, value: 1_000 },
			clientHeight: { configurable: true, value: 500 },
			scrollTop: { configurable: true, value: 450 },
		});
		fireEvent.scroll(scrollContainer);
		expect(next).toHaveBeenCalledTimes(2);
	});

	it("keeps loaded rooms visible during later loading and error states", async () => {
		const firstRoom = room("first", "workspace-one", "First room");
		const loadingView = renderSessions({
			rooms: [firstRoom],
			isLoading: true,
			hasMore: true,
		});

		expect(screen.getByText("First room")).toBeVisible();
		expect(screen.getByText("Loading more sessions")).toBeVisible();

		loadingView.unmount();
		const user = userEvent.setup();
		const reset = vi.fn();
		renderSessions({
			rooms: [firstRoom],
			error: new Error("Next page failed."),
			hasMore: true,
			reset,
		});
		expect(screen.getByText("First room")).toBeVisible();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Could not load more sessions.",
		);
		await user.click(screen.getByRole("button", { name: "Try again" }));
		expect(reset).toHaveBeenCalledOnce();
	});

	it("replaces grouping with a debounced session search", async () => {
		const user = userEvent.setup();
		renderSessions({
			rooms: [
				room("first", "workspace-one", "First room"),
				room("second", "workspace-two", "Second room"),
			],
		});

		expect(
			screen.queryByRole("radio", { name: "By recent activity" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("radio", { name: "By workspace" }),
		).not.toBeInTheDocument();

		await user.type(
			screen.getByRole("searchbox", { name: "Search sessions" }),
			"Second",
		);
		expect(screen.queryByText("First room")).not.toBeInTheDocument();
		expect(screen.getByText("Second room")).toBeVisible();
		await waitFor(() => {
			expect(getRoomsStatement()).toContain('search=["Second"]');
		});
	});

	it("shows the filtered-empty state when no raw room needs attention", async () => {
		const user = userEvent.setup();
		renderSessions({
			rooms: [room("ready", "workspace-one", "Ready room")],
		});

		await user.click(screen.getByRole("tab", { name: "Needs you" }));
		expect(screen.getByText("No matching sessions")).toBeVisible();
		expect(screen.getByText("0 sessions shown")).toBeVisible();
	});

	it("distinguishes loading and empty collection states", () => {
		const view = renderSessions({ rooms: [], isLoading: true });

		expect(screen.getByLabelText("Loading sessions")).toBeVisible();
		expect(screen.queryByText("No sessions yet")).not.toBeInTheDocument();

		view.unmount();
		renderSessions({ rooms: [] });
		expect(screen.getByText("No sessions yet")).toBeVisible();
	});
});
