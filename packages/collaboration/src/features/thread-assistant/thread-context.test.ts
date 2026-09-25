import type { ConversationMessage } from "@/features/messages/types/message";
import {
	lastSubmittedContext,
	presentThreadMessages,
	readThreadCommand,
	threadCommand,
} from "./thread-context";

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
