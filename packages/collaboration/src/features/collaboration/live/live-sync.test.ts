import { expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { collaborationReducer } from "../state/collaboration.reducer";
import type { CollaborationCommand } from "../state/collaboration.types";
import { createLiveSync } from "./live-sync";

const NOW = "2026-09-26T12:00:00.000Z";

function fakeActions() {
	const sent: string[] = [];
	const run = vi.fn(async (joined: string) => {
		const statements = joined.split(/;\s*(?=[A-Z])/).filter(Boolean);
		sent.push(...statements.map((s) => (s.endsWith(";") ? s : `${s};`)));
		return {
			pixelReturn: statements.map((statement) => ({
				operationType: ["OPERATION"],
				output: /^Brain(MergeTopics|DeleteTopic)\(/.test(statement)
					? { topicId: "t-geng", changeId: "change-1" }
					: /^WorkCreateItem\(/.test(statement)
						? { id: "wi-new" }
						: /^WorkSave(Step|Fact)\(/.test(statement)
							? {
									id: `server-${statement.slice(8, 12).toLowerCase()}`,
								}
							: /^BrainSaveTopicNote\(/.test(statement)
								? { noteId: "server-note" }
								: true,
			})),
		};
	});
	return { actions: { run } as unknown as InsightActions, sent };
}

function step(command: CollaborationCommand) {
	const previous = createInitialCollaborationState();
	return {
		previous,
		next: collaborationReducer(previous, command, NOW),
		commands: [command],
	};
}

it("undoing a merge sends only BrainUndoTopicChange with the merge's changeId", async () => {
	const { actions, sent } = fakeActions();
	const onError = vi.fn();
	const sync = createLiveSync(actions, onError);
	const merge = step({
		type: "topic.merge",
		sourceId: "t-geng",
		targetId: "t-gsales",
	});
	sync({ ...merge, undo: false });
	sync({
		previous: merge.next,
		next: merge.previous,
		commands: [],
		undo: true,
	});
	await vi.waitFor(() => expect(sent).toHaveLength(2));
	expect(sent[0]).toMatch(/^BrainMergeTopics\(/);
	expect(sent[1]).toBe('BrainUndoTopicChange(changeId=["change-1"]);');
	expect(onError).not.toHaveBeenCalled();
});

it("an undo that brings back no removed topic is saved as a normal change", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const rename = step({
		type: "topic.save",
		topic: { id: "t-geng", name: "Renamed" },
	});
	sync({ ...rename, undo: false });
	sync({
		previous: rename.next,
		next: rename.previous,
		commands: [],
		undo: true,
	});
	await vi.waitFor(() => expect(sent).toHaveLength(2));
	expect(sent.some((s) => s.startsWith("BrainUndoTopicChange"))).toBe(false);
	expect(sent[1]).toMatch(/^BrainSaveTopic\(/);
});

it("a delete sends one BrainDeleteTopic, and its undo puts the topic back", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const deleted = step({ type: "topic.delete", topicId: "t-geng" });
	sync({ ...deleted, undo: false });
	sync({
		previous: deleted.next,
		next: deleted.previous,
		commands: [],
		undo: true,
	});
	await vi.waitFor(() => expect(sent).toHaveLength(2));
	expect(sent[0]).toBe('BrainDeleteTopic(topicId=["t-geng"]);');
	expect(sent[1]).toBe('BrainUndoTopicChange(changeId=["change-1"]);');
});

it("an undo carrying a no-op snooze check is still saved", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const merge = step({
		type: "topic.merge",
		sourceId: "t-geng",
		targetId: "t-gsales",
	});
	sync({ ...merge, undo: false });
	sync({
		previous: merge.next,
		next: merge.previous,
		commands: [{ type: "snooze.expire" }],
		undo: true,
	});
	await vi.waitFor(() => expect(sent).toHaveLength(2));
	expect(sent[1]).toBe('BrainUndoTopicChange(changeId=["change-1"]);');
});

it("a new item's step is saved after the item, with the item's server id", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const created = step({
		type: "item.create",
		threadId: "th-geng-review",
		text: "Call the vendor",
	});
	sync({ ...created, undo: false });
	await vi.waitFor(() => expect(sent).toHaveLength(2));
	expect(sent[0]).toMatch(/^WorkCreateItem\(/);
	expect(sent[1]).toMatch(/^WorkSaveStep\(threadId=\["th-geng-review"\]/);
	expect(sent[1]).toContain('"itemId":"wi-new"');
	expect(sent[1]).toContain('"text":"Call the vendor"');
});

it("step and fact edits and removals go out as saves and deletes", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	let state = createInitialCollaborationState();
	const apply = (command: CollaborationCommand) => {
		const next = collaborationReducer(state, command, NOW);
		sync({ previous: state, next, commands: [command], undo: false });
		state = next;
	};
	apply({
		type: "workspace.step",
		threadId: "th-geng-review",
		operation: "save",
		step: { text: "Draft the reply", kind: "reply" },
	});
	apply({
		type: "workspace.fact",
		threadId: "th-geng-review",
		operation: "save",
		fact: { text: "Budget is approved" },
	});
	await vi.waitFor(() => expect(sent).toHaveLength(2));
	const stepId = state.workspaces["th-geng-review"].steps.at(-1)?.id ?? "";
	const factId = state.workspaces["th-geng-review"].facts.at(-1)?.id ?? "";
	apply({
		type: "workspace.step",
		threadId: "th-geng-review",
		operation: "save",
		step: { id: stepId, status: "done", due: null },
	});
	apply({
		type: "workspace.fact",
		threadId: "th-geng-review",
		operation: "remove",
		fact: { id: factId },
	});
	await vi.waitFor(() => expect(sent).toHaveLength(4));
	expect(sent[2]).toMatch(/^WorkSaveStep\(/);
	expect(sent[2]).toContain('"id":"server-step"');
	expect(sent[2]).toContain('"status":"done"');
	expect(sent[3]).toBe(
		'WorkDeleteFact(threadId=["th-geng-review"], factId=["server-fact"]);',
	);
});

it("no response needed saves the dismissal with its reason; reopening drops the reason", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	let state = createInitialCollaborationState();
	const item = state.items.find((candidate) => candidate.status === "open");
	if (!item) throw new Error("Missing open item");
	const apply = (command: CollaborationCommand) => {
		const next = collaborationReducer(state, command, NOW);
		sync({ previous: state, next, commands: [command], undo: false });
		state = next;
	};
	apply({
		type: "item.update",
		itemId: item.id,
		changes: { status: "dismissed", closedReason: "no_response_needed" },
	});
	apply({
		type: "item.update",
		itemId: item.id,
		changes: { status: "open" },
	});
	const updates = () => sent.filter((s) => s.startsWith("WorkUpdateItem"));
	await vi.waitFor(() => expect(updates()).toHaveLength(2));
	expect(updates()[0]).toBe(
		`WorkUpdateItem(itemId=["${item.id}"], status=["dismissed"], closedReason=["no_response_needed"]);`,
	);
	expect(updates()[1]).toBe(
		`WorkUpdateItem(itemId=["${item.id}"], status=["open"]);`,
	);
	expect(
		state.items.find((candidate) => candidate.id === item.id)?.closedReason,
	).toBeUndefined();
});

it("removes a new step even when its creation is still queued", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const created = step({
		type: "workspace.step",
		threadId: "th-geng-review",
		operation: "save",
		step: { text: "Temporary reminder" },
	});
	const stepId = created.next.workspaces["th-geng-review"].steps.at(-1)?.id;
	if (!stepId) throw new Error("Missing created step");
	const command: CollaborationCommand = {
		type: "workspace.step",
		threadId: "th-geng-review",
		operation: "remove",
		step: { id: stepId },
	};
	sync({ ...created, undo: false });
	sync({
		previous: created.next,
		next: collaborationReducer(created.next, command, NOW),
		commands: [command],
		undo: false,
	});
	await sync.settled();
	expect(sent).toHaveLength(2);
	expect(sent[1]).toBe(
		'WorkDeleteStep(threadId=["th-geng-review"], stepId=["server-step"]);',
	);
});

it.each(["step", "fact"] as const)(
	"undo recreates a deleted %s and subsequent edits use its new server id",
	async (kind) => {
		const { actions, sent } = fakeActions();
		const onError = vi.fn();
		const sync = createLiveSync(actions, onError);
		const previous = createInitialCollaborationState();
		const threadId = "th-geng-review";
		const rowId = `saved-${kind}`;
		previous.workspaces[threadId].steps = [
			{
				id: rowId,
				text: "Saved step",
				kind: "task",
				status: "open",
				ownerId: "me",
				due: null,
			},
		];
		previous.workspaces[threadId].facts = [
			{ id: rowId, text: "Saved fact", from: "You", status: "confirmed" },
		];
		const command: CollaborationCommand =
			kind === "step"
				? {
						type: "workspace.step",
						threadId,
						operation: "remove",
						step: { id: rowId },
					}
				: {
						type: "workspace.fact",
						threadId,
						operation: "remove",
						fact: { id: rowId },
					};
		const next = collaborationReducer(previous, command, NOW);
		sync({ previous, next, commands: [command], undo: false });
		sync({ previous: next, next: previous, commands: [], undo: true });
		const edit: CollaborationCommand =
			kind === "step"
				? {
						type: "workspace.step",
						threadId,
						operation: "save",
						step: { id: rowId, text: "Edited" },
					}
				: {
						type: "workspace.fact",
						threadId,
						operation: "save",
						fact: { id: rowId, text: "Edited" },
					};
		sync({
			previous,
			next: collaborationReducer(previous, edit, NOW),
			commands: [edit],
			undo: false,
		});
		await sync.settled();
		expect(sent).toHaveLength(3);
		expect(sent[1]).not.toContain('"id":');
		expect(sent[2]).toContain(`"id":"server-${kind}"`);
		expect(sent[2]).toContain('"text":"Edited"');
		expect(sync.localId(`server-${kind}`)).toBe(rowId);
		expect(onError).not.toHaveBeenCalled();
	},
);

it("undo restores a generated step through its existing soft-deleted server row", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const previous = createInitialCollaborationState();
	const threadId = "th-geng-review";
	previous.workspaces[threadId].steps = [
		{
			id: "generated-step",
			text: "Reply to Kira",
			kind: "task",
			status: "open",
			ownerId: "me",
			due: null,
			isGenerated: true,
		},
	];
	const command: CollaborationCommand = {
		type: "workspace.step",
		threadId,
		operation: "remove",
		step: { id: "generated-step" },
	};
	const next = collaborationReducer(previous, command, NOW);
	sync({ previous, next, commands: [command], undo: false });
	sync({ previous: next, next: previous, commands: [], undo: true });
	await sync.settled();
	expect(sent).toHaveLength(2);
	expect(sent[1]).toContain('"id":"generated-step"');
	expect(sent[1]).toContain('"status":"open"');
});

it("undo recreates a deleted topic note without sending its removed id", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const previous = createInitialCollaborationState();
	const topic = previous.topics[0];
	const note = topic.notes[0];
	if (!note) throw new Error("Missing saved note");
	const command: CollaborationCommand = {
		type: "topic.note",
		topicId: topic.id,
		kind: "note",
		operation: "remove",
		noteId: note.noteId,
	};
	const next = collaborationReducer(previous, command, NOW);
	sync({ previous, next, commands: [command], undo: false });
	sync({ previous: next, next: previous, commands: [], undo: true });
	await sync.settled();
	expect(sent).toHaveLength(2);
	expect(sent[1]).toMatch(/^BrainSaveTopicNote\(/);
	expect(sent[1]).not.toContain("noteId=");
	expect(sync.localId("server-note")).toBe(note.noteId);
});

it("clears a manual priority with the backend's empty-noun contract", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const previous = createInitialCollaborationState();
	const item = previous.items.find(
		(candidate) => candidate.priority !== null,
	);
	if (!item) throw new Error("Missing prioritized item");
	const command: CollaborationCommand = {
		type: "item.update",
		itemId: item.id,
		changes: { priority: null },
	};
	sync({
		previous,
		next: collaborationReducer(previous, command, NOW),
		commands: [command],
		undo: false,
	});
	await sync.settled();
	expect(sent).toContain(
		`WorkUpdateItem(itemId=["${item.id}"], priority=[]);`,
	);
});

it("persists topic calendar series supported by BrainSaveTopic", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	sync({
		...step({
			type: "topic.save",
			topic: { id: "t-geng", calendarSeries: ["series-1"] },
		}),
		undo: false,
	});
	await sync.settled();
	expect(sent).toEqual([
		'BrainSaveTopic(topic=[{"id":"t-geng","calendarSeries":["series-1"]}]);',
	]);
});

