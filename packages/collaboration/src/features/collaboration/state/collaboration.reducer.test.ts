import { describe, expect, it } from "vitest";
import { createInitialCollaborationState } from "./collaboration.fixtures";
import {
	type CollaborationHistory,
	collaborationHistoryReducer,
	collaborationReducer,
	createEmptyWorkspace,
	tomorrowAtEight,
} from "./collaboration.reducer";
import {
	selectThreadContext,
	selectWorkItems,
} from "./collaboration.selectors";
import type {
	CollaborationCommand,
	CollaborationState,
	Person,
	Thread,
	WorkItem,
} from "./collaboration.types";

const NOW = "2026-09-24T17:00:00.000Z";

function apply(
	state: CollaborationState,
	command: CollaborationCommand,
): CollaborationState {
	return collaborationReducer(state, command, NOW);
}

function importCommand(): Extract<
	CollaborationCommand,
	{ type: "source.import" }
> {
	const person: Person = {
		id: "outlook-person-alex",
		name: "Alex",
		initials: "A",
		email: "alex@example.org",
		accountId: null,
		title: "",
		relationship: "",
		color: "",
		vip: false,
		neverIngest: false,
		strength: null,
		lastContact: NOW,
		channels: { email: 1, teams: 0, meetings: 0 },
		topics: [],
		isSample: false,
	};
	const thread: Thread = {
		id: "local-outlook-1",
		channel: "email",
		subject: "An imported message",
		topicLinks: [],
		participants: [{ personId: person.id, role: "from", included: true }],
		muted: false,
		messageCount: 1,
		lastAt: NOW,
		roomId: null,
		summary: "",
		source: {
			kind: "outlook",
			nativeId: "AAMk-opaque-id+/=",
			folder: "Inbox",
		},
		isSample: false,
	};
	const item: WorkItem = {
		id: "outlook-item-1",
		threadId: thread.id,
		channel: "email",
		actorId: person.id,
		title: thread.subject,
		askType: "review",
		priority: null,
		score: null,
		reasons: [],
		due: null,
		received: NOW,
		status: "open",
		topicIds: [],
		isSample: false,
	};
	return {
		type: "source.import",
		thread,
		people: [person],
		item,
		workspace: {
			...createEmptyWorkspace(),
			messages: [
				{
					id: "native-message-id",
					fromId: person.id,
					at: NOW,
					text: "Please review the attached plan.",
				},
			],
		},
	};
}

