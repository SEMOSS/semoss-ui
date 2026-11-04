import { isRecord } from "@semoss/utility/object";
import { readNonBlankString } from "@semoss/utility/text";
import {
	parseEach,
	readBody,
	readNumber,
	readStringList,
	requireList,
	requireRecord,
} from "../core/connector-parse";
import type {
	MailAttachment,
	MailDisplayBody,
	MailFolder,
	MailInlineImage,
	MailMessage,
	MailPage,
	MailReceipt,
} from "./mail.types";

/*
 * Every mail reactor answers in the same shape, whichever mailbox it reads, so
 * one set of parsers reads them all.
 */

const parseMailFolder = (entry: unknown): MailFolder | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readNonBlankString(entry.id);
	if (!id) {
		return null;
	}
	const depth = readNumber(entry.depth);
	return {
		id: id,
		name: readNonBlankString(entry.name) ?? id,
		kind: readNonBlankString(entry.kind),
		parentId: readNonBlankString(entry.parentId),
		path: readNonBlankString(entry.path),
		depth:
			depth !== undefined && Number.isSafeInteger(depth) && depth > 0
				? depth
				: 0,
		wellKnownName: readNonBlankString(entry.wellKnownName)?.toLowerCase(),
		totalCount: readNumber(entry.totalCount),
		unreadCount: readNumber(entry.unreadCount),
	};
};

/**
 * The places a mailbox files mail, from `ListMailFolders`.
 *
 * @param raw - The reactor's output, `{ offset, count, hasMore, folders }`.
 * @return The folders, each right after the one it sits in.
 */
export const parseMailFolders = (raw: unknown): MailFolder[] =>
	parseEach(requireList(raw, "folders", "any folders"), parseMailFolder);

const parseMailAttachment = (entry: unknown): MailAttachment | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readNonBlankString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		name: readNonBlankString(entry.name) ?? id,
		contentType: readNonBlankString(entry.contentType),
		size: readNumber(entry.size),
		isInline: entry.isInline === true,
		kind: readNonBlankString(entry.kind) ?? "file",
	};
};

/** A media type a browser shows as a picture, as the backend writes it. */
const IMAGE_TYPE = /^image\/[a-z0-9.+-]+$/;

/**
 * The letters of standard base64 with its padding. A picture runs to millions
 * of them, so the check is one plain run, which no length can overflow, with
 * the padded length checked apart.
 */
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Whether text is standard padded base64, the way the backend encodes a
 * picture.
 *
 * @param value - The text.
 * @return True when it is.
 */
const isBase64 = (value: string): boolean =>
	value.length % 4 === 0 && BASE64.test(value);

const parseMailInlineImage = (entry: unknown): MailInlineImage | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const contentId = readNonBlankString(entry.contentId);
	const contentType = readNonBlankString(entry.contentType);
	const data = entry.data;
	if (
		!contentId ||
		!contentType ||
		!IMAGE_TYPE.test(contentType) ||
		typeof data !== "string" ||
		data === "" ||
		!isBase64(data)
	) {
		return null;
	}
	return { contentId: contentId, contentType: contentType, data: data };
};

const parseMailDisplayBody = (entry: unknown): MailDisplayBody | undefined => {
	if (
		!isRecord(entry) ||
		(entry.contentType !== "html" && entry.contentType !== "text") ||
		typeof entry.content !== "string" ||
		entry.content.trim() === ""
	) {
		return undefined;
	}
	const omitted = readNumber(entry.inlineImagesOmitted);
	return {
		contentType: entry.contentType,
		content: entry.content,
		isTruncated: entry.isTruncated === true,
		inlineImages: Array.isArray(entry.inlineImages)
			? parseEach(entry.inlineImages, parseMailInlineImage)
			: undefined,
		inlineImagesOmitted:
			omitted !== undefined &&
			Number.isSafeInteger(omitted) &&
			omitted > 0
				? omitted
				: 0,
	};
};

const parseMailMessage = (entry: unknown): MailMessage | null => {
	if (!isRecord(entry)) {
		return null;
	}
	const id = readNonBlankString(entry.id);
	if (!id) {
		return null;
	}
	return {
		id: id,
		conversationId: readNonBlankString(entry.conversationId),
		from: readNonBlankString(entry.from),
		fromName: readNonBlankString(entry.fromName),
		to: readStringList(entry.to),
		cc: readStringList(entry.cc),
		subject: readNonBlankString(entry.subject),
		receivedDate: readNonBlankString(entry.receivedDate),
		sentDate: readNonBlankString(entry.sentDate),
		isUnread: entry.unread === true,
		hasAttachments: entry.hasAttachments === true,
		body: readBody(entry.body, entry.bodyTruncated === true),
		uniqueBody: readBody(
			entry.uniqueBody,
			entry.uniqueBodyTruncated === true,
		),
		isBodyTruncated: entry.bodyTruncated === true,
		isUniqueBodyTruncated: entry.uniqueBodyTruncated === true,
		attachments: parseEach(entry.attachments, parseMailAttachment),
		displayBody: parseMailDisplayBody(entry.displayBody),
		webLink: readNonBlankString(entry.webLink),
	};
};

/**
 * One page of a mailbox, from `ListMail`.
 *
 * @param raw - The reactor's output, `{ folder, offset, count, hasMore, messages }`.
 * @return The emails, newest first, and whether there are more.
 */
export const parseMailPage = (raw: unknown): MailPage => {
	const messages = requireList(raw, "messages", "any messages");
	const count = isRecord(raw) ? readNumber(raw.count) : undefined;
	return {
		messages: parseEach(messages, parseMailMessage),
		rawCount:
			count !== undefined && Number.isSafeInteger(count) && count >= 0
				? count
				: messages.length,
		hasMore: isRecord(raw) && raw.hasMore === true,
	};
};

/**
 * One email, from `GetMail`.
 *
 * @param raw - The reactor's output.
 * @return The email with its body and attachments.
 * @throws Error when the response is not an email.
 */
export const parseMailMessageDetail = (raw: unknown): MailMessage => {
	const message = parseMailMessage(raw);
	if (!message) {
		throw new Error("The response did not include the message.");
	}
	return message;
};

/**
 * What a send or a draft save reported, from `SendMail`, `SaveDraft`,
 * `SendDraft`, `ReplyMail`, or `ForwardMail`.
 *
 * @param raw - The reactor's output, `{ sent }` or `{ draft }` with the email.
 * @return The receipt, or null when the output is not one.
 */
export const parseMailReceipt = (raw: unknown): MailReceipt | null => {
	if (!isRecord(raw) || (raw.sent !== true && raw.draft !== true)) {
		return null;
	}
	return {
		isSent: raw.sent === true,
		id: readNonBlankString(raw.id),
		webLink: readNonBlankString(raw.webLink),
		to: readStringList(raw.to),
		cc: readStringList(raw.cc),
		bcc: readStringList(raw.bcc),
		subject: readNonBlankString(raw.subject),
		body: readNonBlankString(raw.body),
		isHtml: raw.html === true,
		attachments: readStringList(raw.attachments),
	};
};

/**
 * Where `DownloadAttachment` saved its file, for a download save.
 *
 * @param raw - The reactor's output.
 * @return The file's path, relative to the insight's folder.
 * @throws Error when the output does not say where the file is.
 */
export const readMailSavedPath = (raw: unknown): string => {
	const filePath = readNonBlankString(
		requireRecord(raw, "the saved file").filePath,
	);
	if (!filePath) {
		throw new Error("The response did not include the saved file.");
	}
	return filePath;
};
