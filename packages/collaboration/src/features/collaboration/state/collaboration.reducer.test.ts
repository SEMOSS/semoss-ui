import { describe, expect, it } from "vitest";
import { createInitialCollaborationState } from "./collaboration.fixtures";
import {
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

	it("updates goal status without requiring unchanged text again", () => {
		const state = apply(createInitialCollaborationState(), {
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
	});

	it("keeps a suggested memory out of use until it is kept, and an edit confirms it", () => {
		let state = createInitialCollaborationState();
		const suggestion = state.memories.find(
			(memory) => memory.id === "t-geng-note-2",
		);
		expect(suggestion).toMatchObject({
			state: "suggested",
			confirmed: false,
			about: [{ type: "topic", id: "t-geng" }],
		});
		state = apply(state, {
			type: "memory.resolve",
			memoryId: "t-geng-note-2",
			action: "accept",
		});
		expect(
			state.memories.find((memory) => memory.id === "t-geng-note-2"),
		).toMatchObject({ state: "active", confirmed: true });

		state = apply(state, {
			type: "memory.save",
			memory: {
				text: "  Sign emails as Rob  ",
				kind: "preference",
				isSample: true,
			},
		});
		const added = state.memories.at(-1);
		expect(added).toMatchObject({
			id: "local-memory-1",
			text: "Sign emails as Rob",
			kind: "preference",
			origin: "you",
			confirmed: true,
			state: "active",
			about: [],
		});
		state = apply(state, {
			type: "memory.save",
			memory: { id: "local-memory-1", text: "" },
		});
		expect(state.memories.at(-1)?.text).toBe("Sign emails as Rob");
		state = apply(state, {
			type: "memory.delete",
			memoryId: "local-memory-1",
		});
		expect(
			state.memories.some((memory) => memory.id === "local-memory-1"),
		).toBe(false);
	});

	it("dismisses only what the owner did not write, and takes server copies as they are", () => {
		let state = createInitialCollaborationState();
		const learned = {
			...state.memories[0],
			id: "m-learned",
			origin: "assistant" as const,
			confirmed: false,
		};
		state = apply(state, { type: "memory.server", memories: [learned] });
		state = apply(state, {
			type: "memory.resolve",
			memoryId: "m-sample-pref-1",
			action: "dismiss",
		});
		expect(state.memories[0].state).toBe("active");
		state = apply(state, {
			type: "memory.resolve",
			memoryId: "m-learned",
			action: "dismiss",
		});
		expect(
			state.memories.find((memory) => memory.id === "m-learned")?.state,
		).toBe("dismissed");
		state = apply(state, {
			type: "memory.resolve",
			memoryId: "m-learned",
			action: "restore",
		});
		expect(
			state.memories.find((memory) => memory.id === "m-learned")?.state,
		).toBe("active");
		// a dismissed copy from the server leaves the lists
		state = apply(state, {
			type: "memory.server",
			memories: [{ ...learned, state: "dismissed" }],
		});
		expect(state.memories.some((memory) => memory.id === "m-learned")).toBe(
			false,
		);
	});

	it("moves memory links with a topic merge and drops topic-only memories with a delete", () => {
		let state = createInitialCollaborationState();
		state = apply(state, {
			type: "memory.save",
			memory: {
				text: "Engineering reviews need a pre-read",
				about: [
					{ type: "topic", id: "t-geng" },
					{ type: "person", id: "p-ava" },
				],
				isSample: true,
			},
		});
		state = apply(state, {
			type: "topic.merge",
			sourceId: "t-geng",
			targetId: "t-gsales",
		});
		expect(
			state.memories.find((memory) => memory.id === "t-geng-note-1")
				?.about,
		).toEqual([{ type: "topic", id: "t-gsales" }]);
		state = apply(state, { type: "topic.delete", topicId: "t-gsales" });
		expect(
			state.memories.some((memory) => memory.id === "t-geng-note-1"),
		).toBe(false);
		expect(state.memories.at(-1)?.about).toEqual([
			{ type: "person", id: "p-ava" },
		]);
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
				.flatMap((topic) => topic.goals)
				.every((goal) => Boolean(goal.noteId)),
		).toBe(true);
		expect(state.memories.every((memory) => memory.isSample)).toBe(true);
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
				?.people.find((person) => person.personId === "p-gia"),
		).toMatchObject({ state: "member", origin: "brain" });
		expect(
			state.people.find((person) => person.id === "p-gia")?.topics,
		).toContain("t-gsales");
		const removed = apply(state, {
			type: "topic.person",
			topicId: "t-gsales",
			personId: "p-gia",
			state: "removed",
		});
		expect(
			removed.people.find((person) => person.id === "p-gia")?.topics,
		).not.toContain("t-gsales");
		expect(
			removed.threads.find((thread) => thread.id === "th-procurement")
				?.topicLinks,
		).toEqual(
			state.threads.find((thread) => thread.id === "th-procurement")
				?.topicLinks,
		);
	});

	it("keeps a loaded live profile when the signed-in placeholder arrives", () => {
		const base = createInitialCollaborationState();
		const placeholder = {
			...base.profile,
			id: "live-me",
			name: "Signed In",
			role: { value: "", source: "you" as const },
		};
		const loaded = {
			...base.profile,
			id: "p-robin",
			role: { value: "Backend lead", source: "you" as const },
		};
		let state = apply(base, { type: "live-profile.set", profile: loaded });
		state = apply(state, {
			type: "live-profile.set",
			profile: placeholder,
		});
		expect(state.liveProfile?.id).toBe("p-robin");
		expect(state.liveProfile?.role.value).toBe("Backend lead");
		state = apply(
			{ ...state, liveProfile: null },
			{ type: "live-profile.set", profile: placeholder },
		);
		expect(state.liveProfile?.id).toBe("live-me");
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

	it("merges topic links, memories, members, rules and Work associations atomically", () => {
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
			state.memories.find((memory) => memory.id === "t-geng-note-1")
				?.about,
		).toEqual([{ type: "topic", id: "t-gsales" }]);
		expect(
			state.items.find((item) => item.id === "i1")?.topicIds,
		).toContain("t-gsales");
		expect(state.rules.at(-1)?.topicId).toBe("t-gsales");
		expect(
			state.people.find((person) => person.id === "p-ava")?.topics,
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
				?.people.filter((person) => person.personId === "p-hugo"),
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
			state.threads.find((thread) => thread.id === "th-hugo-chat"),
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
			name: "Northwind - Security review",
			status: "active",
			isSample: true,
		});
		expect(state.reviews.find((review) => review.id === "r1")?.status).toBe(
			"accepted",
		);
	});

	it.each([true, false])(
		"activates a loaded topic suggestion without changing its source marker (sample: %s)",
		(isSample) => {
			const initial = createInitialCollaborationState();
			const candidate = {
				...initial.topics[0],
				id: "candidate-topic",
				status: "suggested" as const,
				isSample,
			};
			const review = {
				...initial.reviews[0],
				id: "candidate-review",
				kind: "new_topic" as const,
				refId: candidate.id,
				status: "open" as const,
				isSample,
				candidate: {
					name: candidate.name,
					accountId: candidate.accountId,
				},
			};
			initial.topics = [candidate];
			initial.reviews = [review];
			const accepted = apply(initial, {
				type: "review.resolve",
				reviewId: review.id,
				decision: "accept",
			});
			expect(accepted.topics).toHaveLength(1);
			expect(accepted.topics[0]).toMatchObject({
				id: candidate.id,
				name: candidate.name,
				description: candidate.description,
				status: "active",
				isSample,
			});
			expect(accepted.reviews[0]).toMatchObject({
				status: "accepted",
				resolvedAt: NOW,
				isSample,
			});
			expect(initial.topics[0].status).toBe("suggested");
			const refreshed = apply(accepted, {
				type: "live.refresh",
				updates: {
					threads: [],
					workspaces: {},
					items: [],
					topics: [candidate],
					reviews: [review],
					keepTopicIds: [candidate.id],
					keepReviewIds: [review.id],
				},
			});
			expect(refreshed.topics[0].status).toBe("active");
			expect(refreshed.reviews[0].status).toBe("accepted");
		},
	);

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

	it("preserves completion time when changing priority and dates only a new completion", () => {
		const completed = apply(createInitialCollaborationState(), {
			type: "item.update",
			itemId: "i1",
			changes: { status: "done" },
		});
		const later = "2026-09-25T18:00:00.000Z";
		const reprioritized = collaborationReducer(
			completed,
			{
				type: "item.update",
				itemId: "i1",
				changes: { priority: "P1" },
			},
			later,
		);
		expect(
			reprioritized.items.find((item) => item.id === "i1"),
		).toMatchObject({
			status: "done",
			priority: "P1",
			completedAt: NOW,
		});
		expect(
			completed.items.find((item) => item.id === "i1")?.completedAt,
		).toBe(NOW);
		const reopened = collaborationReducer(
			reprioritized,
			{ type: "item.update", itemId: "i1", changes: { status: "open" } },
			later,
		);
		expect(
			reopened.items.find((item) => item.id === "i1")?.completedAt,
		).toBeUndefined();
		const recompleted = collaborationReducer(
			reopened,
			{ type: "item.update", itemId: "i1", changes: { status: "done" } },
			later,
		);
		expect(
			recompleted.items.find((item) => item.id === "i1")?.completedAt,
		).toBe(later);
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

	it("retains the current state for unchanged commands and snooze checks", () => {
		const command: CollaborationCommand = {
			type: "thread.goal",
			threadId: "th-geng-review",
			goal: "Review together",
		};
		const initial = createInitialCollaborationState();
		const originalGoal = initial.workspaces[command.threadId].goal;
		const state = apply(initial, command);
		expect(initial.workspaces[command.threadId].goal).toBe(originalGoal);
		expect(state.workspaces[command.threadId].goal).toBe(command.goal);
		expect(apply(state, command)).toBe(state);
		expect(apply(state, { type: "snooze.expire" })).toBe(state);
		expect(
			apply(state, {
				type: "item.update",
				itemId: "missing-item",
				changes: { status: "done" },
			}),
		).toBe(state);
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
	it("retains subject-only mail and cleaned-body status without exposing quoted history", () => {
		const command = importCommand();
		command.thread.subject = "Project status request";
		command.workspace = {
			messages: [
				{
					id: "empty-email",
					fromId: command.people[0].id,
					fromName: "Alex",
					fromAddress: "alex@example.org",
					subject: "Project status request",
					at: NOW,
					text: "\nFrom: Earlier sender\nPrivate quoted history",
					displayBody: {
						contentType: "html",
						content: "<p>Private display body</p>",
					},
					attachments: [
						{
							id: "attachment-id",
							name: "plan.docx",
							isFile: true,
						},
					],
				},
			],
		};
		const state = apply(createInitialCollaborationState(), command);
		const context = selectThreadContext(state, command.thread.id);
		expect(context).toMatchObject({
			subject: "Project status request",
			channel: "email",
			hiddenCount: 0,
			emptyIds: ["empty-email"],
		});
		expect(context?.messages).toEqual([
			{
				id: "empty-email",
				fromId: command.people[0].id,
				fromName: "Alex",
				fromAddress: "alex@example.org",
				subject: "Project status request",
				at: NOW,
				text: "",
				bodyStatus: "no_readable_text",
				attachments: ["plan.docx"],
			},
		]);
		expect(JSON.stringify(context)).not.toContain("Private quoted history");
		expect(JSON.stringify(context)).not.toContain("Private display body");
		expect(JSON.stringify(context)).not.toContain("attachment-id");
		expect(state.workspaces[command.thread.id].messages[0].text).toContain(
			"Private quoted history",
		);
	});

	it.each(["never_sender", "never_keyword", "never_folder"] as const)(
		"keeps empty-email metadata behind the %s exclusion rule",
		(kind) => {
			const command = importCommand();
			command.thread.subject = "Private project status";
			command.workspace = {
				messages: [
					{
						id: "empty-email",
						fromId: command.people[0].id,
						fromAddress: "alex@example.org",
						subject: command.thread.subject,
						at: NOW,
						text: "",
					},
				],
			};
			let state = apply(createInitialCollaborationState(), command);
			state = apply(state, {
				type: "rule.add",
				rule: {
					kind,
					value:
						kind === "never_sender"
							? "alex@example.org"
							: kind === "never_folder"
								? "Inbox"
								: "Private project",
				},
			});
			const context = selectThreadContext(state, command.thread.id);
			expect(context?.messages).toEqual([]);
			expect(context?.emptyIds).toEqual([]);
			expect(context?.hiddenCount).toBe(1);
			expect(context).not.toHaveProperty("subject");
			expect(JSON.stringify(context)).not.toContain(
				"Private project status",
			);
			expect(state.workspaces[command.thread.id].messages).toHaveLength(
				1,
			);
		},
	);

	it("revises a subject-only snapshot when its source metadata changes", () => {
		const command = importCommand();
		command.workspace = {
			messages: [
				{
					id: "empty-email",
					fromId: command.people[0].id,
					subject: "Status",
					at: NOW,
					text: "",
				},
			],
		};
		const before = selectThreadContext(
			apply(createInitialCollaborationState(), command),
			command.thread.id,
		);
		command.workspace.messages = [
			{ ...command.workspace.messages[0], subject: "Revised status" },
		];
		const after = selectThreadContext(
			apply(createInitialCollaborationState(), command),
			command.thread.id,
		);
		expect(after?.revision).not.toBe(before?.revision);
	});

	it("excludes messages and unconfirmed topics, and leaves memories to the server", () => {
		const state = createInitialCollaborationState();
		const context = selectThreadContext(state, "th-geng-review");
		expect(context?.messages.map((message) => message.fromId)).toEqual([
			"p-ava",
			"p-hugo",
			"p-ben",
		]);
		expect(context?.topics.map((topic) => topic.id)).toEqual(["t-geng"]);
		// notes and facts are memories now; BrainMemoryRecall puts them in the prompt
		expect(JSON.stringify(context)).not.toContain(
			"Ava prefers a written pre-read",
		);
		expect(context).not.toHaveProperty("facts");
		expect(context?.hiddenCount).toBe(2);
		expect(JSON.stringify(context)).not.toContain(
			"registration for the Northwind Cloud Partner Summit",
		);
	});

	it("names an included email's attachments without their ids or bytes", () => {
		const state = createInitialCollaborationState();
		const workspace = state.workspaces["th-geng-review"];
		// p-ava is an included sender in this fixture thread
		const first = workspace.messages.find(
			(message) => message.fromId === "p-ava",
		);
		if (!first) throw new Error("Expected a fixture message");
		const withFiles: CollaborationState = {
			...state,
			workspaces: {
				...state.workspaces,
				"th-geng-review": {
					...workspace,
					messages: workspace.messages.map((message) =>
						message.id === first.id
							? {
									...message,
									attachments: [
										{
											id: "long-graph-attachment-id",
											name: "Budget.xlsx",
											isFile: true,
											messageId: message.id,
										},
									],
								}
							: message,
					),
				},
			},
		};
		const before = selectThreadContext(state, "th-geng-review");
		const context = selectThreadContext(withFiles, "th-geng-review");
		expect(
			context?.messages.find((message) => message.id === first.id)
				?.attachments,
		).toEqual(["Budget.xlsx"]);
		expect(JSON.stringify(context)).not.toContain(
			"long-graph-attachment-id",
		);
		expect(context?.revision).not.toBe(before?.revision);
	});

	it("revises the snapshot when inclusion changes and restores previously excluded messages when allowed", () => {
		const state = createInitialCollaborationState();
		const before = selectThreadContext(state, "th-geng-review");
		const changed = apply(state, {
			type: "thread.participant",
			threadId: "th-geng-review",
			personId: "p-dan",
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
		expect(JSON.stringify(context)).not.toContain("Robin");
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

	it("keeps forwarded mail the server marked as history", () => {
		const command = importCommand();
		command.workspace = {
			messages: [
				{
					id: "msg",
					fromId: command.people[0].id,
					at: NOW,
					text: "Did you see this?\n\nForwarded from Ops, Aug 28:\nFrom: Ops\nDue September 15.",
					history: true,
				},
			],
		};
		const state = apply(createInitialCollaborationState(), command);
		expect(
			selectThreadContext(state, command.thread.id)?.messages[0].text,
		).toContain("Due September 15.");
	});

	it("applies a person-scoped topic rule only on that topic", () => {
		const state = apply(createInitialCollaborationState(), {
			type: "rule.add",
			rule: {
				kind: "exclude_topic",
				value: "t-gsales",
				topicId: "t-gsales",
				personId: "p-hugo",
				isSample: true,
			},
		});
		expect(
			selectThreadContext(state, "th-geng-review")?.participants.find(
				(person) => person.personId === "p-hugo",
			)?.included,
		).toBe(true);
		expect(
			selectThreadContext(state, "th-hugo-chat")?.participants.find(
				(person) => person.personId === "p-hugo",
			)?.included,
		).toBe(false);
		expect(
			selectThreadContext(state, "th-procurement")?.participants.find(
				(person) => person.personId === "p-gia",
			)?.included,
		).toBe(true);
	});
});

it("applies server changes to items already shown, except ones edited locally during the read", () => {
	const state = createInitialCollaborationState();
	const [answered, edited] = state.items.filter(
		(item) => item.status === "open",
	);
	const now = "2026-10-01T18:00:00.000Z";
	const next = collaborationReducer(
		state,
		{
			type: "live.refresh",
			updates: {
				threads: [],
				workspaces: {},
				items: [
					{ ...answered, status: "done", completedAt: now },
					{ ...edited, status: "done", completedAt: now },
				],
				keepItemIds: [edited.id],
			},
		},
		now,
	);
	expect(next.items.find((item) => item.id === answered.id)?.status).toBe(
		"done",
	);
	expect(next.items.find((item) => item.id === edited.id)?.status).toBe(
		"open",
	);
	expect(next.items).toHaveLength(state.items.length);
});
