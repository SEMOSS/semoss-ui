import type { ConversationMessage } from "@/features/messages/types/message";
import { composeEmailPart } from "./compose-email.test-fixtures";
import { composeDraftId, readDraftProposal } from "./thread-draft-proposal";

const message = (
	parts: ConversationMessage["parts"],
	overrides: Partial<ConversationMessage> = {},
): ConversationMessage => ({
	id: "final",
	runId: "run",
	role: "assistant",
	parts,
	...overrides,
});

it("reads a reply from a completed ComposeEmail call", () => {
	expect(
		readDraftProposal(
			message([
				{ type: "text", text: "Ready." },
				composeEmailPart(
					{ replyTo: "mail-2", message: "Friday works.\nThanks!" },
					"call-1",
				),
			]),
		),
	).toEqual({
		sourceMessageId: "mail-2",
		body: "Friday works.\nThanks!",
		toolId: "call-1",
	});
	expect(composeDraftId("call-1")).toBe("assistant-draft:call-1");
});

it("reads a new email and the open editor it changes", () => {
	expect(
		readDraftProposal(
			message([
				composeEmailPart(
					{
						to: "a@example.com",
						subject: "Hello",
						message: "Hi",
						openEmailId: "assistant-draft:call-1",
					},
					"call-2",
				),
			]),
		),
	).toEqual({
		to: "a@example.com",
		subject: "Hello",
		body: "Hi",
		openEmailId: "assistant-draft:call-1",
		toolId: "call-2",
	});
});

it("uses the last ComposeEmail call in a response", () => {
	expect(
		readDraftProposal(
			message([
				composeEmailPart(
					{ to: "", subject: "", message: "First" },
					"a",
				),
				composeEmailPart(
					{ to: "", subject: "", message: "Second" },
					"b",
				),
			]),
		),
	).toMatchObject({ body: "Second", toolId: "b" });
});

it.each([
	message([composeEmailPart({ replyTo: "mail", message: "Hi" })], {
		runStatus: "FAILED",
	}),
	message([composeEmailPart({ replyTo: "mail", message: "Hi" })], {
		role: "user",
	}),
	message([composeEmailPart({ replyTo: "mail", message: "Hi" })], {
		live: { phase: "streaming", hasObservationIssue: false },
	}),
	message([
		composeEmailPart({ replyTo: "mail", message: "Hi" }, "x", "FAILED"),
	]),
	message([composeEmailPart({ replyTo: "mail", message: "" })]),
	message([{ type: "text", text: "Here is a draft reply: Friday works." }]),
])("ignores unfinished responses, failed calls, and prose", (input) => {
	expect(readDraftProposal(input)).toBeNull();
});
