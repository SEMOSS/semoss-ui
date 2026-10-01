import { expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import {
	loadLiveState,
	loadThreadMessages,
	readThreadMessagesPage,
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
			...Array.from({ length: 9 }, () => ({ items: [] })),
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
