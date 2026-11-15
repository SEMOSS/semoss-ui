import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useWorkChanged,
} from "../state/collaboration-session.context";
import { TaskContextView, useTaskContext } from "./task-context";

const insight = vi.hoisted(() => ({
	steps: [] as Record<string, unknown>[],
	actions: {
		run: vi.fn(async (statement: string) => ({
			pixelReturn: [
				{
					output: statement.startsWith("WorkListMyWork")
						? { selfId: "me", workItems: [] }
						: statement.startsWith("WorkGetWork")
							? { title: "Launch", steps: insight.steps }
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

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

const taskReads = () =>
	insight.actions.run.mock.calls.filter(([statement]) =>
		statement.startsWith("WorkGetWork"),
	).length;

let bump: () => number = () => 0;
function Task() {
	const context = useTaskContext({ taskId: "t1" });
	bump = useWorkChanged().markWorkChanged;
	return context.task ? (
		<TaskContextView task={context.task} steps={context.steps} />
	) : (
		<p>Loading</p>
	);
}

function renderTask() {
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<Task />
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
