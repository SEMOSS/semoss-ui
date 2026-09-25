import { z } from "@semoss/ui/next";

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

export const sourceAttachmentSchema = z.object({
	id: z.string().min(1),
	name: z.string().default("Attachment"),
	contentType: optionalText,
	size: z.number().nonnegative().optional(),
	isFile: z.boolean(),
	isInline: z.boolean().optional(),
});

export const mailSchema = z.object({
	uid: z.string().min(1),
	messageId: optionalText,
	from: optionalText,
	to: optionalText,
	cc: optionalText,
	subject: optionalText,
	sentDate: optionalDate,
	receivedDate: optionalDate,
	unread: z.boolean(),
	hasAttachments: z.boolean(),
	body: optionalText,
	bodyTruncated: z.boolean().optional(),
	attachments: z.array(sourceAttachmentSchema).optional(),
});
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
			totalItemCount: z.number().optional(),
		}),
	),
});
export type OutlookFolder = z.infer<typeof foldersSchema>["folders"][number];

export const chatSchema = z.object({
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
	start: optionalDate,
	end: optionalDate,
	startTimeZone: optionalText,
	endTimeZone: optionalText,
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

// Receipt recipient fields vary across backend revisions; identity/status are the
// required contract, and unused receipt recipients are deliberately not inferred.
export const newDraftReceiptSchema = z.object({
	saved: z.literal(true),
	draftId: z.string().min(1),
	webLink: optionalText,
});
export const replyDraftReceiptSchema = z.object({
	sent: z.literal(false),
	uid: z.string().min(1),
	repliedTo: z.string().min(1),
	webLink: optionalText,
});
export const forwardDraftReceiptSchema = z.object({
	sent: z.literal(false),
	uid: z.string().min(1),
	forwarded: z.string().min(1),
	webLink: optionalText,
});
export const stagedAttachmentSchema = z.object({
	success: z.literal(true),
	uid: z.string().min(1),
	attachmentId: z.string().min(1),
	name: z.string(),
	filePath: z.string().min(1),
	size: z.number().int().nonnegative(),
});
