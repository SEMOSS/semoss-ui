import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MAIL_SENT_EVENT } from "@/features/connectors/api/microsoft";
import type { InsightActions } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { readWorkUpdates, syncMail } from "./live-state";
import type { LiveSync } from "./live-sync";
import { WorkRefreshStatus } from "./work-refresh-status";
import { useWorkUpdates } from "./work-updates.context";
import { WorkUpdatesProvider } from "./work-updates-provider";

vi.mock("./live-state", () => ({
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
		`/work/thread/${encodeURIComponent(state.threads[0].id)}`,
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
