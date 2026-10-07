import { z } from "@semoss/ui/next";
import { emailAttachmentSchema } from "@/features/connectors/api/agent-email-attachments";
import type {
	ConversationMessage,
	ConversationTool,
} from "@/features/messages/types/message";
import {
	getToolComponent,
	TOOL_COMPONENTS,
} from "@/features/tools/utils/tool-components";

// a change to the open email may leave the body out to keep it
const body = z.string().trim().min(1).max(50000).optional();
// the editor the owner had open, when the assistant is changing it
const openEmailId = z.string().trim().min(1).optional();
const attachments = z.array(emailAttachmentSchema).max(10).optional();
const attachmentError = z.string().optional();
const addresses = z.string().trim().max(4000);
// a reply's to and cc replace the native lists when given; a forward's to is required to save
const replySchema = z.object({
	mode: z.enum(["reply", "forward"]),
	sourceMessageId: z.string().trim().min(1),
	to: addresses.optional(),
	cc: addresses.optional(),
	bcc: addresses.optional(),
	subject: z.string().trim().max(1000).optional(),
	body,
	openEmailId,
	attachments,
	attachmentError,
});
// An omitted envelope field keeps the open email's value; an empty string clears it.
const newEmailSchema = z.object({
	to: addresses.optional(),
	cc: addresses.optional(),
	bcc: addresses.optional(),
	subject: z.string().trim().max(1000).optional(),
	body,
	openEmailId,
	attachments,
	attachmentError,
});
const proposalSchema = z
	.union([replySchema, newEmailSchema])
	// a forward may have no note
	.refine(
		(proposal) =>
			proposal.body ||
			proposal.openEmailId ||
			("mode" in proposal && proposal.mode === "forward"),
	);

export type ThreadDraftProposal = z.infer<typeof proposalSchema>;
export type SourcedDraftProposal = z.infer<typeof replySchema>;

/** A reply or forward of an email in the thread, rather than a new email. */
export function isSourcedProposal(
	proposal: ThreadDraftProposal,
): proposal is SourcedDraftProposal {
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

// ComposeEmail (Semoss WorkComposeEmailReactor) names the body "message", the
// email it answers "replyTo" and the email it forwards "forward"
function proposalFromTool(tool: ConversationTool): ThreadDraftProposal | null {
	const args = tool.arguments;
	const text = (value: unknown) =>
		typeof value === "string" ? value : undefined;
	const replyTo = text(args.replyTo)?.trim();
	const forward = text(args.forward)?.trim();
	const source = replyTo || forward;
	const authoredBody = text(args.message);
	const editorId = text(args.openEmailId)?.trim() || undefined;
	let prepared: unknown;
	try {
		prepared = JSON.parse(tool.output || "null");
	} catch {
		prepared = null;
	}
	const requested = Array.isArray(args.attachments)
		? args.attachments.length
		: 0;
	const resultFiles = z
		.object({
			shown: z.literal(true),
			attachments: z.array(emailAttachmentSchema).max(10),
		})
		.safeParse(prepared);
	const fileFields = requested
		? resultFiles.success &&
			resultFiles.data.attachments.length === requested
			? { attachments: resultFiles.data.attachments }
			: {
					attachmentError:
						"The assistant's attachments could not be confirmed. Ask it to attach them again.",
				}
		: {};

	const result = proposalSchema.safeParse(
		source
			? {
					...fileFields,
					mode: replyTo ? "reply" : "forward",
					sourceMessageId: source,
					to: text(args.to),
					cc: text(args.cc),
					bcc: text(args.bcc),
					subject: text(args.subject),
					body: authoredBody?.trim() ? authoredBody : undefined,
					openEmailId: editorId,
				}
			: {
					...fileFields,
					to: text(args.to),
					cc: text(args.cc),
					bcc: text(args.bcc),
					subject: text(args.subject),
					body: authoredBody?.trim() ? authoredBody : undefined,
					openEmailId: editorId,
				},
	);
	return result.success ? result.data : null;
}

/** The email from a completed assistant response's last ComposeEmail call, with that call's id. */
export function readDraftProposal(
	message: ConversationMessage,
): (ThreadDraftProposal & { toolId: string }) | null {
	if (
		message.role !== "assistant" ||
		message.visible === false ||
		(message.runStatus && message.runStatus !== "COMPLETED") ||
		(message.live && message.live.phase !== "completed")
	)
		return null;
	const composed = message.parts.flatMap((part) =>
		part.type === "tool" &&
		part.tool.status === "COMPLETED" &&
		getToolComponent(part.tool) === TOOL_COMPONENTS.emailCompose
			? [part.tool]
			: [],
	);
	const last = composed.at(-1);
	const proposal = last ? proposalFromTool(last) : null;
	return last && proposal ? { ...proposal, toolId: last.id } : null;
}

/** The editor a ComposeEmail call opens; its tool call id survives live-to-durable reconciliation. */
export function composeDraftId(toolId: string): string {
	return `assistant-draft:${toolId}`;
}
