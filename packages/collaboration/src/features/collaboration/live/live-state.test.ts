import { expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	loadLiveState,
	loadThreadMessages,
	mapMemory,
	readThreadInsights,
	readThreadMessagesPage,
	summarizeThread,
	syncMail,
} from "./live-state";

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
			...Array.from({ length: 10 }, () => ({ items: [] })),
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