describe("shared collaboration session", () => {
	it("opens a workspace for any loaded thread without fabricating missing source messages", () => {
		const state = apply(createInitialCollaborationState(), {
			type: "workspace.open",
			threadId: "th-procurement",
		});
		expect(state.openThreadIds).toContain("th-procurement");
		expect(state.workspaces["th-procurement"]).toEqual(
			createEmptyWorkspace(),
		);
		expect(
			selectThreadContext(state, "th-procurement")?.topics.length,
		).toBeGreaterThan(0);
	});

	it("generates a topic ID when the editor supplies an undefined existing ID", () => {
		const state = apply(createInitialCollaborationState(), {
			type: "topic.save",
			topic: { id: undefined, name: "New initiative" },
		});
		expect(state.topics.at(-1)).toMatchObject({
			id: "local-topic-1",
			name: "New initiative",
			isSample: false,
		});
	});

	it("updates note and goal status without requiring unchanged text again", () => {
		let state = apply(createInitialCollaborationState(), {
			type: "topic.note",
			topicId: "t-geng",
			kind: "note",
			operation: "save",
			noteId: "t-geng-note-2",
			status: "confirmed",
		});
		const topic = state.topics.find(
			(candidate) => candidate.id === "t-geng",
		);
		expect(topic?.notes[1]).toMatchObject({
			status: "confirmed",
			text: "Pilot scope is limited to 2 use cases (claims triage, contract Q&A).",
			source: "Email from Raj Mehta, Sep 20",
		});
		state = apply(state, {
			type: "topic.note",
			topicId: "t-geng",
			kind: "goal",
			operation: "save",
			noteId: "t-geng-goal-1",
			status: "done",
		});
		expect(
			state.topics.find((candidate) => candidate.id === "t-geng")
				?.goals[0],
		).toMatchObject({ noteId: "t-geng-goal-1", status: "done" });
		state = apply(state, {
			type: "topic.note",
			topicId: "t-geng",
			kind: "note",
			operation: "save",
			status: "confirmed",
		});
		expect(
			state.topics.find((candidate) => candidate.id === "t-geng")?.notes,
		).toHaveLength(2);
	});

	it("normalizes sample timestamps and IDs without treating fake rooms as backend rooms", () => {
		const state = createInitialCollaborationState();
		expect(state.today).toBe("2026-09-24");
		expect(state.liveProfile).toBeNull();
		expect(
			state.threads.every(
				(thread) => thread.roomId === null && thread.isSample,
			),
		).toBe(true);
		expect(
			state.threads.find((thread) => thread.id === "th-geng-review")
				?.lastAt,
		).toBe("2026-09-24T13:02:00.000Z");
		expect(
			state.topics
				.flatMap((topic) => [...topic.goals, ...topic.notes])
				.every((note) => Boolean(note.noteId)),
		).toBe(true);
		expect(state.reviews.every((review) => review.status === "open")).toBe(
			true,
		);
	});

	it("keeps exactly one primary topic with unlimited links and updates Work links", () => {
		let state = createInitialCollaborationState();
		for (const topic of state.topics)
			state = apply(state, {
				type: "thread.link",
				threadId: "th-geng-review",
				topicId: topic.id,
				operation: "add",
			});
		state = apply(state, {
			type: "thread.link",
			threadId: "th-geng-review",
			topicId: "t-board",
			operation: "primary",
		});
		const thread = state.threads.find(
			(value) => value.id === "th-geng-review",
		);
		expect(thread?.topicLinks).toHaveLength(7);
		expect(
			thread?.topicLinks
				.filter((link) => link.primary)
				.map((link) => link.topicId),
		).toEqual(["t-board"]);
		expect(
			state.items.find((item) => item.id === "i1")?.topicIds,
		).toHaveLength(7);
		state = apply(state, {
			type: "thread.link",
			threadId: "th-geng-review",
			topicId: "t-board",
			operation: "remove",
		});
		expect(
			state.threads
				.find((value) => value.id === "th-geng-review")
				?.topicLinks.filter((link) => link.primary),
		).toHaveLength(1);
		expect(
			state.items.find((item) => item.id === "i1")?.topicIds,
		).not.toContain("t-board");
	});

	it("updates both membership views and preserves suggestion origin on acceptance", () => {
		const state = apply(createInitialCollaborationState(), {
			type: "review.resolve",
			reviewId: "r3",
			decision: "accept",
		});
		expect(
			state.topics
				.find((topic) => topic.id === "t-gsales")
				?.people.find((person) => person.personId === "p-ken"),
		).toMatchObject({ state: "member", origin: "brain" });
		expect(
			state.people.find((person) => person.id === "p-ken")?.topics,
		).toContain("t-gsales");
		const removed = apply(state, {
			type: "topic.person",
			topicId: "t-gsales",
			personId: "p-ken",
			state: "removed",
		});
		expect(
			removed.people.find((person) => person.id === "p-ken")?.topics,
		).not.toContain("t-gsales");
		expect(
			removed.threads.find((thread) => thread.id === "th-procurement")
				?.topicLinks,
		).toEqual(
			state.threads.find((thread) => thread.id === "th-procurement")
				?.topicLinks,
		);
	});

	it("deletes a topic with its links and rules; threads keep one primary topic", () => {
		let state = createInitialCollaborationState();
		state = apply(state, {
			type: "rule.add",
			rule: {
				kind: "exclude_topic",
				topicId: "t-geng",
				value: "t-geng",
				isSample: true,
			},
		});
		const linked = state.threads.filter((thread) =>
			thread.topicLinks.some((link) => link.topicId === "t-geng"),
		);
		expect(linked.length).toBeGreaterThan(0);
		state = apply(state, { type: "topic.delete", topicId: "t-geng" });
		expect(state.topics.some((topic) => topic.id === "t-geng")).toBe(false);
		expect(state.rules.some((rule) => rule.topicId === "t-geng")).toBe(
			false,
		);
		expect(
			state.items.some((item) => item.topicIds.includes("t-geng")),
		).toBe(false);
		for (const { id } of linked) {
			const links =
				state.threads.find((thread) => thread.id === id)?.topicLinks ??
				[];
			expect(links.some((link) => link.topicId === "t-geng")).toBe(false);
			if (links.length)
				expect(links.filter((link) => link.primary)).toHaveLength(1);
		}
	});

	it("merges topic links, notes, members, rules and Work associations atomically", () => {
		let state = createInitialCollaborationState();
		state = apply(state, {
			type: "rule.add",
			rule: {
				kind: "exclude_topic",
				topicId: "t-geng",
				value: "t-geng",
				isSample: true,
			},
		});
		state = apply(state, {
			type: "topic.merge",
			sourceId: "t-geng",
			targetId: "t-gsales",
		});
		expect(state.topics.some((topic) => topic.id === "t-geng")).toBe(false);
		expect(
			state.topics
				.find((topic) => topic.id === "t-gsales")
				?.notes.some((note) => note.noteId === "t-geng-note-1"),
		).toBe(true);
		expect(
			state.items.find((item) => item.id === "i1")?.topicIds,
		).toContain("t-gsales");
		expect(state.rules.at(-1)?.topicId).toBe("t-gsales");
		expect(
			state.people.find((person) => person.id === "p-priya")?.topics,
		).toContain("t-gsales");
		expect(
			state.threads.every(
				(thread) =>
					thread.topicLinks.length === 0 ||
					thread.topicLinks.filter((link) => link.primary).length ===
						1,
			),
		).toBe(true);
		expect(
			state.topics
				.find((topic) => topic.id === "t-gsales")
				?.people.filter((person) => person.personId === "p-raj"),
		).toHaveLength(1);
	});

	it("resolves topic choices into the same links and counts used by Work", () => {
		const state = apply(createInitialCollaborationState(), {
			type: "review.resolve",
			reviewId: "r2",
			decision: "accept",
			targetTopicId: "t-gsales",
		});
		expect(
			state.threads.find((thread) => thread.id === "th-raj-chat"),
		).toMatchObject({
			needsTopicChoice: false,
			topicLinks: [
				{ topicId: "t-gsales", source: "confirmed", primary: true },
			],
		});
		expect(
			state.reviews.find((review) => review.id === "r2"),
		).toMatchObject({ status: "accepted", resolvedAt: NOW });
	});

	it("accepts a topic candidate using its existing opaque ID", () => {
		const state = apply(createInitialCollaborationState(), {
			type: "review.resolve",
			reviewId: "r1",
			decision: "accept",
		});
		expect(
			state.topics.find((topic) => topic.id === "st-gsec"),
		).toMatchObject({
			name: "Google - Security review",
			status: "active",
			isSample: true,
		});
		expect(state.reviews.find((review) => review.id === "r1")?.status).toBe(
			"accepted",
		);
	});

	it("syncs explicit next-step associations without guessing from titles", () => {
		let state = createInitialCollaborationState();
		state = apply(state, {
			type: "workspace.step",
			threadId: "th-geng-review",
			operation: "save",
			step: { id: "independent", text: state.items[0].title },
		});
		state = apply(state, {
			type: "item.update",
			itemId: "i1",
			changes: { status: "done" },
		});
		expect(
			state.workspaces["th-geng-review"].steps.find(
				(step) => step.id === "a1",
			)?.status,
		).toBe("done");
		expect(
			state.workspaces["th-geng-review"].steps.find(
				(step) => step.id === "independent",
			)?.status,
		).toBe("open");
		state = apply(state, {
			type: "workspace.step",
			threadId: "th-geng-review",
			operation: "save",
			step: { id: "a1", status: "open" },
		});
		expect(state.items.find((item) => item.id === "i1")?.status).toBe(
			"open",
		);
		expect(
			state.items.find((item) => item.id === "i1")?.completedAt,
		).toBeUndefined();
	});

	it("bounds filing thresholds to the mockup ranges", () => {
		const state = apply(createInitialCollaborationState(), {
			type: "settings.save",
			changes: { fileAt: 50, askAt: 90 },
		});
		expect(state.settings).toMatchObject({
			fileAt: 60,
			askAt: 55,
			version: 2,
		});
	});

	it("uses tomorrow at 08:00 across daylight saving changes", () => {
		expect(
			tomorrowAtEight("2026-03-07T22:00:00.000Z", "America/New_York"),
		).toBe("2026-03-08T12:00:00.000Z");
		expect(
			tomorrowAtEight("2026-10-31T22:00:00.000Z", "America/New_York"),
		).toBe("2026-11-01T13:00:00.000Z");
		expect(
			tomorrowAtEight("2026-09-24T23:00:00.000Z", "Asia/Kolkata"),
		).toBe("2026-09-26T02:30:00.000Z");
	});

	it("restores waiting items when snoozes expire", () => {
		let state = apply(createInitialCollaborationState(), {
			type: "item.update",
			itemId: "i12",
			changes: { status: "snoozed" },
		});
		expect(state.items.find((item) => item.id === "i12")).toMatchObject({
			status: "snoozed",
			snoozedFrom: "waiting",
			snoozeUntil: "2026-09-25T12:00:00.000Z",
		});
		state = collaborationReducer(
			state,
			{ type: "snooze.expire" },
			"2026-09-25T12:00:00.000Z",
		);
		expect(state.items.find((item) => item.id === "i12")?.status).toBe(
			"waiting",
		);
		expect(
			state.items.find((item) => item.id === "i12")?.snoozeUntil,
		).toBeUndefined();
	});

	it("caps the local undo journal at 50 changes", () => {
		let history: CollaborationHistory = {
			state: createInitialCollaborationState(),
			past: [],
		};
		for (let index = 0; index < 60; index += 1)
			history = collaborationHistoryReducer(history, {
				command: {
					type: "thread.goal",
					threadId: "th-geng-review",
					goal: `Goal ${index}`,
				},
				now: NOW,
			});
		expect(history.past).toHaveLength(50);
		for (let index = 0; index < 50; index += 1)
			history = collaborationHistoryReducer(history, { type: "undo" });
		expect(history.state.workspaces["th-geng-review"].goal).toBe("Goal 9");
		expect(history.past).toHaveLength(0);
	});

	it("retains imports and latest body when undoing a prior local edit", () => {
		let history: CollaborationHistory = {
			state: createInitialCollaborationState(),
			past: [],
		};
		history = collaborationHistoryReducer(history, {
			command: {
				type: "item.update",
				itemId: "i1",
				changes: { status: "done" },
			},
			now: NOW,
		});
		history = collaborationHistoryReducer(history, {
			command: importCommand(),
			now: NOW,
		});
		expect(history.past).toHaveLength(1);
		history = collaborationHistoryReducer(history, { type: "undo" });
		expect(
			history.state.threads.find(
				(thread) => thread.id === "local-outlook-1",
			)?.source?.nativeId,
		).toBe("AAMk-opaque-id+/=");
		expect(
			history.state.workspaces["local-outlook-1"].messages[0].text,
		).toBe("Please review the attached plan.");
		expect(
			history.state.items.find((item) => item.id === "i1")?.status,
		).toBe("open");
	});

	it("refreshes a native source idempotently and preserves local decisions", () => {
		const command = importCommand();
		let state = apply(createInitialCollaborationState(), command);
		state = apply(state, {
			type: "thread.goal",
			threadId: command.thread.id,
			goal: "Review together",
		});
		state = apply(state, {
			type: "thread.participant",
			threadId: command.thread.id,
			personId: command.people[0].id,
			included: false,
		});
		state = apply(state, {
			type: "item.update",
			itemId: "outlook-item-1",
			changes: { status: "done" },
		});
		state = apply(state, {
			...command,
			thread: {
				...command.thread,
				id: "another-local-id",
				subject: "Updated",
			},
			workspace: {
				messages: [
					{
						id: "new",
						fromId: command.people[0].id,
						at: NOW,
						text: "Updated body",
					},
				],
			},
		});
		expect(state.threads.filter((thread) => !thread.isSample)).toHaveLength(
			1,
		);
		expect(
			state.threads.find((thread) => thread.id === command.thread.id),
		).toMatchObject({
			subject: "Updated",
			participants: [{ included: false }],
		});
		expect(state.workspaces[command.thread.id]).toMatchObject({
			goal: "Review together",
			messages: [{ text: "Updated body" }],
		});
		expect(
			state.items.find((item) => item.id === "outlook-item-1")?.status,
		).toBe("done");
		expect(
			selectWorkItems(state, { isSample: false, view: "done_today" })
				.total,
		).toBe(1);
	});

	it("closes a workspace tab without changing thread data", () => {
		const initial = createInitialCollaborationState();
		const state = apply(initial, {
			type: "workspace.close",
			threadId: "th-geng-review",
		});
		expect(state.openThreadIds).not.toContain("th-geng-review");
		expect(state.workspaces["th-geng-review"]).toEqual(
			initial.workspaces["th-geng-review"],
		);
		expect(
			state.threads.find((thread) => thread.id === "th-geng-review"),
		).toEqual(
			initial.threads.find((thread) => thread.id === "th-geng-review"),
		);
	});
});

