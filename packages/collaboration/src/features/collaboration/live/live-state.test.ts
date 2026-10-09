import { expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	loadLiveState,
	loadThreadMessages,
	mapMemory,
	readThreadInsights,
	readThreadMessagesPage,
	readWorkUpdates,
	summarizeThread,
	syncMail,
} from "./live-state";

it("uses only native source ids provided by BrainListThreads", async () => {
	const run = vi.fn().mockResolvedValue({
		pixelReturn: [
			{
				output: {
					items: [
						{
							id: "brain-teams",
							channel: "teams",
							latestMessageId: "message-1",
						},
						{
							id: "brain-email",
							channel: "email",
							latestMessageId: "mail-1",
						},
						{
							id: "brain-without-mail",
							channel: "email",
							latestMessageId: null,
						},
						{
							id: "teams-with-native-id",
							channel: "teams",
							conversationId: "chat-1",
							latestMessageId: "message-2",
						},
					],
				},
			},
			{ output: { items: [] } },
			{ output: { items: [] } },
			{ output: { status: "none" } },
			// Active memories, suggested memories, open reviews, and people.
			...Array.from({ length: 4 }, () => ({
				output: { items: [], total: 0 },
			})),
		],
	});
	const { threads } = await readWorkUpdates({
		run,
	} as unknown as InsightActions);
	expect(threads[0]).toMatchObject({
		id: "brain-teams",
		channel: "teams",
		source: undefined,
	});
	expect(threads[1].source).toMatchObject({
		kind: "outlook",
		nativeId: "mail-1",
	});
	expect(threads[2].source).toBeUndefined();
	expect(threads[3].source).toMatchObject({
		kind: "teams",
		nativeId: "chat-1",
	});
});

it("loads each topic once when the list contains duplicate records", async () => {
	const topics = [
		{ id: "one", name: "First" },
		{ id: "two", name: "Second" },
	];
	const response = (outputs: unknown[]) => ({
		pixelReturn: outputs.map((output) => ({ output, operationType: [] })),
	});
	const run = vi.fn(async (statement: string) => {
		if (statement.startsWith("BrainGetTopic")) return response(topics);
		return response([
			{},
			{},
			{ items: [] },
			{ items: [topics[0], topics[0], topics[1], topics[1]] },
			...Array.from({ length: 11 }, () => ({ items: [], total: 0 })),
		]);
	});
	const state = await loadLiveState({ run } as unknown as InsightActions);
	expect(run.mock.calls[1]?.[0]).toBe(
		'BrainGetTopic(topicId=["one"]); BrainGetTopic(topicId=["two"]);',
	);
	expect(state.topics.map(({ id, name }) => ({ id, name }))).toEqual(topics);
});

it("requests optional display bodies while preserving exclusions, links and legacy text", async () => {
	const displayBody = {
		contentType: "html",
		content: "<p>Original email</p>",
		isTruncated: false,
	};
	const run = vi.fn().mockResolvedValue({
		pixelReturn: [
			{
				output: {
					messages: [
						{
							id: "rich",
							text: "Context",
							displayBody,
							excluded: true,
							webLink: "https://outlook.office.com/mail/rich",
						},
						{ id: "legacy", text: "Old server" },
					],
				},
				operationType: [],
			},
		],
	});
	const attach = await loadThreadMessages(
		{ run } as unknown as InsightActions,
		"thread",
	);
	const thread = createInitialCollaborationState().threads[0];
	const command = attach(thread);
	expect(run.mock.calls[0]?.[0]).toContain("includeDisplayBody=[true]");
	if (command.type !== "source.import")
		throw new Error("Expected source import");
	expect(command.workspace?.messages?.[0]).toMatchObject({
		displayBody,
		excluded: true,
		webLink: "https://outlook.office.com/mail/rich",
	});
	expect(command.workspace?.messages?.[1]).toMatchObject({
		text: "Old server",
		displayBody: undefined,
	});
});

