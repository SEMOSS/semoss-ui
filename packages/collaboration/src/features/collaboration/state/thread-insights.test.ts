import { createInitialCollaborationState } from "./collaboration.fixtures";
import { collaborationReducer } from "./collaboration.reducer";
import { selectThreadContext } from "./collaboration.selectors";
import type {
	CollaborationCommand,
	CollaborationState,
} from "./collaboration.types";

const now = "2026-09-30T12:00:00Z";
const apply = (state: CollaborationState, command: CollaborationCommand) =>
	collaborationReducer(state, command, now);
function summarize(state: CollaborationState, requestId: string, text: string) {
	const threadId = state.threads[0].id;
	return apply(state, {
		type: "thread.insights",
		threadId,
		requestId,
		revision: selectThreadContext(state, threadId)?.revision ?? "",
		summary: "Summary",
		steps: [{ text, due: null }],
	});
}
it("regenerates generated actions while retaining edits, completions, manual items and exclusions", () => {
	let state = createInitialCollaborationState();
	const id = state.threads[0].id;
	state.workspaces[id].steps = [];
	state = summarize(state, "first", "Initial generated action");
	const step = state.workspaces[id].steps[0];
	state = apply(state, {
		type: "workspace.step",
		threadId: id,
		operation: "save",
		step: { id: step.id, text: "My edited action" },
	});
	state = apply(state, {
		type: "item.create",
		threadId: id,
		text: "My reminder",
	});
	const before = state.workspaces[id];
	const participants = state.threads[0].participants;
	state = summarize(state, "second", "New generated action");
	expect(state.workspaces[id].steps.map((item) => item.text)).toEqual([
		"My edited action",
		"My reminder",
		"New generated action",
	]);
	state = apply(state, {
		type: "workspace.step",
		threadId: id,
		operation: "save",
		step: { id: state.workspaces[id].steps[2].id, status: "done" },
	});
	state = summarize(state, "third", "Fresh action");
	expect(state.workspaces[id].steps).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				text: "New generated action",
				status: "done",
			}),
		]),
	);
	state = summarize(state, "fourth", "Replacement action");
	expect(
		state.workspaces[id].steps.some((item) => item.text === "Fresh action"),
	).toBe(false);
	expect(state.workspaces[id].goal).toBe(before.goal);
	expect(state.workspaces[id].facts).toEqual(before.facts);
	expect(state.threads[0].participants).toEqual(participants);
});
it("rejects stale summaries when source inclusion changes", () => {
	const state = createInitialCollaborationState();
	const next = apply(state, {
		type: "thread.insights",
		threadId: state.threads[0].id,
		requestId: "stale",
		revision: "old-source-revision",
		summary: "Wrong summary",
		steps: [],
	});
	expect(next.threads[0].summary).toBe(state.threads[0].summary);
	expect(next.workspaces).toEqual(state.workspaces);
});
it("deletes only the selected source without resetting other thread counts", () => {
	const state = createInitialCollaborationState();
	const thread = state.threads[0];
	const sourceId = state.workspaces[thread.id].messages[0].id;
	state.threads[1].messageCount = 999;
	const next = apply(state, { type: "source.deleted", sourceId });
	expect(
		next.workspaces[thread.id].messages.some(
			(message) => message.id === sourceId,
		),
	).toBe(false);
	expect(next.threads[1].messageCount).toBe(999);
	expect(next.deletedSourceIds).toContain(sourceId);
});
it("creates an empty session without a source, preserving it across repeated route initialization", () => {
	let state = createInitialCollaborationState();
	const command = {
		type: "session.create",
		sessionId: "session:test",
	} as const;
	state = apply(state, command);
	state = apply(state, command);
	expect(
		state.threads.filter((thread) => thread.id === command.sessionId),
	).toHaveLength(1);
	expect(
		state.threads.find((thread) => thread.id === command.sessionId)?.source,
	).toBeUndefined();
	expect(state.workspaces[command.sessionId].messages).toEqual([]);
});
