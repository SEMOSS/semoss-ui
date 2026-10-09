import {
	act,
	render,
	renderHook,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode, useRef } from "react";
import { MemoryRouter } from "react-router";
import {
	WorkUpdatesContext,
	type WorkUpdatesStatus,
} from "@/features/collaboration/live/work-updates.context";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import type { InsightActions } from "@/lib/pixel";
import { saveTopicGoal } from "./api/save-topic-goal";
import { updateTopicTask } from "./api/update-topic-task";
import { TopicGoalEditor } from "./topic-goal-editor";
import { TopicTaskRow } from "./topic-task-row";
import { directItem, savedTopic } from "./topic-test-fixtures";
import { useTopicTaskAction } from "./use-topic-task-action";

const mocks = vi.hoisted(() => ({
	actions: { run: vi.fn() },
	change: vi.fn(),
	close: vi.fn(),
}));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions: mocks.actions }),
}));
const response = (output: unknown) => ({
	pixelReturn: [{ output, operationType: [] }],
});
const task = {
	...directItem,
	topicIds: [savedTopic.id],
	roomId: null,
	assignee: null,
	status: "open" as const,
};
beforeEach(() => vi.resetAllMocks());

function Wrapper({
	children,
	updates = null,
}: {
	children: ReactNode;
	updates?: WorkUpdatesStatus | null;
}) {
	const state = {
		...createInitialCollaborationState(),
		topics: [savedTopic],
		items: [task],
	};
	return (
		<MemoryRouter>
			<CollaborationSessionProvider
				initialState={state}
				onChange={mocks.change}
			>
				<WorkUpdatesContext value={updates}>
					{children}
				</WorkUpdatesContext>
			</CollaborationSessionProvider>
		</MemoryRouter>
	);
}

it("validates mutation identities and sends the existing goal and task contracts", async () => {
	mocks.actions.run.mockResolvedValueOnce(
		response({ ...task, status: "done" }),
	);
	await expect(
		updateTopicTask(mocks.actions as unknown as InsightActions, task.id, {
			status: "done",
			priority: null,
		}),
	).resolves.toMatchObject({ status: "done" });
	expect(mocks.actions.run.mock.calls[0][0]).toContain("priority=[]");
	mocks.actions.run.mockResolvedValueOnce(
		response({ noteId: "goal", text: "Ready", status: "open" }),
	);
	await expect(
		saveTopicGoal(
			mocks.actions as unknown as InsightActions,
			savedTopic.id,
			{ text: "Ready", status: "open" },
		),
	).resolves.toEqual({ noteId: "goal", text: "Ready", status: "open" });
	expect(mocks.actions.run.mock.calls[1][0]).toContain(
		'kind=["goal"], text=["Ready"], state=["open"]',
	);
	mocks.actions.run.mockResolvedValueOnce(response({ ...task, id: "wrong" }));
	await expect(
		updateTopicTask(mocks.actions as unknown as InsightActions, task.id, {
			status: "done",
		}),
	).rejects.toThrow("did not match");
	mocks.actions.run.mockResolvedValueOnce(
		response({ noteId: "wrong", text: "Ready", status: "open" }),
	);
	await expect(
		saveTopicGoal(
			mocks.actions as unknown as InsightActions,
			savedTopic.id,
			{ noteId: "goal", text: "Ready", status: "open" },
		),
	).rejects.toThrow("did not match");
});

it("keeps a failed source-less task actionable, opens details, and retries completion", async () => {
	const user = userEvent.setup();
	mocks.actions.run.mockRejectedValueOnce(new Error("Save failed"));
	function Row() {
		const { state } = useCollaborationSession();
		return (
			<ul>
				<TopicTaskRow item={state.items[0]} />
			</ul>
		);
	}
	render(
		<Wrapper>
			<Row />
		</Wrapper>,
	);
	expect(
		screen.queryByRole("link", { name: task.title }),
	).not.toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: task.title }));
	expect(
		await screen.findByText("This task has no linked source conversation."),
	).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Close review" }));
	await user.click(
		screen.getByRole("checkbox", { name: `Complete ${task.title}` }),
	);
	expect(await screen.findByRole("alert")).toHaveTextContent("Save failed");
	expect(screen.getByRole("checkbox")).not.toBeChecked();
	mocks.actions.run.mockResolvedValueOnce(
		response({ ...task, status: "done" }),
	);
	await user.click(
		screen.getByRole("checkbox", { name: `Complete ${task.title}` }),
	);
	await waitFor(() =>
		expect(
			screen.getByRole("checkbox", { name: `Reopen ${task.title}` }),
		).toBeChecked(),
	);
});