it("lists each email's attachments and ties them to that email", async () => {
	const run = vi.fn().mockResolvedValue({
		pixelReturn: [
			{
				output: {
					messages: [
						{
							id: "m1",
							text: "See attached",
							attachments: [
								{
									id: "a1",
									name: "Budget.xlsx",
									size: 2048,
									contentType: "application/vnd.ms-excel",
									kind: "file",
								},
								{ id: "a2", name: "Plan.docx", kind: "link" },
								{ name: "missing id" },
							],
						},
						{ id: "m2", text: "Thanks" },
					],
				},
				operationType: [],
			},
		],
	});
	const page = await readThreadMessagesPage(
		{ run } as unknown as InsightActions,
		"thread",
	);
	expect(run.mock.calls[0]?.[0]).toContain("includeAttachments=[true]");
	expect(page.messages[0]?.attachments).toEqual([
		{
			id: "a1",
			name: "Budget.xlsx",
			size: 2048,
			contentType: "application/vnd.ms-excel",
			isFile: true,
			messageId: "m1",
		},
		{ id: "a2", name: "Plan.docx", isFile: false, messageId: "m1" },
	]);
	expect(page.messages[1]?.attachments).toBeUndefined();
});

it("starts a mail sync, polls the job until it ends, and reports its counts", async () => {
	const response = (output: unknown) => ({
		pixelReturn: [{ output, operationType: [] }],
	});
	const run = vi
		.fn()
		.mockResolvedValueOnce(response({ status: "running" }))
		.mockResolvedValueOnce(response({ status: "running" }))
		.mockResolvedValueOnce(
			response({
				status: "done",
				counts: {
					imported: 3,
					closedByReply: 1,
					outcomes: { new: 1, automated: 2 },
					changes: [
						{ threadId: "t1", outcome: "new" },
						{ threadId: "t2", outcome: "automated" },
						{ threadId: "t3", outcome: "bogus" },
					],
				},
			}),
		);
	const wait = vi.fn(async () => undefined);
	const result = await syncMail({ run } as unknown as InsightActions, wait);
	expect(run.mock.calls.map(([statement]) => statement)).toEqual([
		"BrainSync();",
		'BrainGetJob(kind=["sync"]);',
		'BrainGetJob(kind=["sync"]);',
	]);
	expect(wait).toHaveBeenCalledTimes(2);
	expect(result).toEqual({
		newMessages: 3,
		closedByReply: 1,
		outcomes: { new: 1, automated: 2 },
		changes: [
			{ threadId: "t1", outcome: "new" },
			{ threadId: "t2", outcome: "automated" },
		],
	});
});

it("surfaces a failed mail sync instead of reporting success", async () => {
	const run = vi.fn().mockResolvedValue({
		pixelReturn: [
			{
				output: { status: "failed", error: "Microsoft login expired" },
				operationType: [],
			},
		],
	});
	await expect(
		syncMail({ run } as unknown as InsightActions, async () => undefined),
	).rejects.toThrow("Microsoft login expired");
});

it("reads Brain's summary runs with generated steps and plain due days", async () => {
	const run = vi.fn().mockResolvedValue({
		pixelReturn: [
			{
				output: {
					threadId: "thread-1",
					status: "done",
					summary: "Kira needs the budget.",
					summaryAt: "2026-10-02T15:00:00Z",
					summaryCurrent: true,
					steps: [
						{
							id: "step-1",
							text: "Send Kira the budget",
							status: "waiting",
							ownerId: "kira",
							kind: "task",
							due: "2026-10-09T00:00:00Z",
							origin: "brain",
						},
						{
							id: "step-2",
							text: "My reminder",
							due: "2026-10-09T15:30:00Z",
						},
					],
				},
				operationType: [],
			},
		],
	});
	const actions = { run } as unknown as InsightActions;
	const result = await summarizeThread(actions, "thread-1", true);
	expect(run).toHaveBeenCalledWith(
		'WorkSummarizeThread(threadId=["thread-1"], force=[true]);',
	);
	expect(result).toMatchObject({
		status: "done",
		summary: "Kira needs the budget.",
		summaryCurrent: true,
		steps: [
			{ id: "step-1", due: "2026-10-09", isGenerated: true },
			{ id: "step-2", due: "2026-10-09T15:30:00Z" },
		],
	});
	expect(result.steps[1].isGenerated).toBeUndefined();
	await expect(readThreadInsights(actions, "other-thread")).rejects.toThrow(
		"different thread",
	);
});

