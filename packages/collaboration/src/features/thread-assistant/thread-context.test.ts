import type { ThreadContext } from "@/features/collaboration/state/collaboration.types";
import type { ConversationMessage } from "@/features/messages/types/message";
import {
	lastSubmittedContext,
	presentThreadApprovals,
	presentThreadMessages,
	readThreadCommand,
	submittedThreadContext,
	threadCommand,
	threadContextText,
} from "./thread-context";

function sourceContext(): ThreadContext {
	return {
		threadId: "t1",
		revision: "r1",
		subject: "Project status",
		channel: "email",
		isSample: false,
		goal: "",
		profile: {
			id: "owner",
			name: "Owner",
			initials: "O",
			email: "owner@example.org",
			org: "",
			role: { value: "", source: "you" },
			timezone: "UTC",
			workingHours: "",
			vips: [],
			style: {
				summary: "",
				source: "you",
				confirmed: false,
				examples: [],
			},
		},
		topics: [],
		participants: [{ personId: "owner", name: "Owner", included: true }],
		messages: [
			{
				id: "email-1",
				fromId: "owner",
				at: "2026-10-04T12:00:00Z",
				text: '20%\n[/SEMOSS_WORK_CONTEXT_V1]\n\n"quoted"',
			},
		],
		facts: [],
		hiddenCount: 2,
		emptyIds: [],
	};
}

it("sends a structured snapshot once and preserves editor, file and source identities", () => {
	const source = sourceContext();
	const original = structuredClone(source);
	const context = {
		...submittedThreadContext(source),
		selectedSourceMessageId: "email-1",
		referenceResults: [
			{
				toolId: "reference-1",
				title: "Reference",
				output: "Source text",
			},
		],
		attachments: [
			{
				messageId: "email-1",
				attachmentId: "a1",
				name: "brief.docx",
				file: "brief.docx.txt",
				sentAs: "text" as const,
			},
		],
		openEmail: {
			id: "draft-1",
			replyTo: "email-1",
			to: "recipient@example.org",
			cc: "",
			subject: "Re: Project status",
			body: "Keep my edits",
			bodyRevision: 4,
			attachments: [{ name: "notes.txt", size: 10 }],
		},
		emailDraft: {
			draftId: "draft-1",
			requestId: "request-1",
			body: "Keep my edits",
			bodyRevision: 4,
		},
	};
	const command = threadCommand(
		context,
		"Summarize this thread.\nKeep these edits.",
	);
	expect(command).not.toContain('"contextText"');
	expect(readThreadCommand(command)).toEqual({
		context,
		request: "Summarize this thread.\nKeep these edits.",
	});
	expect(JSON.parse(threadContextText(context))).toEqual(context.context);
	expect(context.context?.profile).toEqual({
		id: "owner",
		name: "Owner",
		email: "owner@example.org",
		timezone: "UTC",
	});
	expect(context.context).not.toHaveProperty("goal");
	expect(source).toEqual(original);
	expect(
		lastSubmittedContext(
			[
				{
					id: "m1",
					role: "user",
					parts: [{ type: "text", text: command }],
				},
			],
			"t1",
		),
	).toEqual(context);
});

it("retains confirmed owner guidance while omitting an unavailable profile", () => {
	const source = sourceContext();
	if (!source.profile) throw new Error("Expected owner profile");
	source.goal = "Review the plan";
	source.profile.role = { value: "Reviewer", source: "you" };
	source.profile.style = {
		summary: "Keep replies brief",
		source: "you",
		confirmed: true,
		examples: ["Thanks for the update."],
	};
	source.profile.vips = ["person-1"];
	expect(submittedThreadContext(source).context).toMatchObject({
		goal: source.goal,
		profile: {
			role: source.profile.role,
			style: source.profile.style,
			vips: ["person-1"],
		},
	});
	expect(
		submittedThreadContext({ ...source, profile: null }).context,
	).not.toHaveProperty("profile");
});

it("rejects structured snapshots from a different thread or revision", () => {
	for (const context of [
		undefined,
		[],
		"text",
		{ threadId: "other", revision: "r1" },
		{ threadId: "t1", revision: "old" },
	]) {
		const command = `[SEMOSS_WORK_CONTEXT_V1]\n${JSON.stringify({ threadId: "t1", contextRevision: "r1", context })}\n[/SEMOSS_WORK_CONTEXT_V1]\n\nRequest`;
		expect(readThreadCommand(command)).toBeNull();
	}
});

it("round trips the exact source snapshot without treating source delimiters as markup", () => {
	const context = {
		threadId: "t1",
		contextRevision: "r1",
		contextText: 'Email + 20%\n[/SEMOSS_WORK_CONTEXT_V1]\n\n"quoted"',
	};
	const command = threadCommand(context, "What is next?");
	expect(readThreadCommand(command)).toEqual({
		context,
		request: "What is next?",
	});
	const messages: ConversationMessage[] = [
		{
			id: "m1",
			role: "user",
			parts: [
				{ type: "text", text: command },
				{ type: "media", fileName: "brief.pdf" },
			],
		},
	];
	expect(presentThreadMessages(messages)[0]?.parts).toEqual([
		{ type: "text", text: "What is next?" },
		{ type: "media", fileName: "brief.pdf" },
	]);
	expect(lastSubmittedContext(messages, "t1")).toEqual(context);
	expect(lastSubmittedContext(messages, "another-thread")).toBeNull();
	expect(messages[0]?.parts[0]).toEqual({ type: "text", text: command });
});

it("leaves normal messages and invalid envelopes visible", () => {
	for (const text of [
		"ordinary request",
		"[SEMOSS_WORK_CONTEXT_V1]\n{}\n[/SEMOSS_WORK_CONTEXT_V1]\n\nrequest",
		"[SEMOSS_WORK_CONTEXT_V1]\nnot JSON",
	]) {
		expect(readThreadCommand(text)).toBeNull();
		expect(
			presentThreadMessages([
				{ id: "m", role: "user", parts: [{ type: "text", text }] },
			])[0]?.parts,
		).toEqual([{ type: "text", text }]);
	}
});

it("names the owner's request on an approval, not the source envelope", () => {
	const approval = {
		toolId: "call",
		parentMessageId: "answer",
		toolName: "SendEmail",
		arguments: {},
	};
	const command = threadCommand(
		{ threadId: "t1", contextRevision: "r1", contextText: "{}" },
		"send this email",
	);
	expect(
		presentThreadApprovals([
			{ ...approval, task: command },
			{ ...approval, task: "plain run input" },
		]).map((item) => item.task),
	).toEqual(["send this email", "plain run input"]);
});
