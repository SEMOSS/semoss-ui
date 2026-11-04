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
import type { RoomStore } from "@/stores/room/room.store";
import { RoomActionMenuItems } from "./room-action-menu-items";
import { RoomHeader } from "./room-header";
import { RoomTitle } from "./room-title";
import { RoomTitleProvider, useRoomTitle } from "./room-title.context";

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
// a desktop window: the menu button is the compact size
vi.stubGlobal(
	"matchMedia",
	vi.fn(() => ({
		matches: false,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	})),
);
vi.mock("@/hooks/use-chat", () => ({
	useChat: () => ({
		chat: {
			keys: { roomCounter: 0 },
			pinRoom: mocks.pinRoom,
			renameRoom: mocks.renameRoom,
			closeRoom: mocks.closeRoom,
			downloadConversation: vi.fn(),
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

/** A second header menu holding the room's actions, as the Other menu does. */
function OtherMenu() {
	const title = useRoomTitle();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button>Other</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				onCloseAutoFocus={title?.handleMenuCloseAutoFocus}
			>
				<RoomActionMenuItems showLabel />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** The room's name and its menu, inside the header's shared room state. */
function titleTree(target: RoomStore = room) {
	return (
		<RoomTitleProvider room={target}>
			<RoomTitle />
			<OtherMenu />
		</RoomTitleProvider>
	);
}

function renderTitle() {
	return render(titleTree());
}

/** Open the header's Other menu, which holds the room's actions. */
async function openMenu(user: ReturnType<typeof userEvent.setup>) {
	await user.click(screen.getByRole("button", { name: "Other" }));
}

test("the header holds the title at the start and the actions at the end", () => {
	render(
		<RoomHeader
			title={<span>Title</span>}
			actions={<nav aria-label="Places" />}
		/>,
	);
	const header = screen.getByRole("banner");
	expect(header).toHaveTextContent("Title");
	expect(screen.getByRole("navigation", { name: "Places" })).toBeVisible();
	// outside the app layout there is no navigation to open
	expect(
		screen.queryByRole("button", { name: "actions.openNavigation" }),
	).toBeNull();
});

test("the room's name is plain text, with no menu of its own", () => {
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

test("rename edits the name in place: Enter saves, Escape keeps the old name", async () => {
	const user = userEvent.setup();
	renderTitle();
	await openMenu(user);
	await user.click(
		screen.getByRole("menuitem", { name: "sidebar:actions.rename" }),
	);
	const field = await screen.findByRole("textbox", {
		name: "header.renameLabel",
	});
	expect(field).toHaveValue("Quarterly plan");
	await user.clear(field);
	await user.type(field, "Q3 plan{Enter}");
	expect(mocks.renameRoom).toHaveBeenCalledWith("r1", "Q3 plan");
	await waitFor(() =>
		expect(
			screen.getByRole("heading", { name: "Quarterly plan" }),
		).toHaveFocus(),
	);

	await openMenu(user);
	await user.click(
		screen.getByRole("menuitem", { name: "sidebar:actions.rename" }),
	);
	await user.type(
		await screen.findByRole("textbox", { name: "header.renameLabel" }),
		" draft{Escape}",
	);
	expect(mocks.renameRoom).toHaveBeenCalledTimes(1);
	expect(
		screen.getByRole("heading", { name: "Quarterly plan" }),
	).toBeVisible();
});

test("rename refuses an empty name and keeps the field open", async () => {
	const error = vi.spyOn(toast, "error").mockImplementation(() => "");
	const user = userEvent.setup();
	renderTitle();
	await openMenu(user);
	await user.click(
		screen.getByRole("menuitem", { name: "sidebar:actions.rename" }),
	);
	const field = await screen.findByRole("textbox", {
		name: "header.renameLabel",
	});
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

test("the Other menu lists the room's actions under its heading, and renames in place", async () => {
	const user = userEvent.setup();
	renderTitle();
	await user.click(screen.getByRole("button", { name: "Other" }));
	expect(screen.getByText("room:header.roomSection")).toBeVisible();
	expect(
		screen.getAllByRole("menuitem").map((item) => item.textContent),
	).toEqual([
		"sidebar:actions.favorite",
		"sidebar:actions.rename",
		"room:workspace.publishTooltip",
		"sidebar:actions.download",
		"sidebar:actions.delete",
	]);
	await user.click(
		screen.getByRole("menuitem", { name: "sidebar:actions.rename" }),
	);
	const field = await screen.findByRole("textbox", {
		name: "header.renameLabel",
	});
	await waitFor(() => expect(field).toHaveFocus());
	await user.type(field, " v2{Enter}");
	expect(mocks.renameRoom).toHaveBeenCalledWith("r1", "Quarterly plan v2");
});

test("Publish as Agent saves the room's instructions and tools as an agent", async () => {
	mocks.addWorkspace.mockResolvedValue("saved-agent");
	const user = userEvent.setup();
	renderTitle();
	await openMenu(user);
	await user.click(
		screen.getByRole("menuitem", { name: "room:workspace.publishTooltip" }),
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
