import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MAIL_SENT_EVENT } from "@/features/connectors/api/microsoft";
import { ROOM_TREE_CHANGED } from "@/features/room-tree/room-tree-events";
import type { InsightActions } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { readWorkUpdates, syncMail, type WorkUpdates } from "./live-state";
import type { LiveSync } from "./live-sync";
import { WorkRefreshStatus } from "./work-refresh-status";
import { useWorkUpdates } from "./work-updates.context";
import { WorkUpdatesProvider } from "./work-updates-provider";

vi.mock("./live-state", () => ({
	readWorkUpdates: vi.fn(),
	syncMail: vi.fn(),
}));
const roomTreeChanged = vi.fn();
beforeEach(() => {
	roomTreeChanged.mockClear();
	window.addEventListener(ROOM_TREE_CHANGED, roomTreeChanged);
});
afterEach(() => {
	window.removeEventListener(ROOM_TREE_CHANGED, roomTreeChanged);
});
function Harness() {
	const updates = useWorkUpdates();
	const { state, dispatch } = useCollaborationSession();
	const threadId = state.threads[0].id;
	return (
		<>
			<button type="button" onClick={updates?.refresh}>
				Refresh
			</button>
			<button
				type="button"
				onClick={() =>
					dispatch({
						type: "workspace.step",
						threadId,
						operation: "remove",
						step: { id: "local-step-1" },
					})
				}
			>
				Remove
			</button>
			<output>
				{state.workspaces[threadId].steps
					.map((step) => step.text)
					.join(",")}
			</output>
			<p>{updates?.error}</p>
		</>
	);
}
it("deduplicates server echoes, ignores removed actions during a refresh, and releases its listener", async () => {
	const state = createInitialCollaborationState();
	const threadId = state.threads[0].id;
	state.workspaces[threadId].steps = [
		{
			id: "local-step-1",
			text: "Saved reminder",
			ownerId: "me",
			due: null,
			status: "open",
			kind: "task",
			isUserEdited: true,
		},
	];
	const updates = {
		threads: [state.threads[0]],
		items: [],
		memories: [],
		lastMailCheck: null,
		workspaces: {
			[threadId]: {
				...state.workspaces[threadId],
				steps: [
					{
						...state.workspaces[threadId].steps[0],
						id: "server-step",
					},
				],
			},
		},
	};
	const sync: LiveSync = Object.assign(vi.fn(), {
		settled: async () => undefined,
		localId: (id: string) => (id === "server-step" ? "local-step-1" : id),
	});
	vi.mocked(readWorkUpdates).mockResolvedValueOnce(updates);
	const view = render(
		<CollaborationSessionProvider initialState={state}>
			<WorkUpdatesProvider actions={{} as InsightActions} sync={sync}>
				<Harness />
			</WorkUpdatesProvider>
		</CollaborationSessionProvider>,
	);
	fireEvent.click(screen.getByText("Refresh"));
	await waitFor(() => expect(readWorkUpdates).toHaveBeenCalledTimes(1));
	expect(screen.getByRole("status")).toHaveTextContent(/^Saved reminder$/);
	let finish: ((value: typeof updates) => void) | undefined;
	vi.mocked(readWorkUpdates).mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	fireEvent.click(screen.getByText("Refresh"));
	await waitFor(() => expect(readWorkUpdates).toHaveBeenCalledTimes(2));
	fireEvent.click(screen.getByText("Refresh"));
	expect(readWorkUpdates).toHaveBeenCalledTimes(2);
	fireEvent.click(screen.getByText("Remove"));
	await act(async () => finish?.(updates));
	expect(screen.getByRole("status")).toBeEmptyDOMElement();
	view.unmount();
	fireEvent(window, new Event("focus"));
	expect(readWorkUpdates).toHaveBeenCalledTimes(2);
});

