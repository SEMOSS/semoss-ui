import type { ConversationMessage } from "@/features/messages/types/message";
import {
	draftProposalId,
	presentDraftProposal,
	readDraftProposal,
} from "./thread-draft-proposal";

const message: ConversationMessage = {
	id: "final",
	runId: "run",
	role: "assistant",
	parts: [
		{
			type: "text",
			text: 'Ready.\n```semoss-email-draft\n{"sourceMessageId":"mail-2","body":"Friday works.\\nThanks!"}\n```',
		},
	],
};

it("recognizes a completed explicit proposal and presents readable prose", () => {
	expect(readDraftProposal(message)).toEqual({
		sourceMessageId: "mail-2",
		body: "Friday works.\nThanks!",
	});
	expect(presentDraftProposal(message).parts).toEqual([
		{ type: "text", text: "Ready.\nYour reply draft is ready to review." },
	]);
	expect(draftProposalId({ ...message, id: "live" })).toBe(
		draftProposalId(message),
	);
});

it("reads a new email proposal with recipients and a subject", () => {
	const proposal = readDraftProposal({
		...message,
		parts: [
			{
				type: "text",
				text: '```semoss-email-draft\n{"to":"a@example.com","subject":"Hello","body":"Hi"}\n```',
			},
		],
	});
	expect(proposal).toEqual({
		to: "a@example.com",
		subject: "Hello",
		body: "Hi",
	});
	expect(
		presentDraftProposal({
			...message,
			parts: [
				{
					type: "text",
					text: '```semoss-email-draft\n{"to":"","subject":"Hello","body":"Hi"}\n```',
				},
			],
		}).parts,
	).toEqual([{ type: "text", text: "Your email draft is ready to review." }]);
});

it("reads the body from message, the name SaveDraft and SendMail use", () => {
	const withText = (text: string): ConversationMessage => ({
		...message,
		parts: [{ type: "text", text }],
	});
	expect(
		readDraftProposal(
			withText(
				'```semoss-email-draft\n{"sourceMessageId":"mail-2","message":"Friday works."}\n```',
			),
		),
	).toEqual({ sourceMessageId: "mail-2", body: "Friday works." });
	expect(
		readDraftProposal(
			withText(
				'```semoss-email-draft\n{"to":"a@example.com","subject":"Hello","message":"Hi"}\n```',
			),
		),
	).toEqual({ to: "a@example.com", subject: "Hello", body: "Hi" });
	// both names at once is ambiguous
	expect(
		readDraftProposal(
			withText(
				'```semoss-email-draft\n{"sourceMessageId":"mail-2","body":"A","message":"B"}\n```',
			),
		),
	).toBeNull();
});

it.each([
	{ ...message, runStatus: "FAILED" as const },
	{ ...message, runStatus: "CANCELLED" as const },
	{ ...message, role: "user" as const },
	{
		...message,
		live: { phase: "streaming" as const, hasObservationIssue: false },
	},
	{
		...message,
		live: { phase: "cancelled" as const, hasObservationIssue: false },
	},
	{
		...message,
		parts: [
			{
				type: "text" as const,
				text: "Here is a draft reply: Friday works.",
			},
		],
	},
	{
		...message,
		parts: [
			{
				type: "text" as const,
				text: '```semoss-email-draft\n{"body":"No source"}\n```',
			},
		],
	},
	{
		...message,
		parts: [
			{
				type: "text" as const,
				text: '```semoss-email-draft\n{"sourceMessageId":"mail","body":""}\n```',
			},
		],
	},
])(
	"rejects source prose, incomplete output, and invalid artifacts",
	(input) => {
		expect(readDraftProposal(input)).toBeNull();
	},
);

it("hides proposal serialization while streaming and across text parts", () => {
	const streaming: ConversationMessage = {
		...message,
		live: { phase: "streaming", hasObservationIssue: false },
		parts: [
			{
				type: "text",
				text: '```semoss-email-draft\n{"body":"unfinished',
			},
		],
	};
	expect(presentDraftProposal(streaming).parts).toEqual([
		{ type: "text", text: "Preparing your reply draft..." },
	]);
	const split: ConversationMessage = {
		...message,
		parts: [
			{ type: "text", text: "```semoss-email-draft\n" },
			{
				type: "text",
				text: '{"sourceMessageId":"mail-2","body":"Friday works."}\n```',
			},
		],
	};
	expect(presentDraftProposal(split).parts).toEqual([
		{ type: "text", text: "Your reply draft is ready to review." },
		{ type: "text", text: "" },
	]);
});
