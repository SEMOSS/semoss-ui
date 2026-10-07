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
				output: /^WorkCreateItem\(/.test(statement)
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

it("a merge sends one BrainMergeTopics operation", async () => {
	const { actions, sent } = fakeActions();
	const onError = vi.fn();
	const sync = createLiveSync(actions, onError);
	const merge = step({
		type: "topic.merge",
		sourceId: "t-geng",
		targetId: "t-gsales",
	});
	sync(merge);
	await sync.settled();
	expect(sent).toEqual([
		'BrainMergeTopics(sourceTopicId=["t-geng"], targetTopicId=["t-gsales"]);',
	]);
	expect(onError).not.toHaveBeenCalled();
});

it("a rename saves the changed topic name", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const rename = step({
		type: "topic.save",
		topic: { id: "t-geng", name: "Renamed" },
	});
	sync(rename);
	await sync.settled();
	expect(sent).toEqual([
		'BrainSaveTopic(topic=[{"id":"t-geng","name":"Renamed"}]);',
	]);
});

it("a delete sends one BrainDeleteTopic operation", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const deleted = step({ type: "topic.delete", topicId: "t-geng" });
	sync(deleted);
	await sync.settled();
	expect(sent).toEqual(['BrainDeleteTopic(topicId=["t-geng"]);']);
});

it("a session-only snooze check does not write to the backend", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	sync(step({ type: "snooze.expire" }));
	await sync.settled();
	expect(sent).toEqual([]);
});

it("a new item's step is saved after the item, with the item's server id", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const created = step({
		type: "item.create",
		threadId: "th-geng-review",
		text: "Call the vendor",
	});
	sync(created);
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
		sync({ previous: state, next, commands: [command] });
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
		sync({ previous: state, next, commands: [command] });
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
	sync(created);
	sync({
		previous: created.next,
		next: collaborationReducer(created.next, command, NOW),
		commands: [command],
	});
	await sync.settled();
	expect(sent).toHaveLength(2);
	expect(sent[1]).toBe(
		'WorkDeleteStep(threadId=["th-geng-review"], stepId=["server-step"]);',
	);
});

it.each(["step", "fact"] as const)(
	"edits a new %s using its server id while creation is still queued",
	async (kind) => {
		const { actions, sent } = fakeActions();
		const onError = vi.fn();
		const sync = createLiveSync(actions, onError);
		const previous = createInitialCollaborationState();
		const threadId = "th-geng-review";
		const command: CollaborationCommand =
			kind === "step"
				? {
						type: "workspace.step",
						threadId,
						operation: "save",
						step: { text: "New step" },
					}
				: {
						type: "workspace.fact",
						threadId,
						operation: "save",
						fact: { text: "New fact" },
					};
		const next = collaborationReducer(previous, command, NOW);
		const rows =
			kind === "step"
				? next.workspaces[threadId].steps
				: next.workspaces[threadId].facts;
		const rowId = rows.at(-1)?.id;
		if (!rowId) throw new Error(`Missing created ${kind}`);
		sync({ previous, next, commands: [command] });
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
			previous: next,
			next: collaborationReducer(next, edit, NOW),
			commands: [edit],
		});
		await sync.settled();
		expect(sent).toHaveLength(2);
		expect(sent[0]).not.toContain('"id":');
		expect(sent[1]).toContain(`"id":"server-${kind}"`);
		expect(sent[1]).toContain('"text":"Edited"');
		expect(sync.localId(`server-${kind}`)).toBe(rowId);
		expect(onError).not.toHaveBeenCalled();
	},
);

it("removes a generated step by its existing server id", async () => {
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
	sync({ previous, next, commands: [command] });
	await sync.settled();
	expect(sent).toEqual([
		'WorkDeleteStep(threadId=["th-geng-review"], stepId=["generated-step"]);',
	]);
});

it("removes a new topic note by its server id while creation is still queued", async () => {
	const { actions, sent } = fakeActions();
	const sync = createLiveSync(actions, vi.fn());
	const created = step({
		type: "topic.note",
		topicId: "t-geng",
		kind: "note",
		operation: "save",
		text: "Discuss the budget",
	});
	const note = created.next.topics
		.find((topic) => topic.id === "t-geng")
		?.notes.at(-1);
	if (!note) throw new Error("Missing created note");
	const command: CollaborationCommand = {
		type: "topic.note",
		topicId: "t-geng",
		kind: "note",
		operation: "remove",
		noteId: note.noteId,
	};
	sync(created);
	sync({
		previous: created.next,
		next: collaborationReducer(created.next, command, NOW),
		commands: [command],
	});
	await sync.settled();
	expect(sent).toHaveLength(2);
	expect(sent[0]).toMatch(/^BrainSaveTopicNote\(/);
	expect(sent[0]).not.toContain("noteId=");
	expect(sent[1]).toBe(
		'BrainDeleteTopicNote(topicId=["t-geng"], noteId=["server-note"]);',
	);
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
	sync({ previous, next, commands: [insights, rename] });
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
	});
	await sync.settled();
	expect(run).toHaveBeenCalledTimes(1);
	expect(onError).toHaveBeenCalledWith(
		"The saved record did not return an id.",
	);
});
