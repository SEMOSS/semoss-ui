import { expect, it, vi } from "vitest";
import { createLiveSync } from "@/features/collaboration/live/live-sync";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { collaborationReducer } from "@/features/collaboration/state/collaboration.reducer";
import type { CollaborationCommand } from "@/features/collaboration/state/collaboration.types";
import type { InsightActions } from "@/lib/pixel";
import { directItem, savedTopic } from "./topic-test-fixtures";

const now = "2026-10-09T12:00:00Z";

it("preserves direct source-less work across refresh, thread changes, topic merge and deletion", () => {
	let state = createInitialCollaborationState();
	state.topics = [savedTopic, { ...savedTopic, id: "target" }];
	state.items = [directItem];
	state.threads = [];
	state = collaborationReducer(
		state,
		{
			type: "live.refresh",
			updates: { threads: [], workspaces: {}, items: [directItem] },
		},
		now,
	);
	expect(state.items[0]).toEqual(directItem);
	expect(state.topics[0].stats.openItems).toBe(1);
	state = collaborationReducer(
		state,
		{ type: "topic.merge", sourceId: savedTopic.id, targetId: "target" },
		now,
	);
	expect(state.items[0]).toMatchObject({
		linkTopicId: "target",
		roomId: "room-task",
		assignee: "person-owner",
		threadId: "",
	});
	state = collaborationReducer(
		state,
		{ type: "topic.delete", topicId: "target" },
		now,
	);
	expect(state.items[0]).toMatchObject({
		linkTopicId: null,
		roomId: "room-task",
		assignee: "person-owner",
	});
});

it("only clears stale topic associations after a complete read and protects in-flight edits", () => {
	const initial = createInitialCollaborationState();
	initial.items = [directItem];
	const receive = (complete: boolean, keepItemIds: string[] = []) =>
		collaborationReducer(
			initial,
			{
				type: "topic.work.received",
				topicId: savedTopic.id,
				items: [],
				complete,
				keepItemIds,
			},
			now,
		);
	expect(receive(false).items[0].linkTopicId).toBe(savedTopic.id);
	expect(receive(true, [directItem.id]).items[0].linkTopicId).toBe(
		savedTopic.id,
	);
	expect(receive(true).items[0].linkTopicId).toBeNull();
});

it("protects a saved task batched before an older topic response", () => {
	const initial = createInitialCollaborationState();
	initial.topics = [savedTopic];
	initial.items = [directItem];
	const updated = collaborationReducer(
		initial,
		{
			type: "item.received",
			item: { ...directItem, status: "done" },
		},
		now,
	);
	const state = collaborationReducer(
		updated,
		{
			type: "topic.work.received",
			topicId: savedTopic.id,
			items: [directItem],
			complete: true,
			baseline: { topicExists: true, items: initial.items },
		},
		now,
	);
	expect(state.items[0].status).toBe("done");
});

it("protects confirmed task and goal saves from a globally refreshed snapshot in the same batch", () => {
	const initial = createInitialCollaborationState();
	initial.topics = [savedTopic];
	initial.items = [directItem];
	initial.threads = [];
	const item = { ...directItem, status: "done" as const };
	const goal = {
		noteId: "goal-confirmed",
		text: "Ready to travel",
		status: "open" as const,
	};
	let state = collaborationReducer(
		initial,
		{ type: "item.received", item },
		now,
	);
	state = collaborationReducer(
		state,
		{ type: "topic.goal.received", topicId: savedTopic.id, goal },
		now,
	);
	state = collaborationReducer(
		state,
		{
			type: "live.refresh",
			updates: {
				items: [directItem],
				topics: [savedTopic],
				threads: [],
				workspaces: {},
				baseline: initial,
			},
		},
		now,
	);
	expect(state.items[0].status).toBe("done");
	expect(state.topics[0].goals).toEqual([goal]);
});

