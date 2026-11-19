import { act, render, screen, within } from "@testing-library/react";
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
	invoke: null as ReturnType<typeof vi.fn> | null,
	// a fixed chat store: its snapshot is itself
	chat: {
		keys: { roomCounter: 0 },
		// what the settings dialog's General page reads
		models: { available: [], selected: null },
		optimisticRooms: {},
		removeOptimisticRoom: () => {},
		getSnapshot() {
			return this;
		},
		subscribe: () => () => {},
	},
}));

vi.mock("@semoss/i18n", () => ({
	LANGUAGES: [{ code: "en", label: "English" }],
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en", changeLanguage: vi.fn() },
	}),
}));
vi.mock("@semoss/sdk/react", () => ({
	Env: { MODULE: "/Monolith" },
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
	useSessionInsight: () => ({ run: vi.fn(), upload: vi.fn() }),
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
		useCreateChatStore: () => mocks.chat,
		NewChat: () => <h1>New chat screen</h1>,
		RoomScope: ({ roomId }: { roomId: string }) => <h1>Room {roomId}</h1>,
	};
});

/** The server in use. */
const ACTIVE = { url: "https://semoss.example.com", module: "/Monolith" };
/** Another saved server, with its own sign in. */
const OTHER = { url: "https://other.example.com", module: "/team/Monolith" };

beforeEach(() => {
	mocks.status = "AUTHENTICATED";
	mocks.rooms = [
		{
			ROOM_ID: "room-1",
			ROOM_NAME: "Quarterly plan",
			DATE_CREATED: new Date().toISOString(),
		},
	];
	// two saved servers; the first is in use
	const invoke = vi.fn(async (channel: string) => {
		if (channel === "server-connection:get") return ACTIVE;
		if (channel === "server-connection:list") {
			return { servers: [ACTIVE, OTHER], active: ACTIVE };
		}
		return undefined;
	});
	mocks.invoke = invoke;
	const bridge: DesktopBridge = {
		invoke: invoke as DesktopBridge["invoke"],
		onCommand: (listener) => {
			mocks.commandListener = listener;
			return () => {
				mocks.commandListener = null;
			};
		},
		toolFrameOrigin: "http://127.0.0.1:4322",
	};
	window.semossDesktop = bridge;
});
afterEach(() => {
	window.semossDesktop = undefined;
});

/**
 * Mount the app's routes on a memory router.
 *
 * @param path - The first location.
 * @returns The router, to read its location.
 */
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

test("an unreachable server names it and offers a different one", async () => {
	mocks.status = "ERROR";
	const user = userEvent.setup();
	const router = renderAt("/new");

	expect(
		await screen.findByText("desktop:unreachable.description"),
	).toBeVisible();
	expect(
		screen.getByRole("button", { name: "common:buttons.retry" }),
	).toBeVisible();

	await user.click(
		screen.getByRole("button", {
			name: "desktop:unreachable.changeServer",
		}),
	);
	expect(router.state.location.pathname).toBe("/server");
});

test("the sign in page names the server and offers a different one", async () => {
	mocks.status = "UNAUTHENTICATED";
	const user = userEvent.setup();
	const router = renderAt("/login");

	expect(await screen.findByText("connect.current")).toBeVisible();
	await user.click(
		screen.getByRole("button", { name: "account.changeServer" }),
	);
	expect(router.state.location.pathname).toBe("/server");
});

test("the server page lists saved servers and switches to one", async () => {
	const user = userEvent.setup();
	renderAt("/server");

	const list = await screen.findByRole("list");
	const items = within(list).getAllByRole("listitem");
	expect(items).toHaveLength(2);
	expect(within(items[0]).getByText("servers.current")).toBeVisible();

	await user.click(
		within(items[1]).getByRole("button", { name: "servers.switchLabel" }),
	);
	expect(mocks.invoke).toHaveBeenCalledWith("server-connection:set", OTHER);
});

test("removing a server asks first, then forgets it", async () => {
	const user = userEvent.setup();
	renderAt("/server");

	const items = within(await screen.findByRole("list")).getAllByRole(
		"listitem",
	);
	await user.click(
		within(items[1]).getByRole("button", { name: "servers.removeLabel" }),
	);
	const dialog = await screen.findByRole("dialog");
	expect(mocks.invoke).not.toHaveBeenCalledWith(
		"server-connection:forget",
		expect.anything(),
	);

	await user.click(
		within(dialog).getByRole("button", { name: "servers.removeConfirm" }),
	);
	expect(mocks.invoke).toHaveBeenCalledWith(
		"server-connection:forget",
		OTHER,
	);
	// the list is read again once it is forgotten
	expect(
		mocks.invoke.mock.calls.filter(
			([channel]) => channel === "server-connection:list",
		).length,
	).toBeGreaterThan(1);
});

test("the account menu opens Settings, where the Servers page is", async () => {
	const user = userEvent.setup();
	const router = renderAt("/room/room-1");

	await user.click(screen.getByRole("button", { name: "account.menu" }));
	// the menu holds Settings and Sign out; servers are managed in Settings
	expect(
		screen.getAllByRole("menuitem").map((item) => item.textContent),
	).toEqual(["sidebar:userMenu.settings", "account.signOut"]);
	await user.click(
		screen.getByRole("menuitem", { name: "sidebar:userMenu.settings" }),
	);

	// the dialog opens over the room, which stays where it is
	const dialog = await screen.findByRole("dialog");
	expect(router.state.location.pathname).toBe("/room/room-1");
	// the chat's own pages, then the desktop's
	const pages = within(
		within(dialog).getByRole("navigation", { name: "settings.title" }),
	).getAllByRole("button");
	expect(pages.map((button) => button.textContent)).toEqual([
		"settings.sections.general",
		"settings.sections.connectors",
		"connect.titleSaved",
	]);

	await user.click(pages[2]);
	expect(
		within(dialog).getByRole("heading", { name: "connect.titleSaved" }),
	).toBeVisible();
	// the saved servers: the other one can be activated
	expect(
		await within(dialog).findByText(
			"https://other.example.com/team/Monolith",
		),
	).toBeVisible();
	expect(
		within(dialog).getByRole("button", { name: "servers.switchLabel" }),
	).toHaveTextContent("servers.switch");
	// and the form that adds one, with a small Connect at its end
	expect(
		within(dialog).getByRole("textbox", { name: /connect.urlLabel/ }),
	).toBeVisible();
	expect(
		within(dialog).getByRole("button", { name: "connect.submit" }),
	).toHaveClass("self-end");
});
