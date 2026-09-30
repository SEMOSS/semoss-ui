import { act, renderHook } from "@testing-library/react";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { threadCommand } from "@/features/thread-assistant/thread-context";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { useThreadInsights } from "./use-thread-insights";
import { WorkComposerSession } from "./work-composer-session";
import type { WorkEmailContextValue } from "./work-email.context";
import { workSnapshot } from "./work-thread.test-fixtures";
import type { WorkThreadContextValue } from "./work-thread-context";

const dispatch = vi.fn();
let work: WorkThreadContextValue;
let email: WorkEmailContextValue;
vi.mock("./work-thread-context", () => ({ useWorkThread: () => work }));
vi.mock("./work-email.context", () => ({ useWorkEmail: () => email }));
vi.mock("@/features/collaboration/state/collaboration-session.context", () => ({
	useCollaborationSession: () => ({ dispatch }),
}));
function setup() {
	dispatch.mockClear();
	const state = createInitialCollaborationState();
	const composer = new WorkComposerSession();
	const send = vi.fn().mockResolvedValue(undefined);
	work = {
		session: {
			send,
			retain: () => () => undefined,
		} as unknown as ThreadSession,
		snapshot: workSnapshot(),
		title: "Review",
		contextPanel: {
			context: {
				threadId: state.threads[0].id,
				contextRevision: "current",
				contextText: "Included sources",
			},
			submitted: null,
			children: null,
		},
	};
	email = {
		thread: state.threads[0],
		workspace: state.workspaces[state.threads[0].id],
		composer,
		allowedSources: new Set(),
		openEmail: () => undefined,
	};
	return { composer, send, ...renderHook(useThreadInsights) };
}
it("summarizes through the agent, preserving pending chat text and applying a completed result", async () => {
	const view = setup();
	act(() =>
		view.composer.setDraft(0, {
			document: null,
			text: "My unsent message",
			files: [],
		}),
	);
	await act(() => view.result.current.generate());
	const request = view.composer.getSnapshot().insightsRequest;
	if (!request) throw new Error("Expected a pending summary request");
	expect(view.send).toHaveBeenCalledOnce();
	expect(view.composer.getSnapshot().draft.text).toBe("My unsent message");
	expect(view.result.current.isGenerating).toBe(true);
	work = {
		...work,
		snapshot: {
			...work.snapshot,
			turn: {
				...work.snapshot.turn,
				phase: "completed",
				messages: [
					{
						id: "user",
						role: "user",
						parts: [
							{
								type: "text",
								text: threadCommand(
									{
										...work.contextPanel.context,
										insightsRequestId: request.id,
									},
									"Summarize",
								),
							},
						],
					},
					{
						id: "assistant",
						role: "assistant",
						parts: [
							{
								type: "text",
								text: `\`\`\`semoss-thread-insights\n${JSON.stringify({ requestId: request.id, summary: "Review is ready.", actionItems: [] })}\n\`\`\``,
							},
						],
					},
				],
			},
		},
	};
	view.rerender();
	expect(dispatch).toHaveBeenCalledWith(
		expect.objectContaining({
			type: "thread.insights",
			summary: "Review is ready.",
			steps: [],
		}),
	);
	expect(view.result.current.isGenerating).toBe(false);
});
it("offers recovery after submission failure without replacing existing insights", async () => {
	const view = setup();
	view.send.mockRejectedValueOnce(new Error("Connection unavailable"));
	await act(() => view.result.current.generate());
	expect(view.result.current.error).toBe("Connection unavailable");
	expect(view.result.current.isGenerating).toBe(false);
	expect(dispatch).not.toHaveBeenCalled();
});