it("does not restore deleted topics or direct links during a global response in the same batch", () => {
	const initial = createInitialCollaborationState();
	initial.topics = [savedTopic];
	initial.items = [directItem];
	initial.threads = [];
	let state = collaborationReducer(
		initial,
		{ type: "topic.delete", topicId: savedTopic.id },
		now,
	);
	state = collaborationReducer(
		state,
		{
			type: "live.refresh",
			updates: {
				items: [directItem, { ...directItem, id: "new-item" }],
				topics: [savedTopic],
				threads: [],
				workspaces: {},
				baseline: initial,
			},
		},
		now,
	);
	expect(state.topics).toEqual([]);
	expect(state.items.map((item) => item.linkTopicId)).toEqual([null, null]);
});

it("does not restore a deleted topic's task or source associations from an in-flight read", () => {
	const initial = createInitialCollaborationState();
	const thread = {
		...initial.threads[0],
		isSample: false,
		topicLinks: [
			{
				topicId: savedTopic.id,
				confidence: 1,
				primary: true,
				source: "you" as const,
			},
		],
	};
	initial.topics = [savedTopic];
	initial.items = [directItem];
	initial.threads = [thread];
	let state = collaborationReducer(
		initial,
		{ type: "topic.delete", topicId: savedTopic.id },
		now,
	);
	state = collaborationReducer(
		state,
		{
			type: "topic.work.received",
			topicId: savedTopic.id,
			items: [directItem],
			complete: true,
			baseline: { topicExists: true, items: initial.items },
		},
		now,
	);
	state = collaborationReducer(
		state,
		{
			type: "topic.context.received",
			topicId: savedTopic.id,
			topic: savedTopic,
			threads: [thread],
			baseline: { topic: savedTopic, threads: initial.threads },
		},
		now,
	);
	expect(state.topics).toEqual([]);
	expect(state.items[0].linkTopicId).toBeNull();
	expect(state.threads[0].topicLinks).toEqual([]);
});

it("removes stale source memberships only from a completed topic source snapshot", () => {
	const initial = createInitialCollaborationState();
	initial.topics = [savedTopic];
	initial.threads = [
		{
			...initial.threads[0],
			isSample: false,
			topicLinks: [
				{
					topicId: savedTopic.id,
					confidence: 1,
					primary: true,
					source: "you",
				},
			],
		},
	];
	const partial = collaborationReducer(
		initial,
		{
			type: "topic.context.received",
			topicId: savedTopic.id,
			threads: [],
		},
		now,
	);
	expect(partial.threads[0].topicLinks).toHaveLength(1);
	const complete = collaborationReducer(
		initial,
		{
			type: "topic.context.received",
			topicId: savedTopic.id,
			threads: [],
			completeThreads: true,
			baseline: { topic: savedTopic, threads: initial.threads },
		},
		now,
	);
	expect(complete.threads[0].topicLinks).toEqual([]);
});

it("does not duplicate server-owned topic, goal, or item writes when batched with an owner edit", async () => {
	const previous = createInitialCollaborationState();
	previous.topics = [];
	previous.items = [];
	const commands: CollaborationCommand[] = [
		{ type: "topic.received", topic: savedTopic },
		{
			type: "topic.goal.received",
			topicId: savedTopic.id,
			goal: {
				noteId: "goal-server",
				text: "Ready to travel",
				status: "open",
			},
		},
		{ type: "item.received", item: directItem },
		{
			type: "item.update",
			itemId: directItem.id,
			changes: { priority: "P1" },
		},
	];
	const next = commands.reduce(
		(state, command) => collaborationReducer(state, command, now),
		previous,
	);
	const run = vi.fn().mockResolvedValue({
		pixelReturn: [{ output: true, operationType: [] }],
	});
	const error = vi.fn();
	const sync = createLiveSync({ run } as unknown as InsightActions, error);
	sync({ previous, next, commands });
	await sync.settled();
	expect(run).toHaveBeenCalledExactlyOnceWith(
		'WorkUpdateItem(itemId=["task-direct"], priority=["P1"]);',
	);
	expect(error).not.toHaveBeenCalled();
	expect(next.topics[0].goals).toHaveLength(1);
});
