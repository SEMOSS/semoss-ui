import { z } from "@semoss/ui/next";
import { readDisplayBody } from "@/features/email/message-body";
import { replyRecipientsSchema } from "./reply-recipients";

const date = z
	.string()
	.refine(
		(value) => Number.isFinite(Date.parse(value)),
		"Invalid source date",
	);
const optionalText = z
	.string()
	.nullish()
	.transform((value) => value ?? undefined);
const optionalDate = date.nullish().transform((value) => value ?? undefined);

// only a file has bytes that can be staged; Outlook can also attach another
// message or a link to a file in a drive
const sourceAttachmentSchema = z
	.object({
		id: z.string().min(1),
		name: z.string().default("Attachment"),
		contentType: optionalText,
		size: z.number().nonnegative().optional(),
		kind: z.enum(["file", "item", "link"]),
		isInline: z.boolean().optional(),
	})
	.transform(({ kind, ...attachment }) => ({
		...attachment,
		isFile: kind === "file",
	}));

// Work shows and searches recipients as one comma separated line
const recipientLine = z
	.array(z.string())
	.default([])
	.transform((addresses) =>
		addresses.length > 0 ? addresses.join(", ") : undefined,
	);

export const mailSchema = z
	.object({
		displayBody: z.unknown().transform(readDisplayBody).optional(),
		webLink: optionalText,
		id: z.string().min(1),
		internetMessageId: optionalText,
		from: optionalText,
		to: recipientLine,
		cc: recipientLine,
		subject: optionalText,
		sentDate: optionalDate,
		receivedDate: optionalDate,
		unread: z.boolean(),
		hasAttachments: z.boolean(),
		body: optionalText,
		bodyTruncated: z.boolean().optional(),
		attachments: z.array(sourceAttachmentSchema).optional(),
	})
	.transform(({ id, internetMessageId, ...mail }) => ({
		...mail,
		uid: id,
		messageId: internetMessageId,
	}));
export type OutlookMail = z.infer<typeof mailSchema>;
export const mailListSchema = z.object({
	folder: z.string(),
	count: z.number().int().nonnegative(),
	messages: z.array(mailSchema),
});
export const foldersSchema = z.object({
	count: z.number().int().nonnegative(),
	folders: z.array(
		z.object({
			id: z.string().min(1),
			name: optionalText,
			totalCount: z.number().optional(),
		}),
	),
});
export type OutlookFolder = z.infer<typeof foldersSchema>["folders"][number];

const chatSchema = z.object({
	id: z.string().min(1),
	displayName: optionalText,
	topic: optionalText,
	lastUpdatedDateTime: optionalDate,
	webUrl: optionalText,
	members: z
		.array(
			z.object({
				userId: optionalText,
				name: optionalText,
				email: optionalText,
			}),
		)
		.default([]),
});
export type TeamsChat = z.infer<typeof chatSchema>;
export const chatsSchema = z.object({
	count: z.number().int().nonnegative(),
	chats: z.array(chatSchema),
});
export const chatMessagesSchema = z.object({
	chatId: z.string().min(1),
	count: z.number().int().nonnegative(),
	messages: z.array(
		z.object({
			id: z.string().min(1),
			body: z.string(),
			displayBody: z.unknown().transform(readDisplayBody).optional(),
			webUrl: optionalText,
			fromId: optionalText,
			fromName: optionalText,
			createdDateTime: optionalDate,
			bodyTruncated: z.boolean().optional(),
			isDeleted: z.boolean().optional(),
		}),
	),
});

export const eventSchema = z.object({
	id: z.string().min(1),
	subject: optionalText,
	// UTC, or the date of a whole day event
	start: optionalDate,
	end: optionalDate,
	timeZone: optionalText,
	organizer: optionalText,
	organizerName: optionalText,
	body: optionalText,
	bodyTruncated: z.boolean().optional(),
	webLink: optionalText,
	location: optionalText,
	attendees: z
		.array(
			z.object({
				address: optionalText,
				name: optionalText,
				type: optionalText,
			}),
		)
		.default([]),
});
export type CalendarEvent = z.infer<typeof eventSchema>;
export const eventsSchema = z.object({
	count: z.number().int().nonnegative(),
	events: z.array(eventSchema),
});

// A saved draft answers with `draft: true` and the draft's own id, which is what
// sends it; a sent message answers with `sent: true` instead.
export const newDraftReceiptSchema = z.object({
	draft: z.literal(true),
	id: z.string().min(1),
	webLink: optionalText,
});
export const replyDraftReceiptSchema = z.object({
	draft: z.literal(true),
	id: z.string().min(1),
	repliedTo: z.string().min(1),
	...replyRecipientsSchema.shape,
	webLink: optionalText,
});
export const forwardDraftReceiptSchema = z.object({
	draft: z.literal(true),
	id: z.string().min(1),
	forwarded: z.string().min(1),
	webLink: optionalText,
});
export const stagedAttachmentSchema = z.object({
	success: z.literal(true),
	id: z.string().min(1),
	attachmentId: z.string().min(1),
	name: z.string(),
	filePath: z.string().min(1),
	size: z.number().int().nonnegative(),
});
