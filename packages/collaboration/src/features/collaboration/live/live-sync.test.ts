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
