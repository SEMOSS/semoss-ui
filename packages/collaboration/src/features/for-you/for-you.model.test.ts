import { describe, expect, it } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type {
	CollaborationState,
	Memory,
	ReviewEntry,
	Thread,
	WorkItem,
} from "@/features/collaboration/state/collaboration.types";
import type { Delegation } from "@/features/delegations/api/delegations";
import type { AgentRun } from "@/features/rooms/api/agent-run-api";
import { buildForYouItems, selectForYouItems } from "./for-you.model";

const now = "2026-10-08T12:00:00Z";
const thread: Thread = {
	id: "thread",
	channel: "email",
	subject: "Launch plan",
	topicLinks: [
		{
			topicId: "launch",
			source: "confirmed",
			confidence: 1,
			primary: true,
		},
	],
	participants: [],
	muted: false,
	messageCount: 1,
	lastAt: now,
	roomId: "legacy-room",
	summary: "",
	isSample: false,
};
const work: WorkItem = {
	id: "work",
	threadId: "thread",
	channel: "email",
	actorId: "brain",
	title: "Confirm launch date",
	askType: "reply",
	priority: "P1",
	score: 90,
	reasons: [],
	due: null,
	received: now,
	status: "open",
	topicIds: ["launch"],
	isSample: false,
};
const review: ReviewEntry = {
	id: "review",
	kind: "topic_choice",
	text: "Choose a topic",
	detail: "Two possible topics",
	refId: "thread",
	status: "open",
	actions: [],
};
const memory: Memory = {
	id: "memory",
	kind: "fact",
	text: "Launch moved to Friday",
	state: "suggested",
	origin: "brain",
	confirmed: false,
	pinned: false,
	about: [{ type: "thread", id: "thread" }],
	expiresAt: null,
	replacesId: null,
	source: {},
	createdAt: now,
	updatedAt: now,
	isSample: false,
};
const run: AgentRun = {
	runId: "run",
	roomId: "room",
	status: "INPUT_REQUIRED",
	input: "Check the launch plan",
	workspaceName: "Launch assistant",
	dateCreated: now,
	pendingActions: [
		{ actionId: "action", runId: "run", toolName: "Review plan" },
	],
};
const delegation: Delegation = {
	actionId: "action",
	roomId: "room",
	status: "PENDING",
	question: "Approve the launch plan",
	dueAt: "2026-10-09",
	requesterName: "Sam",
};

function initialState(
	changes: Partial<CollaborationState> = {},
): CollaborationState {
	const initial = createInitialCollaborationState();
	return {
		...initial,
		topics: ["launch", "client", "candidate"].map((id) => ({
			...initial.topics[0],
			id,
			isSample: false,
		})),
		threads: [thread],
		items: [work],
		reviews: [review],
		memories: [memory],
		...changes,
	};
}

