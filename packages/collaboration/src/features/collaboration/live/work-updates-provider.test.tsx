import {
	act,
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from "@testing-library/react";
import { StrictMode } from "react";
import { MemoryRouter } from "react-router";
import { MAIL_SENT_EVENT } from "@/features/connectors/api/microsoft";
import { deferred } from "@/features/onboarding/topic-review.test-fixtures";
import type { InsightActions } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import {
	readMailCheck,
	readTopicGoals,
	readWorkUpdates,
	syncMail,
} from "./live-state";
import type { LiveSync } from "./live-sync";
import { WorkRefreshStatus } from "./work-refresh-status";
import { useWorkUpdates } from "./work-updates.context";
import { WorkUpdatesProvider } from "./work-updates-provider";

vi.mock("./live-state", () => ({
	readMailCheck: vi.fn().mockResolvedValue(null),
	readTopicGoals: vi.fn(),
	readWorkUpdates: vi.fn(),
	syncMail: vi.fn(),
}));
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

it("refreshes an approved goal after queued saves while preserving other goals and newer local edits", async () => {
	const state = createInitialCollaborationState();
	const topic = state.topics[0];
	topic.isSample = false;
	topic.goals = [
		{ noteId: "local-goal", text: "Ship the release", status: "open" },
		{ noteId: "other-goal", text: "Keep editing", status: "open" },
	];
	const saving = deferred<void>();
	const read = deferred<Awaited<ReturnType<typeof readTopicGoals>>>();
	const sync: LiveSync = Object.assign(vi.fn(), {
		settled: vi
			.fn()
			.mockReturnValueOnce(saving.promise)
			.mockResolvedValue(undefined),
		localId: (id: string) => (id === "server-goal" ? "local-goal" : id),
		serverId: (id: string) => id,
	});
	vi.mocked(readTopicGoals).mockReset().mockReturnValueOnce(read.promise);
	const { result, unmount } = renderHook(
		() => ({
			...useCollaborationSession(),
			updates: useWorkUpdates(),
		}),
		{
			wrapper: ({ children }) => (
				<CollaborationSessionProvider initialState={state}>
					<WorkUpdatesProvider
						actions={{} as InsightActions}
						sync={sync}
					>
						{children}
					</WorkUpdatesProvider>
				</CollaborationSessionProvider>
			),
		},
	);
	act(() =>
		result.current.updates?.refreshTopicGoal(
			{ topicId: topic.id },
			"server-goal",
		),
	);
	expect(readTopicGoals).not.toHaveBeenCalled();
	await act(async () => saving.resolve());
	expect(readTopicGoals).toHaveBeenCalledWith({}, { topicId: topic.id });
	const server = {
		id: topic.id,
		goals: [
			{
				noteId: "server-goal",
				text: "Ship the release",
				status: "done" as const,
				resolution: "Released version 2.0",
			},
			{
				noteId: "other-goal",
				text: "Stale server copy",
				status: "done" as const,
			},
		],
	};
	await act(async () => read.resolve(server));
	expect(result.current.state.topics[0].goals).toEqual([
		{
			...topic.goals[0],
			status: "done",
			resolution: "Released version 2.0",
		},
		topic.goals[1],
	]);

	const stale = deferred<typeof server>();
	vi.mocked(readTopicGoals).mockReturnValueOnce(stale.promise);
	act(() =>
		result.current.updates?.refreshTopicGoal(
			{ topicId: topic.id },
			"server-goal",
		),
	);
	await waitFor(() => expect(readTopicGoals).toHaveBeenCalledTimes(2));
	act(() =>
		result.current.dispatch({
			type: "topic.note",
			topicId: topic.id,
			kind: "goal",
			operation: "save",
			noteId: "local-goal",
			text: "Updated locally",
			status: "open",
		}),
	);
	await act(async () => stale.resolve(server));
	expect(result.current.state.topics[0].goals[0]).toEqual({
		noteId: "local-goal",
		text: "Updated locally",
		status: "open",
		resolution: "Released version 2.0",
	});
	unmount();
});

it("does not mark a goal done when the server still says open or the read fails", async () => {
	const state = createInitialCollaborationState();
	const topic = state.topics[0];
	topic.isSample = false;
	const goal = topic.goals[0];
	goal.status = "open";
	vi.mocked(readTopicGoals)
		.mockReset()
		.mockResolvedValueOnce({ id: topic.id, goals: [goal] })
		.mockRejectedValueOnce(new Error("Topic read unavailable"));
	const { result } = renderHook(
		() => ({
			...useCollaborationSession(),
			updates: useWorkUpdates(),
		}),
		{
			wrapper: ({ children }) => (
				<CollaborationSessionProvider initialState={state}>
					<WorkUpdatesProvider actions={{} as InsightActions}>
						{children}
					</WorkUpdatesProvider>
				</CollaborationSessionProvider>
			),
		},
	);
	await act(async () =>
		result.current.updates?.refreshTopicGoal(
			{ topicId: topic.id },
			goal.noteId,
		),
	);
	expect(result.current.state.topics[0].goals[0].status).toBe("open");
	await act(async () =>
		result.current.updates?.refreshTopicGoal(
			{ topicId: topic.id },
			goal.noteId,
		),
	);
	expect(result.current.updates?.error).toBe("Topic read unavailable");
	expect(result.current.state.topics[0].goals[0].status).toBe("open");
});
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
		serverId: (id: string) => id,
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
	expect(screen.getByText("Automated, kept out of Work")).toBeInTheDocument();
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

it("re-reads only while sync summaries are still landing, then stops", async () => {
	vi.useFakeTimers();
	try {
		const state = createInitialCollaborationState();
		const check = (insightsPending: number) => ({
			status: "done" as const,
			at: "2026-10-10T17:21:18Z",
			error: "",
			insightsPending,
		});
		vi.mocked(readWorkUpdates).mockReset();
		vi.mocked(readWorkUpdates).mockResolvedValue({
			threads: state.threads,
			items: [],
			workspaces: {},
			memories: [],
			lastMailCheck: check(0),
		});
		vi.mocked(readMailCheck).mockReset();
		vi.mocked(readMailCheck)
			.mockResolvedValueOnce(check(3))
			.mockResolvedValueOnce(check(3))
			.mockResolvedValueOnce(check(0));
		render(
			<CollaborationSessionProvider initialState={state}>
				<WorkUpdatesProvider actions={{} as InsightActions}>
					<WorkRefreshStatus />
				</WorkUpdatesProvider>
			</CollaborationSessionProvider>,
		);
		// startup check finds 3 summaries pending; an unchanged count does not reload
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});
		expect(readMailCheck).toHaveBeenCalledTimes(2);
		expect(readWorkUpdates).not.toHaveBeenCalled();
		// they land: one full reload, and nothing pending means no more checks
		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});
		expect(readWorkUpdates).toHaveBeenCalledTimes(1);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(60_000);
		});
		expect(readMailCheck).toHaveBeenCalledTimes(3);
		expect(readWorkUpdates).toHaveBeenCalledTimes(1);
	} finally {
		vi.useRealTimers();
	}
});

