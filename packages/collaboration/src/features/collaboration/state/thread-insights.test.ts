import { createInitialCollaborationState } from "./collaboration.fixtures";
import { collaborationReducer } from "./collaboration.reducer";
import type {
	CollaborationCommand,
	CollaborationState,
	WorkspaceStep,
} from "./collaboration.types";

const now = "2026-09-30T12:00:00Z";
const apply = (state: CollaborationState, command: CollaborationCommand) =>
	collaborationReducer(state, command, now);
const step = (id: string, text: string, extra: Partial<WorkspaceStep> = {}) =>
	({
		id,
		text,
		ownerId: "me",
		due: null,
		status: "open",
		kind: "task",
		...extra,
	}) satisfies WorkspaceStep;
it("applies Brain's steps while keeping edits made after the read and the owner's unsaved items", () => {
	let state = createInitialCollaborationState();
	const id = state.threads[0].id;
	state.workspaces[id].steps = [
		step("dropped", "Old generated action", { isGenerated: true }),
		step("edited", "My reworded action", {
			isGenerated: true,
			isUserEdited: true,
		}),
		step("typing", "Changed while Brain read", { isGenerated: true }),
		step("local-step-9", "My unsaved reminder"),
	];
	state.threads[0].summaryPending = true;
	const before = state.workspaces[id];
	state = apply(state, {
		type: "thread.insights",
		threadId: id,
		summary: "Summary from Brain",
		summaryAt: "2026-09-30T11:00:00Z",
		summaryCurrent: true,
		steps: [
			// the owner's saved edit, which a reply has since closed
			step("edited", "My reworded action", {
				isGenerated: true,
				status: "done",
			}),
			step("typing", "Brain's older copy", { isGenerated: true }),
			step("new", "New generated action", { isGenerated: true }),
		],
		keepStepIds: ["typing"],
	});
	expect(
		state.workspaces[id].steps.map((item) => `${item.text}:${item.status}`),
	).toEqual([
		"My reworded action:done",
		"Changed while Brain read:open",
		"My unsaved reminder:open",
		"New generated action:open",
	]);
	expect(state.threads[0]).toMatchObject({
		summary: "Summary from Brain",
		summaryCurrent: true,
	});
	expect(state.threads[0].summaryPending).toBeUndefined();
	expect(state.workspaces[id].goal).toBe(before.goal);
	expect(state.workspaces[id].facts).toEqual(before.facts);
});
it("keeps a newer summary over one read before it landed", () => {
	const state = createInitialCollaborationState();
	const thread = state.threads[0];
	thread.summary = "Newest";
	thread.summaryAt = "2026-09-30T11:00:00Z";
	thread.summaryCurrent = true;
	const stale = apply(state, {
		type: "thread.insights",
		threadId: thread.id,
		summary: "Older",
		summaryAt: "2026-09-30T10:00:00Z",
		summaryCurrent: false,
		steps: [],
	});
	expect(stale.threads[0].summary).toBe("Newest");
	const refreshed = apply(state, {
		type: "live.refresh",
		updates: {
			threads: [{ ...thread, summary: "Older", summaryAt: undefined }],
			workspaces: {},
			items: [],
		},
	});
	expect(refreshed.threads[0].summary).toBe("Newest");
});
it("drops generated steps a later summary removed, but not ones added after the read went out", () => {
	const state = createInitialCollaborationState();
	const thread = state.threads[0];
	state.workspaces[thread.id].steps = [
		step("gone", "Removed by Brain", { isGenerated: true }),
		step("fresh", "Arrived during the read", { isGenerated: true }),
		step("mine", "Owner's step"),
	];
	const next = apply(state, {
		type: "live.refresh",
		updates: {
			threads: [
				{
					...thread,
					summary: "Background summary",
					summaryAt: "2026-09-30T11:00:00Z",
					summaryCurrent: true,
				},
			],
			workspaces: {},
			items: [],
			keepStepIds: ["fresh"],
		},
	});
	expect(next.workspaces[thread.id].steps.map((item) => item.id)).toEqual([
		"fresh",
		"mine",
	]);
	expect(next.threads[0].summary).toBe("Background summary");
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