describe("For you collection", () => {
	it("uses classifier reasons and validated agent questions as understandable card content", () => {
		const state = initialState({
			items: [
				{
					...work,
					reasons: ["Your approval is needed", "Due tomorrow"],
				},
			],
			reviews: [],
			memories: [],
		});
		const items = buildForYouItems(state, {
			runs: [
				{
					...run,
					pendingActions: [
						{
							actionId: "question",
							runId: "run",
							toolName: "RequestUserInput",
							toolArgs: {
								questions: [
									{
										id: "date",
										question:
											"Which launch date works for you?",
									},
								],
							},
						},
					],
				},
			],
			delegations: [],
			roomSource: () => ({ status: "ready", threadId: null }),
		});
		expect(items.find((item) => item.kind === "work")).toMatchObject({
			detail: "Your approval is needed · Due tomorrow",
			sourceLabel: "Brain · Email",
		});
		expect(items.find((item) => item.kind === "action")?.title).toBe(
			"Which launch date works for you?",
		);
	});
	it("combines pending sources, deduplicates action identity, and preserves source decisions", () => {
		const state = initialState({
			items: [
				work,
				{ ...work, id: "done", status: "done" },
				{ ...work, id: "fyi", askType: "fyi" },
				{ ...work, id: "orphan", threadId: "missing" },
			],
			reviews: [
				review,
				{ ...review, id: "resolved", status: "accepted" },
			],
			memories: [memory, { ...memory, id: "active", state: "active" }],
		});
		const items = buildForYouItems(state, {
			runs: [
				run,
				{ ...run, runId: "question", pendingActions: [] },
				{ ...run, runId: "finished", status: "COMPLETED" },
			],
			delegations: [delegation],
			roomSource: () => ({ status: "ready", threadId: "thread" }),
		});
		expect(items.map((item) => item.id).sort()).toEqual([
			"action:action",
			"memory:memory",
			"review:review",
			"run:question",
			"work:work",
		]);
		expect(items.find((item) => item.id === "action:action")).toMatchObject(
			{
				action: run.pendingActions[0],
				run,
				delegation,
				topicIds: ["launch"],
			},
		);
		expect(state.items[0]).toBe(work);
		expect(state.reviews[0]?.status).toBe("open");
	});

	it("does not suppress explicit agent requests with muted source work or guess missing topics", () => {
		const state = initialState({
			threads: [{ ...thread, muted: true }],
			reviews: [],
			memories: [],
		});
		const items = buildForYouItems(state, {
			runs: [run],
			delegations: [],
			roomSource: () => ({ status: "error" }),
		});
		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			kind: "action",
			topicIds: [],
			topicStatus: "error",
		});
		expect(selectForYouItems(items, { topicId: "__none__" })).toEqual([]);
	});

	it("keeps explicit missing topic links available without treating them as No topic", () => {
		const items = buildForYouItems(
			initialState({
				topics: [],
				reviews: [
					{
						...review,
						kind: "new_topic",
						refId: "launch",
					},
				],
				memories: [
					{ ...memory, about: [{ type: "topic", id: "launch" }] },
				],
			}),
			{
				runs: [run],
				delegations: [],
				roomSource: () => ({ status: "ready", threadId: "thread" }),
			},
		);
		expect(items).toHaveLength(4);
		for (const item of items)
			expect(item).toMatchObject({
				topicIds: ["launch"],
				topicStatus: "error",
			});
		expect(selectForYouItems(items, { topicId: "__none__" })).toEqual([]);
		expect(selectForYouItems(items, { topicId: "launch" })).toHaveLength(4);
	});

	it("resolves direct, saved-source and verified legacy topic links without broad person inference", () => {
		const state = initialState({
			memories: [
				memory,
				{
					...memory,
					id: "room-memory",
					about: [],
					source: { roomId: "legacy-room" },
				},
				{
					...memory,
					id: "person-memory",
					about: [{ type: "person", id: "person" }],
				},
			],
			reviews: [
				review,
				{
					...review,
					id: "person-review",
					kind: "add_person",
					refId: "person",
					topicId: "client",
				},
				{
					...review,
					id: "new-topic",
					kind: "new_topic",
					refId: "candidate",
				},
			],
		});
		const items = buildForYouItems(state, {
			runs: [run],
			delegations: [],
			roomSource: (id) => ({
				status: "ready",
				threadId: id === "room" ? "thread" : null,
			}),
		});
		expect(
			items.find((item) => item.id === "memory:room-memory")?.topicIds,
		).toEqual(["launch"]);
		expect(
			items.find((item) => item.id === "memory:person-memory")?.topicIds,
		).toEqual([]);
		expect(
			items.find((item) => item.id === "review:person-review")?.topicIds,
		).toEqual(["client"]);
		expect(
			items.find((item) => item.id === "review:new-topic")?.topicIds,
		).toEqual(["candidate"]);
		expect(
			selectForYouItems(items, {
				topicId: "launch",
				search: " PLAN ",
			}).map((item) => item.id),
		).toEqual(["work:work", "action:action"]);
	});

	it("sorts priority before deadline, score, recency and identity, with missing priority treated as Normal", () => {
		const state = initialState({
			reviews: [],
			memories: [],
			items: [
				{ ...work, id: "urgent", priority: "P0", score: 0 },
				{
					...work,
					id: "normal-no-priority",
					priority: null,
					due: "2026-10-08T09:00:00-04:00",
					score: 90,
				},
				{
					...work,
					id: "normal-date",
					priority: "P2",
					due: "2026-10-08T12:00:00Z",
					score: 1,
				},
				{
					...work,
					id: "normal-new",
					priority: "P2",
					received: "2026-10-09T12:00:00Z",
				},
				{ ...work, id: "normal-a", priority: "P2" },
				{ ...work, id: "normal-b", priority: "P2" },
				{ ...work, id: "normal-low-score", priority: "P2", score: 1 },
				{ ...work, id: "low", priority: "P3", due: "2026-01-01" },
			],
		});
		const items = buildForYouItems(state, {
			runs: [],
			delegations: [],
			roomSource: () => undefined,
			priorities: { "work:urgent": "P3" },
		});
		expect(selectForYouItems(items).map((item) => item.id)).toEqual([
			"work:urgent",
			"work:normal-date",
			"work:normal-no-priority",
			"work:normal-new",
			"work:normal-a",
			"work:normal-b",
			"work:normal-low-score",
			"work:low",
		]);
		expect(
			items.find((item) => item.id === "work:normal-no-priority")
				?.priority,
		).toBeNull();
	});
});