it("checks connected mail while visible and applies incoming replies without a manual refresh", async () => {
	vi.useFakeTimers();
	const visibility = vi.spyOn(document, "visibilityState", "get");
	visibility.mockReturnValue("visible");
	try {
		const state = createInitialCollaborationState();
		state.sources[0].isSample = false;
		const incoming = { ...state.threads[0], messageCount: 7 };
		const syncing = deferred<Awaited<ReturnType<typeof syncMail>>>();
		const syncResult = {
			newMessages: 1,
			closedByReply: 0,
			outcomes: {},
			changes: [],
		};
		vi.mocked(readMailCheck).mockReset().mockResolvedValue(null);
		vi.mocked(readWorkUpdates)
			.mockReset()
			.mockResolvedValue({
				threads: [incoming],
				items: [],
				workspaces: {},
				memories: [],
				lastMailCheck: null,
			});
		vi.mocked(syncMail)
			.mockReset()
			.mockReturnValueOnce(syncing.promise)
			.mockResolvedValue(syncResult);
		const { result, unmount } = renderHook(useCollaborationSession, {
			wrapper: ({ children }) => (
				<StrictMode>
					<CollaborationSessionProvider initialState={state}>
						<WorkUpdatesProvider actions={{} as InsightActions}>
							{children}
						</WorkUpdatesProvider>
					</CollaborationSessionProvider>
				</StrictMode>
			),
		});
		await act(async () => vi.advanceTimersByTimeAsync(0));
		expect(syncMail).toHaveBeenCalledTimes(1);
		await act(async () => vi.advanceTimersByTimeAsync(60_000));
		expect(syncMail).toHaveBeenCalledTimes(1);
		expect(readWorkUpdates).not.toHaveBeenCalled();
		await act(async () => syncing.resolve(syncResult));
		expect(result.current.state.threads[0].messageCount).toBe(7);
		await act(async () => vi.advanceTimersByTimeAsync(60_000));
		expect(syncMail).toHaveBeenCalledTimes(2);
		visibility.mockReturnValue("hidden");
		await act(async () => vi.advanceTimersByTimeAsync(120_000));
		expect(syncMail).toHaveBeenCalledTimes(2);
		visibility.mockReturnValue("visible");
		await act(async () => {
			fireEvent(document, new Event("visibilitychange"));
			fireEvent(window, new Event("focus"));
		});
		expect(syncMail).toHaveBeenCalledTimes(3);
		unmount();
		await act(async () => vi.advanceTimersByTimeAsync(60_000));
		fireEvent(window, new Event("focus"));
		expect(syncMail).toHaveBeenCalledTimes(3);
	} finally {
		visibility.mockRestore();
		vi.useRealTimers();
	}
});

