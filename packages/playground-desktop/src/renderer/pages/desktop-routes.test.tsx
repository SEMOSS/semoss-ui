import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type {
	DesktopBridge,
	DesktopCommand,
} from "../../contract/ipc-contract";
import { routes } from "./router";

const mocks = vi.hoisted(() => ({
	status: "AUTHENTICATED",
	rooms: [] as { ROOM_ID: string; ROOM_NAME: string; DATE_CREATED: string }[],
	commandListener: null as ((command: DesktopCommand) => void) | null,
}));

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/sdk/react", () => ({
	useSession: <T,>(
		selector: (state: {
			status: string;
			user: { name: string };
			logout: () => void;
		}) => T,
	) =>
		selector({
			status: mocks.status,
			user: { name: "Ada" },
			logout: vi.fn(),
		}),
	useSessionRetry: () => ({ isRetrying: false, retry: vi.fn() }),
	useConfig: <T,>(selector: (state: { theme: null }) => T) =>
		selector({ theme: null }),
	useSessionPixel: () => ({ data: [], status: "SUCCESS", refresh: vi.fn() }),
	usePixel: () => ({ data: [], status: "SUCCESS", refresh: vi.fn() }),
	useSessionIteratorPixel: () => ({
		data: mocks.rooms,
		isLoading: false,
		isError: false,
		hasMore: false,
		next: vi.fn(),
		reset: vi.fn(),
	}),
}));
// the library's room list and the desktop's own wiring are real; a room and
// a new chat are stood in for, since the library tests them itself
vi.mock("@semoss/chat", async (original) => {
	const actual = await original<typeof import("@semoss/chat")>();
	return {
		...actual,
		useCreateChatStore: () => ({
			keys: { roomCounter: 0 },
			optimisticRooms: {},
			removeOptimisticRoom: vi.fn(),
		}),
		Chat: {
			...actual.Chat,
			NewChat: () => <h1>New chat screen</h1>,
			Room: ({ roomId }: { roomId: string }) => <h1>Room {roomId}</h1>,
		},
	};
});

beforeEach(() => {
	mocks.status = "AUTHENTICATED";
	mocks.rooms = [
		{
			ROOM_ID: "room-1",
			ROOM_NAME: "Quarterly plan",
			DATE_CREATED: new Date().toISOString(),
		},
	];
	const bridge: DesktopBridge = {
		invoke: vi.fn(),
		onCommand: (listener) => {
			mocks.commandListener = listener;
			return () => {
				mocks.commandListener = null;
			};
		},
	};
	window.semossDesktop = bridge;
});
afterEach(() => {
	window.semossDesktop = undefined;
});

const renderAt = (path: string) => {
	const router = createMemoryRouter(routes, { initialEntries: [path] });
	render(<RouterProvider router={router} />);
	return router;
};

test("lists the user's rooms and opens one", async () => {
	const user = userEvent.setup();
	const router = renderAt("/new");
	expect(
		screen.getByRole("heading", { name: "New chat screen" }),
	).toBeVisible();

	await user.click(screen.getByRole("link", { name: /Quarterly plan/ }));
	expect(router.state.location.pathname).toBe("/room/room-1");
	expect(screen.getByRole("heading", { name: "Room room-1" })).toBeVisible();
});

test("New chat and the menu's commands go to their screens", async () => {
	const user = userEvent.setup();
	const router = renderAt("/room/room-1");

	await user.click(screen.getByRole("link", { name: "nav.newChat" }));
	expect(router.state.location.pathname).toBe("/new");

	act(() => mocks.commandListener?.({ type: "change-server" }));
	expect(router.state.location.pathname).toBe("/server");
});

test("a signed out user is sent to sign in", () => {
	mocks.status = "UNAUTHENTICATED";
	const router = renderAt("/new");
	expect(router.state.location.pathname).toBe("/login");
});
