import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import {
	useEnsureThreadInsights,
	useThreadInsights,
} from "@/features/work-thread/use-thread-insights";
import type { InsightActions } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import type { CollaborationState } from "../state/collaboration.types";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import { ThreadInsightsProvider } from "./thread-insights-provider";

type Out = Record<string, unknown>;

function liveState(change?: (state: CollaborationState) => void) {
	const state = createInitialCollaborationState();
	const thread = state.threads[0];
	thread.isSample = false;
	thread.summary = "";
	thread.summaryCurrent = false;
	state.workspaces[thread.id].steps = [];
	change?.(state);
	return state;
}

const insights = (threadId: string, out: Out) => ({
	threadId,
	status: "done",
	summary: "Kira needs the revised budget.",
	summaryAt: "2026-10-02T15:00:00Z",
	summaryCurrent: true,
	steps: [],
	...out,
});

function respond(outputs: (statement: string) => Out) {
	return vi.fn(async (statement: string) => ({
		pixelReturn: [{ output: outputs(statement), operationType: [] }],
	}));
}

function Thread({ ensure = true }: { ensure?: boolean }) {
	const { state } = useCollaborationSession();
	const thread = state.threads[0];
	useEnsureThreadInsights(ensure ? thread : undefined);
	const run = useThreadInsights(thread);
	return (
		<>
			<button type="button" onClick={run.generate}>
				Summarize
			</button>
			<p>{run.isGenerating ? "generating" : "idle"}</p>
			<p>{thread.summary}</p>
			<p>{run.error}</p>
			<ul>
				{state.workspaces[thread.id].steps.map((step) => (
					<li key={step.id}>{`${step.text}:${step.status}`}</li>
				))}
			</ul>
		</>
	);
}

function renderThread(
	state: CollaborationState,
	run: ReturnType<typeof respond>,
	ensure = true,
) {
	const wait = vi.fn(async () => undefined);
	const view = render(
		<CollaborationSessionProvider initialState={state}>
			<ThreadInsightsProvider
				actions={{ run } as unknown as InsightActions}
				wait={wait}
			>
				<Thread ensure={ensure} />
			</ThreadInsightsProvider>
		</CollaborationSessionProvider>,
	);
	return { ...view, wait };
}

it("summarizes an opened thread in the background and applies Brain's steps without a chat turn", async () => {
	const state = liveState();
	const threadId = state.threads[0].id;
	let polls = 0;
	const run = respond((statement) =>
		statement.startsWith("WorkSummarizeThread")
			? insights(threadId, { status: "running", summaryCurrent: false })
			: ++polls < 2
				? insights(threadId, { status: "running" })
				: insights(threadId, {
						steps: [
							{
								id: "server-1",
								text: "Send Kira the revised budget",
								status: "open",
								ownerId: "me",
								kind: "task",
								origin: "brain",
							},
						],
					}),
	);
	renderThread(state, run);
	expect(
		await screen.findByText("Send Kira the revised budget:open"),
	).toBeTruthy();
	expect(screen.getByText("Kira needs the revised budget.")).toBeTruthy();
	expect(screen.getByText("idle")).toBeTruthy();
	const statements = run.mock.calls.map(([statement]) => statement);
	expect(statements[0]).toBe(
		`WorkSummarizeThread(threadId=${JSON.stringify([threadId])});`,
	);
	expect(
		statements.slice(1).every((s) => s.startsWith("WorkGetThreadInsights")),
	).toBe(true);
	// only Brain's reactors: nothing goes to the thread's assistant room
	expect(statements.some((s) => /RunAgent|Room/.test(s))).toBe(false);
});

it("leaves a current summary alone and forces a new one only on Summarize", async () => {
	const state = liveState((draft) => {
		draft.threads[0].summary = "Already summarized.";
		draft.threads[0].summaryAt = "2026-10-02T14:00:00Z";
		draft.threads[0].summaryCurrent = true;
	});
	const threadId = state.threads[0].id;
	const run = respond(() =>
		insights(threadId, { summary: "Regenerated summary." }),
	);
	renderThread(state, run);
	await act(async () => undefined);
	expect(run).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "Summarize" }));
	expect(await screen.findByText("Regenerated summary.")).toBeTruthy();
	expect(run.mock.calls[0]?.[0]).toBe(
		`WorkSummarizeThread(threadId=${JSON.stringify([threadId])}, force=[true]);`,
	);
});

it("reports a failed run once and does not retry it until the owner asks", async () => {
	const state = liveState();
	const threadId = state.threads[0].id;
	const run = respond(() =>
		insights(threadId, {
			status: "failed",
			error: "Brain's text model is unavailable",
			summaryCurrent: false,
			summaryAt: null,
			summary: null,
		}),
	);
	const view = renderThread(state, run);
	expect(
		await screen.findByText("Brain's text model is unavailable"),
	).toBeTruthy();
	view.rerender(
		<CollaborationSessionProvider initialState={state}>
			<ThreadInsightsProvider
				actions={{ run } as unknown as InsightActions}
				wait={view.wait}
			>
				<Thread />
			</ThreadInsightsProvider>
		</CollaborationSessionProvider>,
	);
	await act(async () => undefined);
	expect(run).toHaveBeenCalledTimes(1);
});

it("summarizes again when new mail reaches an open thread", async () => {
	const state = liveState();
	const thread = state.threads[0];
	const run = respond(() =>
		insights(thread.id, { summaryCurrent: false, summaryAt: null }),
	);
	function NewMail() {
		const { dispatch, state: current } = useCollaborationSession();
		return (
			<button
				type="button"
				onClick={() =>
					dispatch({
						type: "live.refresh",
						updates: {
							threads: [
								{
									...current.threads[0],
									lastAt: "2026-10-02T16:00:00Z",
									summaryCurrent: false,
								},
							],
							workspaces: {},
							items: [],
						},
					})
				}
			>
				New mail
			</button>
		);
	}
	render(
		<CollaborationSessionProvider initialState={state}>
			<ThreadInsightsProvider
				actions={{ run } as unknown as InsightActions}
				wait={async () => undefined}
			>
				<Thread />
				<NewMail />
			</ThreadInsightsProvider>
		</CollaborationSessionProvider>,
	);
	await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
	await waitFor(() => expect(screen.getByText("idle")).toBeTruthy());
	fireEvent.click(screen.getByRole("button", { name: "New mail" }));
	await waitFor(() => expect(run).toHaveBeenCalledTimes(2));
});

it("never summarizes sample threads, which have no server thread", async () => {
	const state = createInitialCollaborationState();
	state.threads[0].summaryCurrent = false;
	const run = respond(() => ({}));
	renderThread(state, run);
	fireEvent.click(screen.getByRole("button", { name: "Summarize" }));
	await act(async () => undefined);
	expect(run).not.toHaveBeenCalled();
});
