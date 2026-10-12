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
		mode: "reply",
		sourceMessageId: "mail-2",
		body: "Friday works.\nThanks!",
		toolId: "call-1",
	});
	expect(composeDraftId("call-1")).toBe("assistant-draft:call-1");
});

it("reads a forward, which needs no note", () => {
	expect(
		readDraftProposal(
			message([
				composeEmailPart(
					{ forward: "mail-2", to: "me@example.com" },
					"call-1",
				),
			]),
		),
	).toEqual({
		mode: "forward",
		sourceMessageId: "mail-2",
		to: "me@example.com",
		toolId: "call-1",
	});
});

it.each([
	{ argument: "replyTo", mode: "reply", source: "topic-email" },
	{ argument: "forward", mode: "forward", source: "topic-email" },
	{
		argument: "replyTo",
		mode: "reply",
		source: "email:d219247f-b4af-4d78-a3b4-598097ba7e70",
	},
	{
		argument: "forward",
		mode: "forward",
		source: "email:d219247f-b4af-4d78-a3b4-598097ba7e70",
	},
])(
	"reads the server-confirmed topic source for a $mode requested with $source",
	({ argument, mode, source }) => {
		expect(
			readDraftProposal(
				message([
					composeEmailPart(
						{ [argument]: source, message: "Friday works." },
						"topic-call",
						"COMPLETED",
						{
							shown: true,
							mode,
							[argument]: "topic-email",
							sourceMessage: {
								id: "topic-email",
								subject: "Meeting",
							},
						},
					),
				]),
			),
		).toMatchObject({
			mode,
			sourceMessageId: "topic-email",
			sourceMessage: { id: "topic-email", subject: "Meeting" },
		});
	},
);

it.each([
	{ id: "other-email", subject: "Meeting" },
	{ id: "topic-email" },
	{ id: "topic-email", subject: 42 },
	null,
])("rejects invalid server source metadata: %s", (sourceMessage) => {
	expect(
		readDraftProposal(
			message([
				composeEmailPart(
					{ replyTo: "topic-email", message: "Friday works." },
					"topic-call",
					"COMPLETED",
					{
						shown: true,
						mode: "reply",
						replyTo: "topic-email",
						sourceMessage,
					},
				),
			]),
		),
	).toBeNull();
});

it("does not accept source metadata without a resolved reply or forward", () => {
	expect(
		readDraftProposal(
			message([
				composeEmailPart(
					{ replyTo: "topic-email", message: "Friday works." },
					"topic-call",
					"COMPLETED",
					{
						shown: true,
						sourceMessage: {
							id: "topic-email",
							subject: "Meeting",
						},
					},
				),
			]),
		),
	).toBeNull();
});

it.each([
	{ argument: "replyTo", mode: "reply" },
	{ argument: "forward", mode: "forward" },
])("uses the resolved source for a selected $mode", ({ argument, mode }) => {
	expect(
		readDraftProposal(
			message([
				composeEmailPart(
					{ [argument]: "selected", message: "Friday works." },
					"selected-call",
					"COMPLETED",
					{ shown: true, mode, [argument]: "native-message-id" },
				),
			]),
		),
	).toMatchObject({
		mode,
		sourceMessageId: "native-message-id",
		body: "Friday works.",
		toolId: "selected-call",
	});
});

it.each([
	null,
	{},
	{ shown: false, mode: "reply", replyTo: "mail-2" },
	{ shown: true },
	{ shown: true, mode: "reply" },
	{ shown: true, mode: "reply", replyTo: "selected" },
	{ shown: true, mode: "reply", replyTo: "" },
	{ shown: true, mode: "reply", replyTo: 2 },
	{ shown: true, mode: "reply", forward: "mail-2" },
	{ shown: true, mode: "reply", replyTo: "mail-2", forward: "mail-2" },
	{ shown: true, mode: "forward", forward: "mail-2" },
	{ shown: true, mode: "new" },
	{ shown: true, replyTo: "mail-2" },
])(
	"does not turn an unresolved selected reply into a new email: %s",
	(output) => {
		expect(
			readDraftProposal(
				message([
					composeEmailPart(
						{ replyTo: "selected", message: "Friday works." },
						"selected-call",
						"COMPLETED",
						output,
					),
				]),
			),
		).toBeNull();
	},
);

it.each([
	{ args: { replyTo: "mail-2" }, output: null },
	{ args: { forward: "mail-2" }, output: { shown: false } },
	{ args: {}, output: { shown: true, mode: "reply", replyTo: "mail-2" } },
	{ args: { openEmailId: "open" }, output: { shown: true, mode: "new" } },
	{
		args: { replyTo: "mail-2", forward: "mail-2" },
		output: { shown: true },
	},
])(
	"requires a successful result consistent with the requested operation: %s",
	({ args, output }) => {
		expect(
			readDraftProposal(
				message([
					composeEmailPart(
						{ ...args, message: "Friday works." },
						"call",
						"COMPLETED",
						output,
					),
				]),
			),
		).toBeNull();
	},
);

it.each([undefined, "assistant-draft:call-1"])(
	"reads a new email or a change to editor %s",
	(openEmailId) => {
		expect(
			readDraftProposal(
				message([
					composeEmailPart(
						{
							to: "a@example.com",
							subject: "Hello",
							message: "Hi",
							openEmailId,
						},
						"call-2",
						"COMPLETED",
						{ shown: true, mode: openEmailId ? "edit" : "new" },
					),
				]),
			),
		).toEqual({
			to: "a@example.com",
			subject: "Hello",
			body: "Hi",
			openEmailId,
			toolId: "call-2",
		});
	},
);

it.each([{}, { replyTo: "mail-2" }])(
	"distinguishes explicitly cleared envelope fields from omitted fields: %s",
	(source) => {
		const proposal = (fields: Record<string, unknown>) =>
			readDraftProposal(
				message([
					composeEmailPart({
						...source,
						openEmailId: "open-email",
						...fields,
					}),
				]),
			);
		expect(
			proposal({ to: "", cc: "", bcc: "", subject: "" }),
		).toMatchObject({
			to: "",
			cc: "",
			bcc: "",
			subject: "",
		});
		expect(proposal({})).toMatchObject({
			to: undefined,
			cc: undefined,
			bcc: undefined,
			subject: undefined,
		});
		expect(proposal({ cc: "", message: "  \n\t" })).toMatchObject({
			cc: "",
			body: undefined,
		});
	},
);

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