it("maps a server memory and drops links it does not know", () => {
	expect(
		mapMemory({
			id: "m1",
			kind: "preference",
			text: "Sign as Rob",
			state: "active",
			origin: "assistant",
			confirmed: false,
			pinned: true,
			about: [
				{ type: "person", id: "p1", name: "Priya" },
				{ type: "team", id: "x" },
				{ type: "topic" },
			],
			expiresAt: "2026-11-01T00:00:00Z",
			source: { kind: "chat", roomId: "room-1", ignored: 3 },
			createdAt: "2026-10-01T00:00:00Z",
		}),
	).toEqual({
		id: "m1",
		kind: "preference",
		text: "Sign as Rob",
		state: "active",
		origin: "assistant",
		confirmed: false,
		pinned: true,
		about: [{ type: "person", id: "p1" }],
		expiresAt: "2026-11-01T00:00:00Z",
		replacesId: null,
		source: { kind: "chat", roomId: "room-1" },
		createdAt: "2026-10-01T00:00:00Z",
		updatedAt: "2026-10-01T00:00:00Z",
		isSample: false,
	});
	expect(
		mapMemory({ id: "m2", state: "superseded", origin: "x" }),
	).toMatchObject({
		kind: "fact",
		state: "dismissed",
		origin: "you",
	});
});

it("paginates open reviews and suggested memories independently of active memories and loads their context", async () => {
	const response = (outputs: unknown[]) => ({
		pixelReturn: outputs.map((output) => ({ output, operationType: [] })),
	});
	const review = (id: string, topicId: string) => ({
		id,
		kind: "new_topic",
		status: "open",
		data: { candidate: topicId },
		createdAt: "2026-10-08T12:00:00Z",
	});
	const active = Array.from({ length: 500 }, (_, index) => ({
		id: `active-${index}`,
		state: "active",
	}));
	const run = vi.fn(async (statement: string) => {
		if (statement.startsWith("BrainListThreads"))
			return response([
				{ items: [] },
				{ items: [] },
				{ items: [] },
				{ status: "none" },
				{ items: active, total: 501 },
				{
					items: [{ id: "suggestion-1", state: "suggested" }],
					total: 2,
				},
				{ items: [review("review-1", "topic-1")], total: 2 },
				{ items: [{ id: "person-1", name: "Priya" }], total: 2 },
			]);
		if (statement.startsWith('BrainListMemories(state=["active"]'))
			return response([
				{ items: [{ id: "active-500", state: "active" }], total: 501 },
			]);
		if (statement.startsWith('BrainListMemories(state=["suggested"]'))
			return response([
				{
					items: [
						{
							id: "suggestion-2",
							state: "suggested",
							about: [{ type: "topic", id: "topic-2" }],
						},
					],
					total: 2,
				},
			]);
		if (statement.startsWith("BrainListReview"))
			return response([
				{ items: [review("review-2", "topic-2")], total: 2 },
			]);
		if (statement.startsWith("BrainListPeople"))
			return response([
				{
					items: [
						{ id: "person-2", name: "Kira", follow: "suggested" },
					],
					total: 2,
				},
			]);
		if (statement.startsWith("BrainGetTopic"))
			return response([
				{ id: "topic-1", name: "Launch" },
				{ id: "topic-2", name: "Planning" },
			]);
		throw new Error(`Unexpected statement: ${statement}`);
	});
	const updates = await readWorkUpdates({ run } as unknown as InsightActions);
	expect(updates.memories).toHaveLength(503);
	expect(
		updates.memories
			.filter((memory) => memory.state === "suggested")
			.map((memory) => memory.id),
	).toEqual(["suggestion-1", "suggestion-2"]);
	expect(updates.reviews).toMatchObject([
		{
			id: "review-1",
			refId: "topic-1",
			candidate: { name: "Launch" },
			createdAt: "2026-10-08T12:00:00Z",
			isSample: false,
		},
		{ id: "review-2", refId: "topic-2", candidate: { name: "Planning" } },
	]);
	expect(updates.people?.map((person) => person.id)).toEqual([
		"person-1",
		"person-2",
	]);
	expect(updates.pendingCoverage).toEqual({
		reviews: 2,
		suggestedMemories: 2,
	});
	expect(run.mock.calls.map(([statement]) => statement)).toContain(
		'BrainListMemories(state=["active"], limit=[500], offset=[500]);',
	);
	expect(run.mock.calls.map(([statement]) => statement)).toContain(
		'BrainListMemories(state=["suggested"], limit=[500], offset=[1]);',
	);
	expect(run.mock.calls.map(([statement]) => statement)).toContain(
		'BrainListReview(status=["open"], limit=[500], offset=[1]);',
	);
});