describe("assistant context selection", () => {
	it("excludes messages, unconfirmed topics and draft facts from the submitted snapshot", () => {
		const state = createInitialCollaborationState();
		const context = selectThreadContext(state, "th-geng-review");
		expect(context?.messages.map((message) => message.fromId)).toEqual([
			"p-priya",
			"p-raj",
			"p-marcus",
		]);
		expect(context?.topics.map((topic) => topic.id)).toEqual(["t-geng"]);
		expect(
			context?.topics
				.flatMap((topic) => topic.notes)
				.every((note) => note.status === "confirmed"),
		).toBe(true);
		expect(
			context?.facts.every((fact) => fact.status === "confirmed"),
		).toBe(true);
		expect(context?.hiddenCount).toBe(2);
		expect(JSON.stringify(context)).not.toContain(
			"registration for the Google Cloud Partner Summit",
		);
	});

	it("revises the snapshot when inclusion changes and restores previously excluded messages when allowed", () => {
		const state = createInitialCollaborationState();
		const before = selectThreadContext(state, "th-geng-review");
		const changed = apply(state, {
			type: "thread.participant",
			threadId: "th-geng-review",
			personId: "p-tom",
			included: true,
		});
		const after = selectThreadContext(changed, "th-geng-review");
		expect(after?.messages).toHaveLength(5);
		expect(after?.revision).not.toBe(before?.revision);
	});

	it("keeps fictional profile and topic notes out of connected-source context", () => {
		let state = apply(createInitialCollaborationState(), importCommand());
		state = apply(state, {
			type: "thread.link",
			threadId: "local-outlook-1",
			topicId: "t-geng",
			operation: "add",
		});
		const context = selectThreadContext(state, "local-outlook-1");
		expect(context?.profile).toBeNull();
		expect(context?.topics).toEqual([]);
		expect(context?.messages).toHaveLength(1);
		expect(JSON.stringify(context)).not.toContain("Kunal");
		expect(
			state.items.find((item) => item.id === "outlook-item-1"),
		).toMatchObject({ score: null, priority: null });
	});

	it("applies local exclusion rules to future submitted messages without deleting them", () => {
		let state = apply(createInitialCollaborationState(), importCommand());
		state = apply(state, {
			type: "rule.add",
			rule: { kind: "never_sender", value: "alex@example.org" },
		});
		expect(selectThreadContext(state, "local-outlook-1")?.messages).toEqual(
			[],
		);
		expect(state.workspaces["local-outlook-1"].messages).toHaveLength(1);
		expect(
			selectThreadContext(state, "th-geng-review")?.messages,
		).toHaveLength(3);
		const id = state.rules.at(-1)?.id ?? "";
		state = apply(state, { type: "rule.remove", ruleId: id });
		expect(
			selectThreadContext(state, "local-outlook-1")?.messages,
		).toHaveLength(1);
	});

	it("removes recognizable quoted reply history from submitted mail", () => {
		const command = importCommand();
		command.workspace = {
			messages: [
				{
					id: "msg",
					fromId: command.people[0].id,
					at: NOW,
					text: "Yes, that works.\n\nFrom: Excluded Person\nA private previous message",
				},
			],
		};
		const state = apply(createInitialCollaborationState(), command);
		const context = selectThreadContext(state, command.thread.id);
		expect(context?.messages[0].text).toBe("Yes, that works.");
		expect(JSON.stringify(context)).not.toContain(
			"A private previous message",
		);
	});

	it("applies a person-scoped topic rule only on that topic", () => {
		const state = apply(createInitialCollaborationState(), {
			type: "rule.add",
			rule: {
				kind: "exclude_topic",
				value: "t-gsales",
				topicId: "t-gsales",
				personId: "p-raj",
				isSample: true,
			},
		});
		expect(
			selectThreadContext(state, "th-geng-review")?.participants.find(
				(person) => person.personId === "p-raj",
			)?.included,
		).toBe(true);
		expect(
			selectThreadContext(state, "th-raj-chat")?.participants.find(
				(person) => person.personId === "p-raj",
			)?.included,
		).toBe(false);
		expect(
			selectThreadContext(state, "th-procurement")?.participants.find(
				(person) => person.personId === "p-ken",
			)?.included,
		).toBe(true);
	});
});
