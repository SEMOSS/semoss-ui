import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
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

function renderMenu() {
	const onDeleted = vi.fn();
	render(
		<RoutineRunMenu
			routineId="inbox-daily-brief"
			runId="inbox-2"
			routineName="Inbox daily brief agent"
			when="Today, 9:34 AM"
			onDeleted={onDeleted}
		/>,
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
beforeEach(() => {
	vi.clearAllMocks();
	insight.actions.run.mockResolvedValue({
		pixelReturn: [
			{ output: { deleted: true }, operationType: ["OPERATION"] },
		],
	});
	window.addEventListener(ROUTINE_RUNS_CHANGED, changed);
});
afterEach(() => {
	window.removeEventListener(ROUTINE_RUNS_CHANGED, changed);
	cleanup();
});

it("asks before deleting and leaves the run alone on Cancel", async () => {
	const { onDeleted, user } = renderMenu();
	const dialog = await chooseDelete(user);
	expect(dialog).toHaveTextContent(
		"The Inbox daily brief agent run from Today, 9:34 AM is removed from the routine's history.",
	);
	await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(insight.actions.run).not.toHaveBeenCalled();
	expect(onDeleted).not.toHaveBeenCalled();
	expect(changed).not.toHaveBeenCalled();
});

it("deletes the run, then moves focus before the sidebar re-reads", async () => {
	const { onDeleted, user } = renderMenu();
	const dialog = await chooseDelete(user);
	await user.click(
		within(dialog).getByRole("button", { name: "Delete run" }),
	);
	expect(insight.actions.run).toHaveBeenCalledExactlyOnceWith(DELETE);
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(toast.success).toHaveBeenCalledWith("Run deleted.");
	expect(onDeleted).toHaveBeenCalledOnce();
	expect(changed).toHaveBeenCalledOnce();
	// focus first, so the list never drops the element that holds it
	expect(onDeleted.mock.invocationCallOrder[0]).toBeLessThan(
		changed.mock.invocationCallOrder[0] ?? 0,
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
});
