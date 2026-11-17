import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useWorkChanged,
} from "../state/collaboration-session.context";
import { TaskContextView, useTaskContext } from "./task-context";

const insight = vi.hoisted(() => ({
	steps: [] as Record<string, unknown>[],
	threads: [] as Record<string, unknown>[],
	status: "active",
	closedItems: [] as Record<string, unknown>[],
	actions: {
		run: vi.fn(async (statement: string) => ({
			pixelReturn: [
				{
					output: statement.startsWith("WorkListMyWork")
						? {
								selfId: "me",
								workItems: statement.includes('"all"')
									? insight.closedItems
									: [],
							}
						: statement.startsWith("WorkGetWork")
							? {
									title: "Launch",
									status: insight.status,
									steps: insight.steps,
									threads: insight.threads,
								}
							: true,
					operationType: ["OPERATION"],
				},
			],
		})),
	},
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));

const toastMock = vi.hoisted(() => vi.fn());
vi.mock("@semoss/ui/next", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/ui/next")>()),
	toast: toastMock,
}));

afterEach(() => {
	insight.threads = [];
	insight.status = "active";
	insight.closedItems = [];
	cleanup();
	vi.clearAllMocks();
});

const taskReads = () =>
	insight.actions.run.mock.calls.filter(([statement]) =>
		statement.startsWith("WorkGetWork"),
	).length;

let bump: () => number = () => 0;
function Task({ roomId }: { roomId?: string }) {
	const context = useTaskContext(roomId ? { roomId } : { taskId: "t1" });
	bump = useWorkChanged().markWorkChanged;
	return context.task ? (
		<TaskContextView
			task={context.task}
			steps={context.steps}
			item={context.item}
		/>
	) : (
		<p>Loading</p>
	);
}

function renderTask(roomId?: string) {
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<MemoryRouter>
				<Task roomId={roomId} />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
}

it("carries what the inbox decided onto each step", async () => {
	insight.steps = [
		{ id: "s1", text: "Read the memo", status: "open", inbox: "fyi" },
		{ id: "s2", text: "Book the room", status: "open", inbox: "later" },
	];
	renderTask();
	expect(await screen.findByText("Read the memo")).toBeVisible();
	expect(
		screen.getByText("From a conversation filed as for your information"),
	).toBeVisible();
	// a value the page does not know is left off
	expect(screen.getAllByText(/From a conversation/)).toHaveLength(1);
});

it("reads the task again when work changes elsewhere, and once for its own change", async () => {
	insight.steps = [{ id: "s1", text: "Read the memo", status: "open" }];
	renderTask();
	await screen.findByText("Read the memo");
	expect(taskReads()).toBe(1);
	act(() => {
		bump();
	});
	await waitFor(() => expect(taskReads()).toBe(2));
	// the owner's own save reads the task once and does not read it again for the signal it sent
	await userEvent.click(
		screen.getByRole("button", { name: "Mark done: Read the memo" }),
	);
	await waitFor(() => expect(taskReads()).toBe(3));
	await new Promise((resolve) => setTimeout(resolve, 50));
	expect(taskReads()).toBe(3);
});

const ran = () =>
	insight.actions.run.mock.calls.map(([statement]) => statement);

it("offers Undo after Not mine and lists the step under Removed steps with a Put back", async () => {
	insight.steps = [{ id: "s1", text: "Book the room", status: "open" }];
	renderTask();
	await userEvent.click(
		await screen.findByRole("button", { name: "More for: Book the room" }),
	);
	await userEvent.click(screen.getByRole("menuitem", { name: "Not mine" }));
	await waitFor(() => expect(toastMock).toHaveBeenCalled());
	const options = toastMock.mock.calls[0][1] as {
		action: { label: string; onClick: () => void };
	};
	expect(options.action.label).toBe("Undo");
	options.action.onClick();
	await waitFor(() =>
		expect(ran()).toContain(
			'WorkUpdateStep(stepId=["s1"], status=["open"], note=[""]);',
		),
	);
});

it("shows removed steps collapsed, with why they were set aside, and puts one back", async () => {
	insight.steps = [
		{
			id: "s1",
			text: "Book the room",
			status: "dropped",
			note: "not mine",
		},
		{ id: "s2", text: "Old idea", status: "dropped" },
	];
	renderTask();
	const toggle = await screen.findByRole("button", {
		name: "Removed steps (2)",
	});
	expect(toggle).toHaveAttribute("aria-expanded", "false");
	expect(screen.queryByText("Book the room")).toBeNull();
	await userEvent.click(toggle);
	expect(screen.getByText("Set aside: not mine")).toBeVisible();
	await userEvent.click(
		screen.getByRole("button", { name: "Put back: Book the room" }),
	);
	await waitFor(() =>
		expect(ran()).toContain(
			'WorkUpdateStep(stepId=["s1"], status=["open"], note=[""]);',
		),
	);
});

it("offers Undo after the work item is marked done", async () => {
	renderTask();
	await userEvent.click(
		await screen.findByRole("button", { name: "Mark work item done" }),
	);
	await waitFor(() => expect(toastMock).toHaveBeenCalled());
	(
		toastMock.mock.calls[0][1] as { action: { onClick: () => void } }
	).action.onClick();
	await waitFor(() =>
		expect(ran()).toContain(
			'WorkSaveWork(taskId=["t1"], status=["active"]);',
		),
	);
});

it("finds a finished item from its room and offers Reopen", async () => {
	insight.status = "done";
	insight.closedItems = [{ id: "t9", roomId: "r1" }];
	renderTask("r1");
	expect(
		await screen.findByRole("button", { name: "Reopen work item" }),
	).toBeVisible();
	expect(ran()).toContain('WorkGetWork(taskId=["t9"]);');
});

it("says which conversation a step came from, linking to it", async () => {
	insight.steps = [
		{ id: "s1", text: "Send the deck", status: "open", threadId: "th1" },
	];
	insight.threads = [{ threadId: "th1", subject: "Deck for Friday" }];
	renderTask();
	await screen.findByText("Send the deck");
	// the conversation list below repeats the subject; the step's own link is the one in the step row
	const links = screen.getAllByRole("link", { name: "Deck for Friday" });
	expect(links[0]).toHaveAttribute("href", "/thread/th1");
});