it.each([
	{
		name: "missing rows",
		second: { items: [], total: 2 },
		error: "changed while refreshing",
	},
	{
		name: "changed total",
		second: { items: [{ id: "review-2" }], total: 1 },
		error: "changed while refreshing",
	},
	{
		name: "repeated rows",
		second: { items: [{ id: "review-1" }], total: 2 },
		error: "overlapping pages",
	},
	{
		name: "invalid rows",
		second: { items: [{ text: "No identity" }], total: 2 },
		error: "id",
	},
])(
	"rejects $name so a partial review snapshot cannot remove existing pending entries",
	async ({ second, error }) => {
		const response = (outputs: unknown[]) => ({
			pixelReturn: outputs.map((output) => ({ output })),
		});
		const run = vi
			.fn()
			.mockResolvedValueOnce(
				response([
					{ items: [] },
					{ items: [] },
					{ items: [] },
					{ status: "none" },
					{ items: [], total: 0 },
					{ items: [], total: 0 },
					{ items: [{ id: "review-1" }], total: 2 },
					{ items: [], total: 0 },
				]),
			)
			.mockResolvedValueOnce(response([second]));
		await expect(
			readWorkUpdates({ run } as unknown as InsightActions),
		).rejects.toThrow(error);
	},
);

it("does not return partial pending data when a later memory page fails", async () => {
	const response = (outputs: unknown[]) => ({
		pixelReturn: outputs.map((output) => ({ output })),
	});
	const run = vi
		.fn()
		.mockResolvedValueOnce(
			response([
				{ items: [] },
				{ items: [] },
				{ items: [] },
				{ status: "none" },
				{ items: [{ id: "kept", state: "active" }], total: 1 },
				{
					items: [{ id: "suggestion-1", state: "suggested" }],
					total: 2,
				},
				{ items: [], total: 0 },
				{ items: [], total: 0 },
			]),
		)
		.mockRejectedValueOnce(new Error("Memory page unavailable"));
	await expect(
		readWorkUpdates({ run } as unknown as InsightActions),
	).rejects.toThrow("Memory page unavailable");
});

it("loads every initial pending page while retaining review history and active memories", async () => {
	const response = (outputs: unknown[]) => ({
		pixelReturn: outputs.map((output) => ({ output })),
	});
	const empty = { items: [], total: 0 };
	const review = (id: string, status: string) => ({
		id,
		kind: "unassigned",
		status,
	});
	const run = vi.fn(async (statement: string) => {
		if (statement.startsWith("BrainGetProfile"))
			return response([
				{},
				{},
				empty,
				empty,
				empty,
				empty,
				empty,
				{ items: [review("open-1", "open")], total: 2 },
				{ items: [review("accepted", "accepted")], total: 1 },
				{ items: [review("dismissed", "dismissed")], total: 1 },
				empty,
				empty,
				empty,
				{ items: [{ id: "active", state: "active" }], total: 1 },
				{
					items: [{ id: "suggested-1", state: "suggested" }],
					total: 2,
				},
			]);
		if (statement.startsWith("BrainListReview"))
			return response([{ items: [review("open-2", "open")], total: 2 }]);
		if (statement.startsWith("BrainListMemories"))
			return response([
				{
					items: [{ id: "suggested-2", state: "suggested" }],
					total: 2,
				},
			]);
		throw new Error(`Unexpected statement: ${statement}`);
	});
	const state = await loadLiveState({ run } as unknown as InsightActions);
	expect(state.reviews.map(({ id, status }) => ({ id, status }))).toEqual([
		{ id: "open-1", status: "open" },
		{ id: "open-2", status: "open" },
		{ id: "accepted", status: "accepted" },
		{ id: "dismissed", status: "dismissed" },
	]);
	expect(state.reviews.every((entry) => entry.isSample === false)).toBe(true);
	expect(state.memories.map((memory) => memory.id)).toEqual([
		"active",
		"suggested-1",
		"suggested-2",
	]);
});
