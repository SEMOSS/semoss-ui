import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	toast,
} from "@semoss/ui/next";
import { RoomActionsProvider } from "@/features/room-actions/room-actions.context";
import type { RoomStore } from "@/stores/room/room.store";
import { RoomActionMenuItems } from "./room-action-menu-items";
import { RoomTitle } from "./room-title";

const mocks = vi.hoisted(() => ({
	navigate: vi.fn(),
	pinRoom: vi.fn(),
	renameRoom: vi.fn(),
	closeRoom: vi.fn(),
	addWorkspace: vi.fn(),
	pinned: [] as { ROOM_ID: string }[],
}));

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-router", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@semoss/sdk/react", () => ({
	usePixel: () => ({ data: mocks.pinned, refresh: vi.fn() }),
}));
vi.mock("@/hooks/use-chat", () => ({
	useChat: () => ({
		chat: {
			keys: { roomCounter: 0 },
			pinRoom: mocks.pinRoom,
			renameRoom: mocks.renameRoom,
			closeRoom: mocks.closeRoom,
			addWorkspace: mocks.addWorkspace,
		},
	}),
}));

/** Only the fields the title menu reads. */
const room = {
	roomId: "r1",
	metadata: { name: "Quarterly plan", dateCreated: "" },
	options: {
		instructions: "Room instructions",
		mcp: [{ id: "tool-1", type: "PROJECT", name: "Tool" }],
	},
	theme: { featureFlags: {} },
} as unknown as RoomStore;

beforeEach(() => {
	for (const mock of [mocks.navigate, mocks.pinRoom, mocks.closeRoom])
		mock.mockReset();
	mocks.renameRoom.mockReset().mockResolvedValue(undefined);
	mocks.pinned = [];
});

/** A menu holding the room's actions, as the More actions menu holds them. */
function MoreActionsMenu() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button>More actions</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<RoomActionMenuItems />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** Double-click the room's name to edit it, and return the field. */
async function startRename(user: ReturnType<typeof userEvent.setup>) {
	await user.dblClick(screen.getByText("Quarterly plan"));
	return screen.findByRole("textbox", { name: "header.renameLabel" });
}

/** The room's name and its menu, inside the room's shared actions. */
function titleTree(target: RoomStore = room) {
	return (
		<RoomActionsProvider room={target}>
			<RoomTitle />
			<MoreActionsMenu />
		</RoomActionsProvider>
	);
}

function renderTitle() {
	return render(titleTree());
}

/** Open the menu that holds the room's actions. */
async function openMenu(user: ReturnType<typeof userEvent.setup>) {
	await user.click(screen.getByRole("button", { name: "More actions" }));
}

test("the room's name is a heading, with no menu of its own", () => {
	renderTitle();
	expect(
		screen.getByRole("heading", { name: "Quarterly plan" }),
	).toBeVisible();
	expect(screen.queryByRole("button", { name: /Quarterly plan/ })).toBeNull();
});

test("the room menu favorites, and says unfavorite once the room is a favorite", async () => {
	const user = userEvent.setup();
	const { rerender } = renderTitle();
	await openMenu(user);
	await user.click(
		screen.getByRole("menuitem", { name: "sidebar:actions.favorite" }),
	);
	expect(mocks.pinRoom).toHaveBeenCalledWith("r1", true);

	// the favorites read again once the pin lands; a new prop re-renders
	mocks.pinned = [{ ROOM_ID: "r1" }];
	rerender(titleTree({ ...room } as RoomStore));
	await openMenu(user);
	await user.click(
		screen.getByRole("menuitem", { name: "sidebar:actions.unfavorite" }),
	);
	expect(mocks.pinRoom).toHaveBeenCalledWith("r1", false);
});

test("a double-click edits the name in place: Enter saves, Escape keeps the old name", async () => {
	const user = userEvent.setup();
	renderTitle();
	const field = await startRename(user);
	expect(field).toHaveValue("Quarterly plan");
	await user.clear(field);
	await user.type(field, "Q3 plan{Enter}");
	expect(mocks.renameRoom).toHaveBeenCalledWith("r1", "Q3 plan");
	await waitFor(() =>
		expect(
			screen.getByRole("heading", { name: "Quarterly plan" }),
		).toHaveFocus(),
	);

	await user.type(await startRename(user), " draft{Escape}");
	expect(mocks.renameRoom).toHaveBeenCalledTimes(1);
	expect(
		screen.getByRole("heading", { name: "Quarterly plan" }),
	).toBeVisible();
});

test("rename refuses an empty name and keeps the field open", async () => {
	const error = vi.spyOn(toast, "error").mockImplementation(() => "");
	const user = userEvent.setup();
	renderTitle();
	const field = await startRename(user);
	await user.clear(field);
	await user.type(field, "{Enter}");
	expect(error).toHaveBeenCalledWith("toasts.roomNameEmpty");
	expect(mocks.renameRoom).not.toHaveBeenCalled();
	expect(field).toBeVisible();
	error.mockRestore();
});

test("delete removes the room and leaves its page", async () => {
	mocks.closeRoom.mockResolvedValue(undefined);
	const user = userEvent.setup();
	renderTitle();
	await openMenu(user);
	await user.click(
		screen.getByRole("menuitem", { name: "sidebar:actions.delete" }),
	);
	expect(mocks.closeRoom).toHaveBeenCalledWith("r1");
	await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/"));
});

test("the menu lists the room's actions under its heading, with no Rename", async () => {
	const user = userEvent.setup();
	renderTitle();
	await openMenu(user);
	expect(
		screen.getByRole("group", { name: "header.roomSection" }),
	).toBeVisible();
	expect(
		screen.getAllByRole("menuitem").map((item) => item.textContent),
	).toEqual([
		"sidebar:actions.favorite",
		"room:workspace.publish",
		"sidebar:actions.download",
		"sidebar:actions.delete",
	]);
});

test("the field takes focus as a double-click opens it", async () => {
	const user = userEvent.setup();
	renderTitle();
	const field = await startRename(user);
	await waitFor(() => expect(field).toHaveFocus());
});

test("Publish as Agent saves the room's instructions and tools as an agent", async () => {
	mocks.addWorkspace.mockResolvedValue("saved-agent");
	const user = userEvent.setup();
	renderTitle();
	await openMenu(user);
	await user.click(
		screen.getByRole("menuitem", { name: "room:workspace.publish" }),
	);
	await user.type(
		await screen.findByLabelText("workspace.nameLabel"),
		"Published agent",
	);
	await user.click(
		screen.getByRole("button", { name: "workspace.publishButton" }),
	);
	await waitFor(() =>
		expect(mocks.addWorkspace).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Published agent",
				system_prompt: "Room instructions",
				mcp: [{ id: "tool-1", type: "PROJECT", name: "Tool" }],
			}),
		),
	);
});

test("the menu leaves out Favorite where the chat history is hidden", async () => {
	const user = userEvent.setup();
	render(
		titleTree({
			...room,
			theme: { featureFlags: { hideChatHistory: true } },
		} as unknown as RoomStore),
	);
	await openMenu(user);
	expect(
		screen.queryByRole("menuitem", { name: "sidebar:actions.favorite" }),
	).toBeNull();
	expect(
		screen.getByRole("menuitem", { name: "room:workspace.publish" }),
	).toBeVisible();
});

test("rename saves the trimmed name", async () => {
	const user = userEvent.setup();
	renderTitle();
	const field = await startRename(user);
	await user.clear(field);
	await user.type(field, "  Q4 plan  {Enter}");
	expect(mocks.renameRoom).toHaveBeenCalledWith("r1", "Q4 plan");
});