it("pulls new mail before reloading when Refresh is pressed, and shows sync failures", async () => {
	const state = createInitialCollaborationState();
	vi.mocked(readWorkUpdates).mockResolvedValue({
		threads: state.threads,
		items: [],
		workspaces: {},
		memories: [],
		lastMailCheck: null,
	});
	vi.mocked(syncMail)
		.mockResolvedValueOnce({
			newMessages: 2,
			closedByReply: 0,
			outcomes: { new: 1, automated: 1 },
			changes: [
				{ threadId: state.threads[0].id, outcome: "new" },
				{ threadId: state.threads[1].id, outcome: "automated" },
			],
		})
		.mockRejectedValueOnce(new Error("Microsoft login expired"));
	render(
		<MemoryRouter>
			<CollaborationSessionProvider initialState={state}>
				<WorkUpdatesProvider actions={{} as InsightActions}>
					<WorkRefreshStatus />
				</WorkUpdatesProvider>
			</CollaborationSessionProvider>
		</MemoryRouter>,
	);
	const reloads = vi.mocked(readWorkUpdates).mock.calls.length;
	fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
	await waitFor(() =>
		expect(
			screen.getByText(/1 new for you, 1 automated/),
		).toBeInTheDocument(),
	);
	fireEvent.click(
		screen.getByRole("button", {
			name: "What came in: 1 new for you, 1 automated",
		}),
	);
	expect(await screen.findByText("What came in")).toBeInTheDocument();
	expect(
		screen.getByRole("link", { name: state.threads[0].subject }),
	).toHaveAttribute(
		"href",
		`/thread/${encodeURIComponent(state.threads[0].id)}`,
	);
	// automated mail has no Work item, so it stays on the Brain thread page
	expect(
		screen.getByRole("link", { name: state.threads[1].subject }),
	).toHaveAttribute(
		"href",
		`/brain/threads/${encodeURIComponent(state.threads[1].id)}`,
	);
	expect(screen.getByText("Automated, no review needed")).toBeInTheDocument();
	expect(syncMail).toHaveBeenCalledTimes(1);
	expect(vi.mocked(readWorkUpdates).mock.calls.length).toBeGreaterThan(
		reloads,
	);
	fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
	await waitFor(() =>
		expect(screen.getByText("Microsoft login expired")).toBeInTheDocument(),
	);
	expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
});

it("syncs once shortly after a reply is sent from the app", async () => {
	vi.useFakeTimers();
	try {
		const state = createInitialCollaborationState();
		vi.mocked(readWorkUpdates).mockResolvedValue({
			threads: state.threads,
			items: [],
			workspaces: {},
			memories: [],
			lastMailCheck: null,
		});
		vi.mocked(syncMail).mockClear();
		vi.mocked(syncMail).mockResolvedValue({
			newMessages: 1,
			closedByReply: 1,
			outcomes: { cleared: 1 },
			changes: [],
		});
		render(
			<CollaborationSessionProvider initialState={state}>
				<WorkUpdatesProvider actions={{} as InsightActions}>
					<WorkRefreshStatus />
				</WorkUpdatesProvider>
			</CollaborationSessionProvider>,
		);
		window.dispatchEvent(new Event(MAIL_SENT_EVENT));
		window.dispatchEvent(new Event(MAIL_SENT_EVENT));
		expect(syncMail).not.toHaveBeenCalled();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(5000);
		});
		expect(syncMail).toHaveBeenCalledTimes(1);
	} finally {
		vi.useRealTimers();
	}
});

it("refreshes the room tree only when a saved thread mapping changes", async () => {
	const state = createInitialCollaborationState();
	const updates = {
		threads: state.threads.map((thread) => ({
			...thread,
			summary: "Updated summary",
		})),
		items: [],
		workspaces: {},
		memories: [],
		lastMailCheck: null,
	};
	vi.mocked(readWorkUpdates).mockResolvedValue(updates);
	render(
		<CollaborationSessionProvider initialState={state}>
			<WorkUpdatesProvider actions={{} as InsightActions}>
				<Harness />
			</WorkUpdatesProvider>
		</CollaborationSessionProvider>,
	);
	await act(async () => fireEvent.click(screen.getByText("Refresh")));
	expect(roomTreeChanged).not.toHaveBeenCalled();
	vi.mocked(readWorkUpdates).mockResolvedValue({
		...updates,
		threads: updates.threads.map((thread, index) =>
			index === 0
				? {
						...thread,
						topicLinks: [
							{
								topicId: "new-topic",
								source: "you",
								confidence: null,
								primary: true,
							},
						],
					}
				: thread,
		),
	});
	await act(async () => fireEvent.click(screen.getByText("Refresh")));
	expect(roomTreeChanged).toHaveBeenCalledOnce();
	await act(async () => fireEvent.click(screen.getByText("Refresh")));
	expect(roomTreeChanged).toHaveBeenCalledOnce();
	vi.mocked(readWorkUpdates).mockRejectedValueOnce(
		new Error("Refresh unavailable"),
	);
	await act(async () => fireEvent.click(screen.getByText("Refresh")));
	expect(screen.getByText("Refresh unavailable")).toBeInTheDocument();
	expect(roomTreeChanged).toHaveBeenCalledOnce();
});

