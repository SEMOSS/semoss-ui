import { download, oauth } from "@semoss/sdk";
import { z } from "@semoss/ui/next";
import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import {
	type EmailDraftInput,
	MAIL_DATE_RANGES,
	type MailSearchFilters,
	type SavedEmailDraft,
	type StagedSourceAttachment,
} from "../types";
import {
	type CalendarEvent,
	chatMessagesSchema,
	chatsSchema,
	eventSchema,
	eventsSchema,
	foldersSchema,
	forwardDraftReceiptSchema,
	mailListSchema,
	mailSchema,
	newDraftReceiptSchema,
	replyDraftReceiptSchema,
	stagedAttachmentSchema,
} from "./microsoft-schemas";

/** Only an HTTPS provider URL may become a clickable external link. */
export function safeSourceUrl(value: string | undefined): string | undefined {
	if (!value) return undefined;
	try {
		const url = new URL(value);
		return url.protocol === "https:" ? url.href : undefined;
	} catch {
		return undefined;
	}
}

/** Split a reviewable recipient list without accepting empty or malformed addresses. */
export function parseAddresses(value: string): string[] {
	const addresses = value
		.split(/[,;\n]/)
		.map((address) => address.trim())
		.filter(Boolean);
	if (addresses.some((address) => !z.email().safeParse(address).success))
		throw new Error("Enter email addresses separated by commas.");
	return [...new Set(addresses)];
}

/** List one bounded header page; this is an explicit load, not mailbox synchronization. */
export function listMail(
	actions: InsightActions,
	filters: Partial<MailSearchFilters> = {},
) {
	const sinceDays = filters.sinceDays === undefined ? 7 : filters.sinceDays;
	if (!Object.values(MAIL_DATE_RANGES).some((days) => days === sinceDays))
		throw new Error("Choose an email date range of 1, 7, 30, or 90 days.");
	return callPixel(
		actions,
		pixel("MicrosoftOutlookListMail", {
			folder: filters.folder || "inbox",
			limit: 20,
			sinceDays,
			includeBody: false,
			subject: filters.subject?.trim() || undefined,
			from: filters.from?.trim() || undefined,
			unreadOnly: filters.unreadOnly ?? false,
		}),
		mailListSchema,
	);
}

/** Read only the selected message body and its attachment metadata. */
export async function getMail(actions: InsightActions, uid: string) {
	const mail = await callPixel(
		actions,
		pixel("MicrosoftOutlookGetMail", {
			uid,
			maxBodyChars: 12_000,
			includeAttachments: true,
		}),
		mailSchema,
	);
	if (mail.uid !== uid)
		throw new Error("Microsoft returned a different email.");
	return mail;
}

/** List folder IDs; custom folder display names cannot be used as lookup identities. */
export function listMailFolders(actions: InsightActions) {
	return callPixel(
		actions,
		pixel("MicrosoftOutlookListMailFolders"),
		foldersSchema,
	);
}

/** Load chat metadata without fetching previews or marking anything read. */
export function listTeamsChats(actions: InsightActions) {
	return callPixel(
		actions,
		pixel("MicrosoftTeamsListChats", {
			limit: 20,
			includeLastMessage: false,
		}),
		chatsSchema,
	);
}

/** Load the latest thirty messages in a specifically selected Teams chat. */
export function getTeamsMessages(actions: InsightActions, chatId: string) {
	return callPixel(
		actions,
		pixel("MicrosoftTeamsListChatMessages", {
			chatId,
			limit: 30,
			maxBodyChars: 12_000,
		}),
		chatMessagesSchema,
	);
}

/** Load the next seven days of calendar headers in a known time zone. */
export function listCalendarEvents(actions: InsightActions) {
	return callPixel(
		actions,
		pixel("MicrosoftCalendarListEvents", {
			days: 7,
			limit: 30,
			timeZone: "UTC",
			includeBody: false,
		}),
		eventsSchema,
	);
}

/** Fetch a selected event; UTC is also requested on the detail operation. */
export async function getCalendarEvent(
	actions: InsightActions,
	eventId: string,
): Promise<CalendarEvent> {
	const event = await callPixel(
		actions,
		pixel("MicrosoftCalendarGetEvent", {
			eventId,
			timeZone: "UTC",
			maxBodyChars: 12_000,
		}),
		eventSchema,
	);
	if (event.id !== eventId)
		throw new Error("Microsoft returned a different calendar event.");
	return event;
}

/** A write was submitted, but a verifiable saved-draft receipt did not arrive. */
export class UncertainDraftError extends Error {
	constructor(cause: unknown) {
		super(
			`The draft save could not be confirmed. Check Outlook before saving another copy. ${cause instanceof Error ? cause.message : "The connection was interrupted."}`,
			{ cause },
		);
		this.name = "UncertainDraftError";
	}
}

