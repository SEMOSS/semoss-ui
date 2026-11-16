import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ROOM_HISTORY_CHANGED } from "@/features/rooms/api/list-rooms";
import { roomPath } from "@/lib/workspace-paths";
import { ROUTINE_RUN_DELETED } from "./api/delete-routine-run";
import { ROUTINE_RUNS_CHANGED } from "./api/list-recent-routine-runs";
import { RoutineRunMenu } from "./routine-run-menu";

// one actions object, as the provider gives
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	toast,
}));

const DELETE =
	'WorkDeleteRoutineRun(routineId=["inbox-daily-brief"], runId=["inbox-2"]);';

function Location() {
	return <output aria-label="Location">{useLocation().pathname}</output>;
}

function renderMenu(path = "/routines") {
	const onDeleted = vi.fn();
	render(
		<MemoryRouter initialEntries={[path]}>
			<RoutineRunMenu
				routineId="inbox-daily-brief"
				runId="inbox-2"
				routineName="Inbox daily brief agent"
				when="Today, 9:34 AM"
				onDeleted={onDeleted}
			/>
			<Location />
		</MemoryRouter>,
	);
	return { onDeleted, user: userEvent.setup() };
}

/** Opens the run's menu and chooses Delete run. */
async function chooseDelete(user: ReturnType<typeof userEvent.setup>) {
	const trigger = screen.getByRole("button", {
		name: "More actions for the Inbox daily brief agent run from Today, 9:34 AM",
	});
	act(() => trigger.focus());
	await user.keyboard("{Enter}");
	await user.click(
		await screen.findByRole("menuitem", { name: "Delete run" }),
	);
	return screen.findByRole("dialog", { name: "Delete this run?" });
}

const changed = vi.fn();
const deleted = vi.fn();
const chats = vi.fn();
beforeEach(() => {
	vi.clearAllMocks();
	insight.actions.run.mockResolvedValue({
		pixelReturn: [
			{
				output: { deleted: true, roomIds: ["agent-room", "run-chat"] },
				operationType: ["OPERATION"],
			},
		],
	});
	window.addEventListener(ROUTINE_RUNS_CHANGED, changed);
	window.addEventListener(ROUTINE_RUN_DELETED, deleted);
	window.addEventListener(ROOM_HISTORY_CHANGED, chats);
});
afterEach(() => {
	window.removeEventListener(ROUTINE_RUNS_CHANGED, changed);
	window.removeEventListener(ROUTINE_RUN_DELETED, deleted);
	window.removeEventListener(ROOM_HISTORY_CHANGED, chats);
	cleanup();
});

it("asks before deleting and leaves the run alone on Cancel", async () => {
	const { onDeleted, user } = renderMenu();
	const dialog = await chooseDelete(user);
	expect(dialog).toHaveTextContent(
		"The Inbox daily brief agent run from Today, 9:34 AM is removed from the routine's history, with the chats opened from it.",
	);
	await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(insight.actions.run).not.toHaveBeenCalled();
	expect(onDeleted).not.toHaveBeenCalled();
	expect(changed).not.toHaveBeenCalled();
	expect(chats).not.toHaveBeenCalled();
});

it("deletes the run and its chats, then moves focus before the lists re-read", async () => {
	const { onDeleted, user } = renderMenu();
	const dialog = await chooseDelete(user);
	await user.click(
		within(dialog).getByRole("button", { name: "Delete run" }),
	);
	expect(insight.actions.run).toHaveBeenCalledExactlyOnceWith(DELETE);
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(toast.success).toHaveBeenCalledWith("Run deleted.");
	expect(chats).toHaveBeenCalledOnce();
	// the chat list drops these rooms, which a reset load alone would keep
	expect(chats.mock.calls[0]?.[0]).toMatchObject({
		detail: { deletedRoomIds: ["agent-room", "run-chat"] },
	});
	expect(onDeleted).toHaveBeenCalledOnce();
	expect(changed).toHaveBeenCalledOnce();
	expect(deleted).toHaveBeenCalledOnce();
	// focus first, so no list drops the element that holds it
	for (const list of [changed, deleted])
		expect(onDeleted.mock.invocationCallOrder[0]).toBeLessThan(
			list.mock.invocationCallOrder[0] ?? 0,
		);
	// no deleted chat was open, so the page stays
	expect(screen.getByRole("status", { name: "Location" })).toHaveTextContent(
		"/routines",
	);
});

it("leaves a deleted chat that is open", async () => {
	const { user } = renderMenu(roomPath("run-chat"));
	const dialog = await chooseDelete(user);
	await user.click(
		within(dialog).getByRole("button", { name: "Delete run" }),
	);
	await waitFor(() =>
		expect(
			screen.getByRole("status", { name: "Location" }),
		).toHaveTextContent(/^\/$/),
	);
});

it("keeps the dialog open with the reason when the delete fails", async () => {
	insight.actions.run.mockRejectedValue(
		new Error("This run is still going. Delete it once it has finished."),
	);
	const { onDeleted, user } = renderMenu();
	const dialog = await chooseDelete(user);
	await user.click(
		within(dialog).getByRole("button", { name: "Delete run" }),
	);
	expect(await within(dialog).findByRole("alert")).toHaveTextContent(
		"This run is still going. Delete it once it has finished.",
	);
	expect(screen.getByRole("dialog")).toBe(dialog);
	expect(onDeleted).not.toHaveBeenCalled();
	expect(changed).not.toHaveBeenCalled();
	expect(chats).not.toHaveBeenCalled();
});
