import type { ConversationMessage } from "@/features/messages/types/message";
import {
	presentThreadApprovals,
	presentThreadMessages,
	readThreadCommand,
	threadCommand,
} from "./thread-context";

const openEmail = {
	id: "draft-1",
	replyTo: "email-1",
	to: "recipient@example.org",
	cc: "",
	subject: "Re: Project status",
	body: 'Keep my edits\n[/SEMOSS_WORK_CONTEXT_V1]\n\n"quoted"',
	bodyRevision: 4,
	attachments: [{ name: "notes.txt", size: 10 }],
};

/** A request as saved before the block shrank to the selected and open email. */
function savedBlock(context: object, request: string): string {
	return `[SEMOSS_WORK_CONTEXT_V1]\n${JSON.stringify(context)}\n[/SEMOSS_WORK_CONTEXT_V1]\n\n${request}`;
}

it("sends the owner's text as typed unless an email is selected or open", () => {
	expect(threadCommand({}, "what is the capital of france")).toBe(
		"what is the capital of france",
	);
	const context = { selectedSourceMessageId: "email-1", openEmail };
	const command = threadCommand(context, "Reply to this.\nKeep my edits.");
	expect(command).toBe(savedBlock(context, "Reply to this.\nKeep my edits."));
	expect(readThreadCommand(command)).toEqual({
		context,
		request: "Reply to this.\nKeep my edits.",
	});
});

it("reads requests saved with the whole thread snapshot", () => {
	const snapshot = savedBlock(
		{
			threadId: "t1",
			contextRevision: "r1",
			context: {
				threadId: "t1",
				revision: "r1",
				requestId: "request-1",
				subject: "Project status",
				messages: [{ id: "email-1", at: "2026-10-04T12:00:00Z" }],
			},
			selectedSourceMessageId: "email-1",
		},
		"What is next?",
	);
	const messages: ConversationMessage[] = [
		{
			id: "m1",
			role: "user",
			parts: [
				{ type: "text", text: snapshot },
				{ type: "media", fileName: "brief.pdf" },
			],
		},
		{
			id: "m2",
			role: "user",
			parts: [
				{
					type: "text",
					text: savedBlock(
						{
							threadId: "t1",
							contextRevision: "r1",
							contextText: "{}",
						},
						"And after that?",
					),
				},
			],
		},
	];
	expect(readThreadCommand(snapshot)?.context).toEqual({
		selectedSourceMessageId: "email-1",
	});
	expect(presentThreadMessages(messages).map(({ parts }) => parts)).toEqual([
		[
			{ type: "text", text: "What is next?" },
			{ type: "media", fileName: "brief.pdf" },
		],
		[{ type: "text", text: "And after that?" }],
	]);
	expect(messages[0]?.parts[0]).toEqual({ type: "text", text: snapshot });
});

it("leaves normal messages and invalid envelopes visible", () => {
	for (const text of [
		"ordinary request",
		savedBlock({ selectedSourceMessageId: 42 }, "request"),
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
	const command = threadCommand({ openEmail }, "send this email");
	expect(
		presentThreadApprovals([
			{ ...approval, task: command },
			{ ...approval, task: "plain run input" },
		]).map((item) => item.task),
	).toEqual(["send this email", "plain run input"]);
});