it("does not recreate server steps delivered alongside a local edit", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const previous = createInitialCollaborationState();
	const rename: CollaborationCommand = {
		type: "topic.save",
		topic: { id: "t-geng", name: "Renamed" },
	};
	const insights: CollaborationCommand = {
		type: "thread.insights",
		threadId: "th-geng-review",
		summary: "New summary",
		summaryCurrent: true,
		steps: [
			{
				id: "generated-new",
				text: "Follow up",
				kind: "task",
				status: "open",
				ownerId: "me",
				due: null,
				isGenerated: true,
			},
		],
	};
	const next = collaborationReducer(
		collaborationReducer(previous, insights, NOW),
		rename,
		NOW,
	);
	sync({ previous, next, commands: [insights, rename], undo: false });
	await sync.settled();
	expect(
		sent.filter((statement) => statement.startsWith("WorkSaveStep")),
	).toEqual([]);
});

it("reports a missing created id before writing dependent rows", async () => {
	const run = vi.fn().mockResolvedValue({
		pixelReturn: [{ output: {}, operationType: [] }],
	});
	const onError = vi.fn();
	const sync = createLiveSync({ run } as unknown as InsightActions, onError);
	sync({
		...step({
			type: "item.create",
			threadId: "th-geng-review",
			text: "Call the vendor",
		}),
		undo: false,
	});
	await sync.settled();
	expect(run).toHaveBeenCalledTimes(1);
	expect(onError).toHaveBeenCalledWith(
		"The saved record did not return an id.",
	);
});
