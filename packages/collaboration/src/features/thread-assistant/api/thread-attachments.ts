import { z } from "@semoss/ui/next";
import type {
	SourceAttachment,
	StagedSourceAttachment,
} from "@/features/connectors/types";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";

/** Mirrors the backend's `BrainAttachmentText.supports`: these reach the model as text. */
const TEXT_COPY_EXTENSIONS = new Set([
	"doc",
	"docx",
	"docm",
	"dot",
	"dotx",
	"xls",
	"xlsx",
	"xlsm",
	"ppt",
	"pptx",
	"pptm",
	"msg",
	"eml",
]);

const stagedThreadAttachmentSchema = z.object({
	threadId: z.string().min(1),
	messageId: z.string().min(1),
	attachmentId: z.string().min(1),
	name: z.string(),
	size: z.number().int().nonnegative(),
	filePath: z.string().min(1),
	textPath: z.string().min(1).optional(),
	textTruncated: z.boolean().optional(),
	textError: z.string().optional(),
});

/**
 * Whether an attachment reaches the model as a plain-text copy rather than as
 * the file, because most providers reject Office and mail files.
 *
 * @param name - The attachment's file name.
 * @returns True for Word, Excel, PowerPoint, .msg, and .eml files.
 */
export function sendsAsText(name: string): boolean {
	const extension = name.split(".").pop()?.toLowerCase() ?? "";
	return name.includes(".") && TEXT_COPY_EXTENSIONS.has(extension);
}

/**
 * A readable, unique name for a staged copy.
 *
 * The room copies files flat by name and overwrites, so two `image001.png`
 * attachments must not collide. Only characters the backend keeps are used,
 * so its receipt echoes the name exactly.
 *
 * @param name - The attachment's own file name.
 * @returns `<stem>-<6 hex><extension>`.
 */
export function uniqueAttachmentName(name: string): string {
	const base =
		(name.split(/[\\/]/).pop() ?? "")
			.replace(/[^\p{L}\p{N}._ -]/gu, "_")
			.replace(/^\.+/, "")
			.trim() || "attachment";
	const dot = base.lastIndexOf(".");
	const hasExtension = dot > 0 && base.length - dot <= 10;
	const stem = (hasExtension ? base.slice(0, dot) : base)
		.slice(0, 100)
		.trim();
	const extension = hasExtension ? base.slice(dot) : "";
	const suffix = Array.from(
		crypto.getRandomValues(new Uint8Array(3)),
		(byte) => byte.toString(16).padStart(2, "0"),
	).join("");
	return `${stem || "attachment"}-${suffix}${extension}`;
}

/**
 * Stage one attachment of a Brain email into an insight's folder.
 *
 * The backend reads it only while the thread's rules still show that email.
 * When the insight is bound to the thread's room, the file lands in the room
 * folder, where the assistant can read it.
 *
 * @param actions - Actions of the insight that receives the file.
 * @param insightId - That insight's id.
 * @param threadId - The Brain thread.
 * @param attachment - An attachment listed on one of the thread's emails.
 * @param includeText - Also write a plain-text copy of an Office or mail file.
 * @returns The staged file, with its text copy when one was written.
 */
export async function stageThreadAttachment(
	actions: InsightActions,
	insightId: string,
	threadId: string,
	attachment: SourceAttachment,
	includeText: boolean,
): Promise<StagedSourceAttachment> {
	if (!insightId)
		throw new Error("A ready workspace is required to open an attachment.");
	if (!attachment.messageId)
		throw new Error("This attachment is not on an email in this thread.");
	const fileName = uniqueAttachmentName(attachment.name);
	const receipt = await callPixel(
		actions,
		pixel("WorkDownloadAttachment", {
			threadId,
			messageId: attachment.messageId,
			attachmentId: attachment.id,
			fileName,
			includeText,
		}),
		stagedThreadAttachmentSchema,
	);
	if (
		receipt.threadId !== threadId ||
		receipt.messageId !== attachment.messageId ||
		receipt.attachmentId !== attachment.id ||
		receipt.filePath !== fileName
	)
		throw new Error(
			"The attachment receipt does not match the selected file.",
		);
	return {
		insightId,
		filePath: receipt.filePath,
		name: receipt.name,
		size: receipt.size,
		attachmentId: receipt.attachmentId,
		sourceUid: attachment.messageId,
		...(receipt.textPath ? { textPath: receipt.textPath } : {}),
		...(receipt.textTruncated ? { isTextTruncated: true } : {}),
		...(receipt.textError ? { textError: receipt.textError } : {}),
	};
}