function PendingHarness() {
	const updates = useWorkUpdates();
	const { state, dispatch } = useCollaborationSession();
	return (
		<>
			<button type="button" onClick={updates?.refresh}>
				Refresh pending
			</button>
			<button
				type="button"
				onClick={() =>
					dispatch({
						type: "review.resolve",
						reviewId: "live-review",
						decision: "dismiss",
					})
				}
			>
				Dismiss review
			</button>
			<button
				type="button"
				onClick={() =>
					dispatch({
						type: "person.save",
						personId: "live-person",
						changes: { name: "My person edit" },
					})
				}
			>
				Edit person
			</button>
			<button
				type="button"
				onClick={() =>
					dispatch({
						type: "topic.save",
						topic: { id: "live-topic", name: "My topic edit" },
					})
				}
			>
				Edit topic
			</button>
			<button
				type="button"
				onClick={() =>
					dispatch({ type: "topic.delete", topicId: "deleted-topic" })
				}
			>
				Delete topic
			</button>
			<button
				type="button"
				onClick={() =>
					dispatch({
						type: "memory.delete",
						memoryId: "deleted-memory",
					})
				}
			>
				Delete memory
			</button>
			<output aria-label="Pending state">
				{JSON.stringify({
					reviews: state.reviews,
					memories: state.memories,
					topics: state.topics,
					people: state.people,
				})}
			</output>
			<output aria-label="Coverage">
				{JSON.stringify(updates?.pendingCoverage)}
			</output>
			<p>{updates?.error}</p>
		</>
	);
}

it("preserves review decisions, context edits, and deletions made while a pending snapshot is loading", async () => {
	const state = createInitialCollaborationState();
	state.reviews = [
		{
			id: "live-review",
			kind: "unassigned",
			text: "Review this",
			detail: "",
			refId: null,
			actions: [],
			status: "open",
			isSample: false,
		},
	];
	state.people = [{ ...state.people[0], id: "live-person", isSample: false }];
	state.topics = [
		{ ...state.topics[0], id: "live-topic", isSample: false },
		{ ...state.topics[0], id: "deleted-topic", isSample: false },
	];
	state.memories = [
		{ ...state.memories[0], id: "deleted-memory", isSample: false },
	];
	const updates: WorkUpdates = {
		threads: [],
		items: [],
		workspaces: {},
		reviews: state.reviews,
		topics: state.topics,
		people: state.people,
		memories: state.memories,
		pendingCoverage: { reviews: 1, suggestedMemories: 0 },
		lastMailCheck: null,
	};
	let finish: ((value: WorkUpdates) => void) | undefined;
	vi.mocked(readWorkUpdates)
		.mockReset()
		.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					finish = resolve;
				}),
		);
	render(
		<CollaborationSessionProvider initialState={state}>
			<WorkUpdatesProvider actions={{} as InsightActions}>
				<PendingHarness />
			</WorkUpdatesProvider>
		</CollaborationSessionProvider>,
	);
	fireEvent.click(screen.getByRole("button", { name: "Refresh pending" }));
	await waitFor(() => expect(readWorkUpdates).toHaveBeenCalledOnce());
	for (const name of [
		"Dismiss review",
		"Edit person",
		"Edit topic",
		"Delete topic",
		"Delete memory",
	])
		fireEvent.click(screen.getByRole("button", { name }));
	await act(async () => finish?.(updates));
	const rendered = screen.getByLabelText("Pending state");
	expect(rendered).toHaveTextContent('"status":"dismissed"');
	expect(rendered).toHaveTextContent("My person edit");
	expect(rendered).toHaveTextContent("My topic edit");
	expect(rendered).not.toHaveTextContent("deleted-topic");
	expect(rendered).not.toHaveTextContent("deleted-memory");
	expect(screen.getByLabelText("Coverage")).toHaveTextContent('"reviews":1');
});

