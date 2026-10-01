import { z } from "@semoss/ui/next";
import type { ConversationMessage } from "@/features/messages/types/message";

const body = z.string().trim().min(1).max(50000);
const replySchema = z
	.object({ sourceMessageId: z.string().trim().min(1), body })
	.strict();
// a new email; "to" may be empty when the assistant could not find the address
const newEmailSchema = z
	.object({
		to: z.string().trim().max(4000),
		cc: z.string().trim().max(4000).optional(),
		subject: z.string().trim().max(1000),
		body,
	})
	.strict();
// the block names the body "message", as SaveDraft/SendMail do; saved history may still say "body"
const proposalSchema = z.preprocess(
	(value) => {
		if (
			value &&
			typeof value === "object" &&
			"message" in value &&
			!("body" in value)
		) {
			const { message, ...rest } = value as Record<string, unknown>;
			return { ...rest, body: message };
		}
		return value;
	},
	z.union([replySchema, newEmailSchema]),
);

export type ThreadDraftProposal = z.infer<typeof proposalSchema>;
export type ReplyDraftProposal = z.infer<typeof replySchema>;

export function isReplyProposal(
	proposal: ThreadDraftProposal,
): proposal is ReplyDraftProposal {
	return "sourceMessageId" in proposal;
}

/**
 * Draft rules sent with rooms created before the backend prompt owned them (Semoss
 * CollaborationPrompts DRAFTS); kept verbatim so those rooms are still recognized.
 */
export const LEGACY_DRAFT_PROPOSAL_INSTRUCTIONS = [
	"When asked to draft or revise an email reply, produce a local proposal for review, never call an email save, reply, forward, or send tool.",
	'Put exactly one JSON object in a fenced semoss-email-draft block: {"sourceMessageId":"the included source email id","body":"the complete reply as plain text with newline escapes"}.',
	"Use selectedSourceMessageId when the request specifies it; otherwise use an included source email identity from the Work context. Never invent an identity, use excluded sources, include quoted source history in the body, or claim the draft is saved. If there is insufficient information, ask a question instead.",
	"When emailDraft is present in the request context, revise its current body using the user's instructions. Return the complete replacement body, preserving facts and intent unless asked to change them. The user reviews it in the same reply editor and chooses Save to Outlook. Never save it with a tool.",
].join("\n");

/** Read an explicit artifact only from a completed assistant response, never from source prose. */
export function readDraftProposal(
	message: ConversationMessage,
): ThreadDraftProposal | null {
	if (
		message.role !== "assistant" ||
		message.visible === false ||
		(message.runStatus && message.runStatus !== "COMPLETED") ||
		(message.live && message.live.phase !== "completed")
	)
		return null;
	if (
		message.parts.some(
			(part) => part.type === "text" && part.state === "active",
		)
	)
		return null;
	const text = message.parts
		.flatMap((part) => (part.type === "text" ? [part.text] : []))
		.join("\n");
	const matches = [
		...text.matchAll(/```semoss-email-draft\s*\n([\s\S]*?)\n```/g),
	];
	if (matches.length !== 1) return null;
	try {
		const result = proposalSchema.safeParse(
			JSON.parse(matches[0]?.[1] ?? ""),
		);
		return result.success ? result.data : null;
	} catch {
		return null;
	}
}

/** Hide only explicit proposal markup, including partial streamed artifacts. */
export function presentDraftProposal(
	message: ConversationMessage,
): ConversationMessage {
	if (message.role !== "assistant") return message;
	const proposal = readDraftProposal(message);
	const running = Boolean(message.live && message.live.phase !== "completed");
	let insideProposal = false;
	return {
		...message,
		parts: message.parts.map((part) => {
			if (part.type !== "text") return part;
			let text = part.text;
			let displayed = "";
			while (text) {
				if (insideProposal) {
					const end = text.indexOf("```");
					if (end < 0) {
						text = "";
						break;
					}
					text = text.slice(end + 3);
					insideProposal = false;
				} else {
					const start = text.indexOf("```semoss-email-draft");
					if (start < 0) {
						displayed += text;
						break;
					}
					displayed += text.slice(0, start);
					displayed += proposal
						? isReplyProposal(proposal)
							? "Your reply draft is ready to review."
							: "Your email draft is ready to review."
						: running
							? "Preparing your reply draft..."
							: "The reply draft could not be read. Please ask the assistant to try again.";
					text = text.slice(start + "```semoss-email-draft".length);
					insideProposal = true;
				}
			}
			return { ...part, text: displayed };
		}),
	};
}

/** Stable across live-to-durable message reconciliation. */
export function draftProposalId(message: ConversationMessage): string {
	return `assistant-draft:${message.runId || message.id}`;
}