/** Create an Outlook draft. No input permits send, and no existing draft is updated. */
export async function saveEmailDraft(
	actions: InsightActions,
	input: EmailDraftInput,
): Promise<SavedEmailDraft> {
	// Validate before a write starts, so invalid fields never become uncertain writes.
	const to = "to" in input ? parseAddresses(input.to) : [];
	const cc = input.mode === "new" ? parseAddresses(input.cc) : [];
	const bcc = input.mode === "new" ? parseAddresses(input.bcc) : [];
	if (input.mode !== "new" && !input.sourceUid.trim())
		throw new Error("Select the source email first.");
	if (input.mode === "reply" && !input.body.trim())
		throw new Error("Enter reply text.");
	if (input.mode === "forward" && to.length === 0)
		throw new Error("Enter at least one recipient.");
	try {
		if (input.mode === "new") {
			const receipt = await callPixel(
				actions,
				pixel("MicrosoftOutlookSaveDraft", {
					to,
					cc,
					bcc,
					subject: input.subject,
					message: input.body,
					html: false,
					attachments: input.attachments ?? [],
				}),
				newDraftReceiptSchema,
			);
			return {
				savedDraftId: receipt.draftId,
				webLink: safeSourceUrl(receipt.webLink),
			};
		}
		if (input.mode === "reply") {
			const receipt = await callPixel(
				actions,
				pixel("MicrosoftOutlookReplyMail", {
					uid: input.sourceUid,
					comment: input.body,
					replyAll: input.replyAll,
					asDraft: true,
				}),
				replyDraftReceiptSchema,
			);
			if (receipt.repliedTo !== input.sourceUid)
				throw new Error(
					"The draft receipt refers to a different email.",
				);
			return {
				savedDraftId: receipt.uid,
				webLink: safeSourceUrl(receipt.webLink),
			};
		}
		const receipt = await callPixel(
			actions,
			pixel("MicrosoftOutlookForwardMail", {
				uid: input.sourceUid,
				to,
				comment: input.body,
				asDraft: true,
			}),
			forwardDraftReceiptSchema,
		);
		if (receipt.forwarded !== input.sourceUid)
			throw new Error("The draft receipt refers to a different email.");
		return {
			savedDraftId: receipt.uid,
			webLink: safeSourceUrl(receipt.webLink),
		};
	} catch (cause: unknown) {
		throw new UncertainDraftError(cause);
	}
}

/** Stage one file attachment into the same insight used by the caller's room. */
export async function stageMailAttachment(
	actions: InsightActions,
	insightId: string,
	uid: string,
	attachmentId: string,
	originalName: string,
): Promise<StagedSourceAttachment> {
	if (!insightId)
		throw new Error(
			"A ready workspace is required to download an attachment.",
		);
	const basename =
		originalName
			.split(/[\\/]/)
			.pop()
			?.replace(/[^\p{L}\p{N}._-]/gu, "_") || "attachment";
	const fileName = `${crypto.randomUUID()}-${basename}`;
	const receipt = await callPixel(
		actions,
		pixel("MicrosoftOutlookDownloadAttachment", {
			uid,
			attachmentId,
			fileName,
		}),
		stagedAttachmentSchema,
	);
	if (
		receipt.uid !== uid ||
		receipt.attachmentId !== attachmentId ||
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
		sourceUid: uid,
	};
}

/** Download an already staged insight file using its export key, never its path as a key. */
export async function downloadStagedAttachment(
	actions: InsightActions,
	file: StagedSourceAttachment,
): Promise<void> {
	const fileKey = await callPixel(
		actions,
		pixel("DownloadInsightAsset", { filePath: file.filePath }),
		z.string().min(1),
	);
	await download(file.insightId, fileKey);
}

/** Bound the SDK OAuth wait so a closed or blocked popup leaves a recoverable state. */
export async function connectMicrosoft(timeoutMs = 60_000): Promise<void> {
	let timeout: ReturnType<typeof setTimeout> | undefined;
	try {
		await Promise.race([
			oauth("microsoft").then((success) => {
				if (!success)
					throw new Error("Microsoft sign-in was not completed.");
			}),
			new Promise<never>((_, reject) => {
				timeout = setTimeout(
					() =>
						reject(
							new Error(
								"Microsoft sign-in did not complete. Allow popups, then try connecting again.",
							),
						),
					timeoutMs,
				);
			}),
		]);
	} finally {
		if (timeout) clearTimeout(timeout);
	}
}