it("keeps pending records and prior coverage visible after a failed refresh, then reconciles a successful empty snapshot", async () => {
	const state = createInitialCollaborationState();
	state.reviews = [
		{
			id: "live-review",
			kind: "unassigned",
			text: "Pending question",
			detail: "",
			refId: null,
			actions: [],
			status: "open",
			isSample: false,
		},
	];
	const updates: WorkUpdates = {
		threads: [],
		items: [],
		workspaces: {},
		memories: state.memories,
		reviews: state.reviews,
		pendingCoverage: { reviews: 1, suggestedMemories: 0 },
		lastMailCheck: null,
	};
	vi.mocked(readWorkUpdates)
		.mockReset()
		.mockResolvedValueOnce(updates)
		.mockRejectedValueOnce(new Error("Second review page unavailable"))
		.mockResolvedValueOnce({
			...updates,
			reviews: [],
			pendingCoverage: { reviews: 0, suggestedMemories: 0 },
		});
	render(
		<CollaborationSessionProvider initialState={state}>
			<WorkUpdatesProvider actions={{} as InsightActions}>
				<PendingHarness />
			</WorkUpdatesProvider>
		</CollaborationSessionProvider>,
	);
	await act(async () =>
		fireEvent.click(
			screen.getByRole("button", { name: "Refresh pending" }),
		),
	);
	expect(screen.getByLabelText("Coverage")).toHaveTextContent('"reviews":1');
	await act(async () =>
		fireEvent.click(
			screen.getByRole("button", { name: "Refresh pending" }),
		),
	);
	expect(
		screen.getByText("Second review page unavailable"),
	).toBeInTheDocument();
	expect(screen.getByLabelText("Pending state")).toHaveTextContent(
		"Pending question",
	);
	expect(screen.getByLabelText("Coverage")).toHaveTextContent('"reviews":1');
	await act(async () =>
		fireEvent.click(
			screen.getByRole("button", { name: "Refresh pending" }),
		),
	);
	expect(screen.getByLabelText("Pending state")).not.toHaveTextContent(
		"Pending question",
	);
	expect(screen.getByLabelText("Coverage")).toHaveTextContent('"reviews":0');
	expect(
		screen.queryByText("Second review page unavailable"),
	).not.toBeInTheDocument();
});

it("keeps local topic and memory identities connected when their saved server records refresh", async () => {
	const state = createInitialCollaborationState();
	state.reviews = [];
	state.topics = [
		{
			...state.topics[0],
			id: "local-topic",
			isSample: false,
			goals: [{ noteId: "local-note", text: "Goal", status: "open" }],
		},
	];
	state.memories = [
		{
			...state.memories[0],
			id: "local-memory",
			isSample: false,
			about: [{ type: "topic", id: "local-topic" }],
		},
	];
	const updates: WorkUpdates = {
		threads: [],
		items: [],
		workspaces: {},
		lastMailCheck: null,
		topics: [
			{
				...state.topics[0],
				id: "server-topic",
				goals: [
					{ noteId: "server-note", text: "Goal", status: "open" },
				],
			},
		],
		memories: [
			{
				...state.memories[0],
				id: "server-memory",
				about: [{ type: "topic", id: "server-topic" }],
			},
		],
		reviews: [
			{
				id: "review",
				kind: "new_topic",
				text: "Review",
				detail: "",
				refId: "server-topic",
				status: "open",
				isSample: false,
				actions: [],
			},
		],
	};
	vi.mocked(readWorkUpdates).mockReset().mockResolvedValue(updates);
	const sync: LiveSync = Object.assign(vi.fn(), {
		settled: async () => undefined,
		localId: (id: string) => id.replace(/^server-/, "local-"),
	});
	render(
		<CollaborationSessionProvider initialState={state}>
			<WorkUpdatesProvider actions={{} as InsightActions} sync={sync}>
				<PendingHarness />
			</WorkUpdatesProvider>
		</CollaborationSessionProvider>,
	);
	await act(async () =>
		fireEvent.click(
			screen.getByRole("button", { name: "Refresh pending" }),
		),
	);
	const rendered = screen.getByLabelText("Pending state");
	expect(rendered).not.toHaveTextContent("server-topic");
	expect(rendered).not.toHaveTextContent("server-memory");
	expect(rendered).not.toHaveTextContent("server-note");
	expect(rendered).toHaveTextContent('"refId":"local-topic"');
	expect(rendered).toHaveTextContent('"noteId":"local-note"');
});
