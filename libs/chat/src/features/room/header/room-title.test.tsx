import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import { testChatOptions } from "../../../test/chat-options";
import { fakeStore } from "../../../test/fake-store";
import { RoomActionsProvider } from "../actions/room-actions.context";
import type { RoomStore } from "../store/room.store";
import { RoomTitle } from "./room-title";

const mocks = vi.hoisted(() => ({
	onOpenNewChat: vi.fn(),
	renameRoom: vi.fn(),
}));

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("../../chat/config/chat-config.context", async (original) => ({
	...(await original<
		typeof import("../../chat/config/chat-config.context")
	>()),
	useChatConfig: () => ({
		callbacks: { onOpenRoom: vi.fn(), onOpenNewChat: mocks.onOpenNewChat },
	}),
}));
vi.mock("@semoss/sdk/react", () => ({
	usePixel: () => ({ data: [], refresh: vi.fn() }),
}));
vi.mock("../../chat/provider/chat-session.context", async (original) => {
	const { fakeStore } = await import("../../../test/fake-store");
	const chat = fakeStore({
		keys: { roomCounter: 0 },
		renameRoom: mocks.renameRoom,
	});
	return {
		...(await original<
			typeof import("../../chat/provider/chat-session.context")
		>()),
		useChatSession: () => ({ chat }),
	};
});

/** Only the fields the room's name reads. */
const room = fakeStore({
	roomId: "r1",
	metadata: { name: "Quarterly plan", dateCreated: "" },
	options: { instructions: "", mcp: [] },
	agentTools: [],
	chatOptions: testChatOptions(),
}) as unknown as RoomStore;

beforeEach(() => {
	mocks.onOpenNewChat.mockReset();
	mocks.renameRoom.mockReset().mockResolvedValue(undefined);
});

/**
 * Double-click the room's name to edit it.
 *
 * @param user - The test's user-event session.
 * @returns The rename field, once it shows.
 */
async function startRename(user: ReturnType<typeof userEvent.setup>) {
	await user.dblClick(screen.getByText("Quarterly plan"));
	return screen.findByRole("textbox", { name: "header.renameLabel" });
}

/** The room's name, inside the actions its rename goes through. */
function renderTitle() {
	return render(
		<RoomActionsProvider room={room}>
			<RoomTitle />
		</RoomActionsProvider>,
	);
}

test("the room's name is a heading, with no menu of its own", () => {
	renderTitle();
	expect(
		screen.getByRole("heading", { name: "Quarterly plan" }),
	).toBeVisible();
	expect(screen.queryByRole("button", { name: /Quarterly plan/ })).toBeNull();
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

test("the field takes focus as a double-click opens it", async () => {
	const user = userEvent.setup();
	renderTitle();
	const field = await startRename(user);
	await waitFor(() => expect(field).toHaveFocus());
});

test("rename saves the trimmed name", async () => {
	const user = userEvent.setup();
	renderTitle();
	const field = await startRename(user);
	await user.clear(field);
	await user.type(field, "  Q4 plan  {Enter}");
	expect(mocks.renameRoom).toHaveBeenCalledWith("r1", "Q4 plan");
});
