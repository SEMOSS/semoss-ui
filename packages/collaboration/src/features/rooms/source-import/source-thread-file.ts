import { sanitizeFileNameStem } from "@semoss/utility/file";
import { safeSourceUrl } from "@/features/connectors/api/microsoft";
import type { SourceThreadDocument } from "./load-source-thread";
import type { RoomSource } from "./room-source";

/** A reply retained by this chat, distinct from messages read from the mailbox. */
export interface SourceEmailDraft {
	id: string;
	replyTo: string;
	status: "draft" | "saved" | "sending" | "sent" | "uncertain";
	subject: string;
	to: string;
	cc: string;
	bcc: string;
	body: string;
	attachments: string[];
	savedMessageId?: string;
}

/** Render source text literally, preserving paragraphs without interpreting sender markup. */
function sourceText(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/[\\`*_{}[\]()#+.!|~-]/g, "\\$&");
}

/** A readable Markdown snapshot; no display HTML or excluded text enters the room. */
export function sourceThreadMarkdown(
	document: SourceThreadDocument,
	drafts: SourceEmailDraft[] = [],
): string {
	const { thread, messages, limitations } = document;
	const blocks = [
		`# ${sourceText(thread.subject.replace(/[\r\n]+/g, " ") || "Untitled thread")}`,
		`**Source:** ${sourceText(thread.channel)}  \n**Messages:** ${messages.length}`,
		...limitations.map((limitation) => `_${sourceText(limitation)}_`),
	];
	for (const message of messages) {
		const sender =
			message.fromName || message.fromAddress || "Unknown sender";
		const fields = [
			["From", message.fromAddress],
			["Sent", message.at],
			["Subject", message.subject],
			["To", message.to?.join(", ")],
			["Cc", message.cc?.join(", ")],
			["Source link", message.webLink],
			["Attachments", message.attachments?.join(", ")],
		]
			.filter((field) => field[1])
			.map(([label, value]) => `**${label}:** ${sourceText(value ?? "")}`)
			.join("  \n");
		blocks.push(
			`## ${sourceText(sender.replace(/[\r\n]+/g, " "))}`,
			fields,
			message.text.trim()
				? sourceText(message.text).replace(/\n/g, "  \n")
				: "_This message has no readable text._",
		);
		if (message.isTruncated)
			blocks.push("_The source returned only part of this message._");
	}
	if (!messages.length)
		blocks.push(
			"_There are no included source messages in this snapshot._",
		);
	const includedIds = new Set(messages.map((message) => message.id));
	const replies = drafts.filter(
		(draft) =>
			includedIds.has(draft.replyTo) &&
			(draft.body.trim() || draft.attachments.length) &&
			!(
				draft.status === "sent" &&
				includedIds.has(draft.savedMessageId ?? "")
			),
	);
	if (replies.length) blocks.push("# Replies from this chat");
	const statuses: Record<SourceEmailDraft["status"], string> = {
		draft: "Draft — not sent",
		saved: "Saved draft — not sent",
		sending: "Sending — delivery not yet confirmed",
		sent: "Sent",
		uncertain: "Save or delivery status unknown — check the mailbox",
	};
	for (const reply of replies) {
		blocks.push(
			`## ${statuses[reply.status]}`,
			[
				["Subject", reply.subject],
				["To", reply.to],
				["Cc", reply.cc],
				["Bcc", reply.bcc],
				["Attachments", reply.attachments.join(", ")],
			]
				.filter((field) => field[1])
				.map(
					([label, value]) =>
						`**${label}:** ${sourceText(value ?? "")}`,
				)
				.join("  \n"),
			sourceText(reply.body).replace(/\n/g, "  \n"),
		);
	}
	return `${blocks.filter(Boolean).join("\n\n")}\n`;
}

/** Create a root-level upload with a safe filename and the original text encoding. */
export function sourceThreadFile(document: SourceThreadDocument): File {
	const name =
		sanitizeFileNameStem(document.thread.subject).slice(0, 100) || "Thread";
	return new File([sourceThreadMarkdown(document)], `${name}.md`, {
		type: "text/markdown",
	});
}

/** Persist only identities and envelope metadata beside the uploaded room file. */
export function roomSourceFromDocument(
	document: SourceThreadDocument,
	file: RoomSource["file"],
): RoomSource {
	return {
		version: 1,
		threadId: document.thread.id,
		title: document.thread.subject,
		channel: document.thread.channel,
		kind: document.kind,
		nativeId: document.thread.source?.nativeId,
		webLink: safeSourceUrl(document.thread.source?.webLink),
		file,
		messages: document.messages.map(
			({ id, subject, fromName, fromAddress, to, cc, at }) => ({
				id,
				subject,
				fromName,
				fromAddress,
				to,
				cc,
				at,
			}),
		),
	};
}
