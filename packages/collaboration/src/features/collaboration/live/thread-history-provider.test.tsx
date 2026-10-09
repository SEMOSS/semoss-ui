import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { InsightActions } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { readThreadMessagesPage, type ThreadMessagePage } from "./live-state";
import { useThreadHistory } from "./thread-history.context";
import { ThreadHistoryProvider } from "./thread-history-provider";

vi.mock("./live-state", () => ({ readThreadMessagesPage: vi.fn() }));
const actions = {} as InsightActions;
const source = (id: string, day = 30) => ({
	id,
	fromId: "person",
	at: `2026-09-${day}T12:00:00Z`,
	text: id,
});
const page = (
	messages: ThreadMessagePage["messages"],
	nextCursor?: string,
): ThreadMessagePage => ({
	messages,
	nextCursor,
	hasMore: Boolean(nextCursor),
	hiddenCount: 0,
	unavailableCount: 0,
});

function HistoryHarness({ threadId }: { threadId: string }) {
	const history = useThreadHistory(threadId);
	const { state, dispatch } = useCollaborationSession();
	return (
		<>
			<output data-testid="ids">
				{state.workspaces[threadId]?.messages
					.map((message) => message.id)
					.join(",")}
			</output>
			<output data-testid="error">{history.error}</output>
			<button
				type="button"
				disabled={history.isLoading}
				onClick={history.loadOlder}
			>
				Older
			</button>
			<button type="button" onClick={history.refresh}>
				Refresh
			</button>
			<button type="button" onClick={history.retry}>
				Retry
			</button>
			<button
				type="button"
				onClick={() => dispatch({ type: "workspace.close", threadId })}
			>
				Close thread
			</button>
		</>
	);
}

function view() {
	const state = createInitialCollaborationState();
	const thread = state.threads[0];
	thread.isSample = false;
	thread.source = {
		kind: "outlook",
		nativeId: "source",
		conversationId: "conversation",
	};
	state.openThreadIds = [thread.id];
	state.workspaces[thread.id].messages = [];
	return {
		thread,
		...render(
			<CollaborationSessionProvider initialState={state}>
				<ThreadHistoryProvider actions={actions}>
					<HistoryHarness threadId={thread.id} />
				</ThreadHistoryProvider>
			</CollaborationSessionProvider>,
		),
	};
}

beforeEach(() => vi.mocked(readThreadMessagesPage).mockReset());

it("loads once, then prepends and deduplicates older history only on request", async () => {
	vi.mocked(readThreadMessagesPage)
		.mockResolvedValueOnce(page([source("new")], "cursor"))
		.mockResolvedValueOnce(page([source("old", 29), source("new")]));
	const { thread } = view();
	await waitFor(() =>
		expect(screen.getByTestId("ids")).toHaveTextContent("new"),
	);
	expect(readThreadMessagesPage).toHaveBeenCalledTimes(1);
	fireEvent.click(screen.getByRole("button", { name: "Older" }));
	await waitFor(() =>
		expect(screen.getByTestId("ids")).toHaveTextContent("old,new"),
	);
	expect(readThreadMessagesPage).toHaveBeenLastCalledWith(
		actions,
		thread.id,
		"cursor",
	);
});

it("keeps loaded messages when an older page fails and retries its cursor", async () => {
	vi.mocked(readThreadMessagesPage)
		.mockResolvedValueOnce(page([source("new")], "cursor"))
		.mockRejectedValueOnce(new Error("Offline"))
		.mockResolvedValueOnce(page([source("old", 29)]));
	view();
	await waitFor(() =>
		expect(screen.getByTestId("ids")).toHaveTextContent("new"),
	);
	fireEvent.click(screen.getByRole("button", { name: "Older" }));
	await waitFor(() =>
		expect(screen.getByTestId("error")).toHaveTextContent("Offline"),
	);
	expect(screen.getByTestId("ids")).toHaveTextContent("new");
	fireEvent.click(screen.getByRole("button", { name: "Retry" }));
	await waitFor(() =>
		expect(screen.getByTestId("ids")).toHaveTextContent("old,new"),
	);
});

it("discards a late response after the owning thread closes", async () => {
	let finish: (value: ThreadMessagePage) => void = () => {
		throw new Error("Pending request missing");
	};
	vi.mocked(readThreadMessagesPage).mockReturnValue(
		new Promise((resolve) => {
			finish = resolve;
		}),
	);
	view();
	fireEvent.click(screen.getByRole("button", { name: "Close thread" }));
	await act(async () => finish(page([source("late")])));
	expect(screen.getByTestId("ids")).not.toHaveTextContent("late");
});

it("preserves older pages and their continuation when refreshing after a draft save", async () => {
	vi.mocked(readThreadMessagesPage)
		.mockResolvedValueOnce(page([source("new")], "first-cursor"))
		.mockResolvedValueOnce(page([source("old", 29)], "older-cursor"))
		.mockResolvedValueOnce(
			page([source("new"), source("updated")], "first-cursor"),
		)
		.mockResolvedValueOnce(page([source("oldest", 28)]));
	const { thread } = view();
	await waitFor(() =>
		expect(screen.getByTestId("ids")).toHaveTextContent("new"),
	);
	fireEvent.click(screen.getByRole("button", { name: "Older" }));
	await waitFor(() =>
		expect(screen.getByTestId("ids")).toHaveTextContent("old,new"),
	);
	fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
	await waitFor(() =>
		expect(screen.getByTestId("ids")).toHaveTextContent("old,new,updated"),
	);
	fireEvent.click(screen.getByRole("button", { name: "Older" }));
	await waitFor(() =>
		expect(screen.getByTestId("ids")).toHaveTextContent(
			"oldest,old,new,updated",
		),
	);
	expect(readThreadMessagesPage).toHaveBeenLastCalledWith(
		actions,
		thread.id,
		"older-cursor",
	);
});