it("blocks duplicate updates, awaits queued saves, and maps legacy local identities", async () => {
	let release: (() => void) | undefined;
	const settled = vi.fn(
		() =>
			new Promise<void>((resolve) => {
				release = resolve;
			}),
	);
	const updates: WorkUpdatesStatus = {
		isRefreshing: false,
		lastUpdated: null,
		error: "",
		lastMailCheck: null,
		refresh: vi.fn(),
		isSyncing: false,
		lastSync: null,
		syncError: "",
		syncMail: vi.fn(),
		settled,
		serverId: (id: string) => (id === task.id ? "canonical-task" : id),
		localId: (id: string) => (id === "canonical-task" ? task.id : id),
	};
	mocks.actions.run.mockResolvedValue(
		response({ ...task, id: "canonical-task", status: "done" }),
	);
	const { result } = renderHook(() => useTopicTaskAction(task), {
		wrapper: ({ children }) => (
			<Wrapper updates={updates}>{children}</Wrapper>
		),
	});
	let first: Promise<boolean>;
	act(() => {
		first = result.current.update({ status: "done" });
	});
	expect(result.current.isPending).toBe(true);
	await act(async () => {
		expect(await result.current.update({ status: "done" })).toBe(false);
	});
	expect(mocks.actions.run).not.toHaveBeenCalled();
	await act(async () => {
		release?.();
		await first;
	});
	expect(mocks.actions.run).toHaveBeenCalledExactlyOnceWith(
		'WorkUpdateItem(itemId=["canonical-task"], status=["done"]);',
	);
	expect(
		mocks.change.mock.calls.flatMap(([change]) => change.commands),
	).toContainEqual(
		expect.objectContaining({
			type: "item.received",
			item: expect.objectContaining({ id: task.id, status: "done" }),
		}),
	);
});

it("preserves a goal draft after a failed save, then saves once using its canonical identity", async () => {
	const user = userEvent.setup();
	mocks.actions.run.mockRejectedValueOnce(new Error("Goal save failed"));
	function Editor() {
		const trigger = useRef<HTMLButtonElement>(null);
		return (
			<TopicGoalEditor
				topic={savedTopic}
				onClose={mocks.close}
				returnFocusRef={trigger}
			/>
		);
	}
	render(
		<Wrapper>
			<Editor />
		</Wrapper>,
	);
	const input = screen.getByRole("textbox", { name: "Goal (required)" });
	await user.click(screen.getByRole("button", { name: "Save goal" }));
	expect(screen.getByText("Enter a goal for this topic.")).toBeVisible();
	expect(input).toHaveFocus();
	expect(mocks.actions.run).not.toHaveBeenCalled();
	await user.type(input, "Be ready before departure");
	await user.click(screen.getByRole("button", { name: "Save goal" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Goal save failed",
	);
	expect(input).toHaveValue("Be ready before departure");
	expect(mocks.close).not.toHaveBeenCalled();
	mocks.actions.run.mockResolvedValueOnce(
		response({
			noteId: "saved-goal",
			text: "Be ready before departure",
			status: "open",
		}),
	);
	await user.click(screen.getByRole("button", { name: "Save goal" }));
	await waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
	expect(
		mocks.change.mock.calls.flatMap(([change]) => change.commands),
	).toContainEqual({
		type: "topic.goal.received",
		topicId: savedTopic.id,
		goal: {
			noteId: "saved-goal",
			text: "Be ready before departure",
			status: "open",
		},
	});
});
