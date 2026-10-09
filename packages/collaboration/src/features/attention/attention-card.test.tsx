import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { CollaborationState } from "@/features/collaboration/state/collaboration.types";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import { loadSourceThread } from "@/features/rooms/source-import/load-source-thread";
import { updateTopicTask } from "@/features/topics/api/update-topic-task";
import { type AttentionItem, buildAttentionItems } from "./attention.model";
import { AttentionCard } from "./attention-card";

const insightActions = vi.hoisted(() => ({}));

vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions: insightActions }),
}));
vi.mock("./attention.context", () => ({
	useAttention: () => ({ setPriority: vi.fn() }),
}));
vi.mock("@/features/topics/api/update-topic-task", () => ({
	updateTopicTask: vi.fn(),
}));
vi.mock("@/features/rooms/source-import/load-source-thread", () => ({
	loadSourceThread: vi.fn(),
}));

function taskState(): CollaborationState {
	const state = createInitialCollaborationState();
	const first = state.items[0];
	if (!first) throw new Error("Missing task fixture");
	state.items = [
		{
			...first,
			id: "task",
			title: "Review launch",
			status: "open",
			askType: "review",
			threadId: "",
			roomId: undefined,
			priority: null,
			reasons: ["Confirm the launch details"],
			topicIds: [],
			isSample: false,
		},
	];
	state.reviews = [];
	state.memories = [];
	state.threads = [];
	return state;
}

/** Render from current session state so completed records disappear just as they do in a topic. */
function CurrentCards() {
	const { state } = useCollaborationSession();
	return (
		<>
			{buildAttentionItems(state, {
				runs: [],
				delegations: [],
				roomSource: () => undefined,
			}).map((item) => (
				<AttentionCard key={item.id} item={item} />
			))}
		</>
	);
}

function renderCards(state = taskState(), item?: AttentionItem) {
	render(
		<MemoryRouter>
			<CollaborationSessionProvider initialState={state}>
				<main tabIndex={-1}>
					{item ? <AttentionCard item={item} /> : <CurrentCards />}
				</main>
			</CollaborationSessionProvider>
		</MemoryRouter>,
	);
	return userEvent.setup();
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

it("opens source-less task details without attempting an empty source read", async () => {
	const user = renderCards();
	await user.click(screen.getByRole("button", { name: "Review launch" }));
	const review = screen.getByRole("dialog", { name: "Review launch" });
	expect(
		within(review).getByText(
			"This task has no linked source conversation.",
		),
	).toBeVisible();
	expect(
		within(review).getByText("Confirm the launch details"),
	).toBeVisible();
	expect(loadSourceThread).not.toHaveBeenCalled();
});

it("retains task review and inline failure until a retry successfully saves", async () => {
	const state = taskState();
	const task = state.items[0];
	if (!task) throw new Error("Missing task fixture");
	vi.mocked(updateTopicTask).mockRejectedValueOnce(
		new Error("Task could not be saved"),
	);
	const user = renderCards(state);
	await user.click(screen.getByRole("button", { name: "Review launch" }));
	await user.click(screen.getByRole("button", { name: "Mark reviewed" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Task could not be saved",
	);
	expect(screen.getByRole("dialog", { name: "Review launch" })).toBeVisible();
	vi.mocked(updateTopicTask).mockResolvedValueOnce({
		...task,
		status: "done",
	});
	await user.click(screen.getByRole("button", { name: "Mark reviewed" }));
	expect(updateTopicTask).toHaveBeenLastCalledWith({}, "task", {
		status: "done",
	});
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("opens a saved task room before the source and sends agent approvals to their owning room", () => {
	const state = taskState();
	state.items = state.items.map((item) => ({
		...item,
		roomId: "saved",
		threadId: "source",
	}));
	renderCards(state);
	expect(screen.getByRole("link", { name: "Review launch" })).toHaveAttribute(
		"href",
		"/thread/room%3Asaved",
	);
	cleanup();
	const item: AttentionItem = {
		kind: "action",
		id: "action:approval",
		title: "Approve outline",
		detail: "Outline is ready",
		sourceLabel: "Assistant",
		topicIds: [],
		topicStatus: "ready",
		priority: null,
		due: null,
		received: null,
		score: null,
		isSample: false,
		action: { actionId: "approval", runId: "run", toolCallId: "tool-call" },
		run: {
			runId: "run",
			roomId: "approval-room",
			status: "INPUT_REQUIRED",
			pendingActions: [],
		},
		delegation: null,
	};
	renderCards(state, item);
	expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute(
		"href",
		"/thread/room%3Aapproval-room?item=tool-call",
	);
	expect(updateTopicTask).not.toHaveBeenCalled();
});

it("keeps the confirmed priority after a failed change from an unprioritized task", async () => {
	vi.mocked(updateTopicTask).mockRejectedValueOnce(
		new Error("Priority unavailable"),
	);
	const user = renderCards();
	await user.click(
		screen.getByRole("button", {
			name: "Priority for Review launch: Unprioritized",
		}),
	);
	await user.click(screen.getByRole("menuitemradio", { name: "Normal" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Priority unavailable",
	);
	expect(
		screen.getByRole("button", {
			name: "Priority for Review launch: Unprioritized",
		}),
	).toBeVisible();
	expect(updateTopicTask).toHaveBeenCalledWith({}, "task", {
		priority: "P2",
	});
});