it.each(["sample", "off"])(
	"does not automatically sync %s mail",
	async (source) => {
		vi.useFakeTimers();
		try {
			const state = createInitialCollaborationState();
			if (source === "off") {
				state.sources[0].isSample = false;
				state.sources[0].status = "off";
			}
			vi.mocked(syncMail).mockClear();
			vi.mocked(readMailCheck).mockReset().mockResolvedValue(null);
			const { unmount } = render(
				<CollaborationSessionProvider initialState={state}>
					<WorkUpdatesProvider actions={{} as InsightActions}>
						<WorkRefreshStatus />
					</WorkUpdatesProvider>
				</CollaborationSessionProvider>,
			);
			await act(async () => vi.advanceTimersByTimeAsync(120_000));
			expect(syncMail).not.toHaveBeenCalled();
			unmount();
		} finally {
			vi.useRealTimers();
		}
	},
);

it("gives a topic made on this page its server id after queued saves, and keeps its own id when a refresh echoes it", async () => {
	const state = createInitialCollaborationState();
	const [thread] = state.threads;
	const [item] = state.items;
	const saving = deferred<void>();
	const sync: LiveSync = Object.assign(vi.fn(), {
		settled: () => saving.promise,
		localId: (id: string) => (id === "server-topic" ? "local-topic-9" : id),
		serverId: (id: string) =>
			id === "local-topic-9" ? "server-topic" : id,
	});
	const link = {
		source: "you" as const,
		confidence: 100,
		primary: true,
	};
	vi.mocked(readWorkUpdates).mockResolvedValueOnce({
		threads: [
			{ ...thread, topicLinks: [{ ...link, topicId: "server-topic" }] },
		],
		items: [{ ...item, topicIds: ["server-topic"] }],
		workspaces: {},
		memories: [],
		lastMailCheck: null,
	});
	const { result } = renderHook(
		() => ({
			...useCollaborationSession(),
			updates: useWorkUpdates(),
		}),
		{
			wrapper: ({ children }) => (
				<CollaborationSessionProvider initialState={state}>
					<WorkUpdatesProvider
						actions={{} as InsightActions}
						sync={sync}
					>
						{children}
					</WorkUpdatesProvider>
				</CollaborationSessionProvider>
			),
		},
	);
	let serverId: string | undefined;
	act(() => {
		void result.current.updates?.serverId("local-topic-9").then((id) => {
			serverId = id;
		});
	});
	expect(serverId).toBeUndefined();
	await act(async () => saving.resolve());
	expect(serverId).toBe("server-topic");

	act(() => result.current.updates?.refresh());
	await waitFor(() =>
		expect(
			result.current.state.threads.find((entry) => entry.id === thread.id)
				?.topicLinks,
		).toEqual([{ ...link, topicId: "local-topic-9" }]),
	);
	expect(
		result.current.state.items.find((entry) => entry.id === item.id)
			?.topicIds,
	).toEqual(["local-topic-9"]);
});
