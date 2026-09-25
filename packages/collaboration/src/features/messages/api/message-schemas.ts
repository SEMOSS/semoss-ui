import { z } from "@semoss/ui/next";

const unknownRecordSchema = z.record(z.string(), z.unknown());

const textPartSchema = z.object({
	type: z.literal("TEXT"),
	text: z.string().nullish(),
	uiText: z.string().nullish(),
});

const thinkingPartSchema = z.object({
	type: z.literal("THINKING"),
	thinking: z.string(),
});

const mediaPartSchema = z.object({
	type: z.literal("MEDIA"),
	mediaInfo: z.object({
		fileName: z.string(),
		fileLocation: z.string().nullish(),
		mimeType: z.string().nullish(),
	}),
});

const toolCallPartSchema = z.object({
	type: z.literal("TOOL_CALL"),
	toolCall: z.object({
		id: z.string(),
		name: z.string(),
		title: z.string().nullish(),
		description: z.string().nullish(),
		original_name: z.string().nullish(),
		arguments: unknownRecordSchema.nullish(),
		_meta: unknownRecordSchema.nullish(),
		server_tool: z.boolean().nullish(),
	}),
});

const toolResultPartSchema = z.object({
	type: z.literal("TOOL_RESULT"),
	toolResult: z.object({
		toolCallId: z.string(),
		toolName: z.string().nullish(),
		output: z.string().nullish(),
		toolParameterValues: unknownRecordSchema.nullish(),
		toolStatus: z
			.enum(["success", "error", "cancelled", "paused"])
			.nullish(),
	}),
});

/** Display ornament on a platform message carrying a person's delegated answer. */
export const delegationReplySchema = z.object({
	assignee: z.string(),
	outcome: z.enum(["RESPONDED", "DECLINED", "CANCELLED", "UNANSWERED"]),
	question: z.string().nullish(),
	text: z.string().nullish(),
	files: z
		.array(
			z.object({
				path: z.string(),
				name: z.string(),
				size: z.number().nullish(),
			}),
		)
		.nullish(),
});

/** Display ornament on the first message of a delegation room: what was asked. */
export const delegationRequestSchema = z.object({
	requester: z.string(),
	question: z.string(),
	context: z.string().nullish(),
	responseFormat: z.string().nullish(),
	dueAt: z.string().nullish(),
	files: z
		.array(
			z.object({
				path: z.string(),
				name: z.string(),
				size: z.number().nullish(),
			}),
		)
		.nullish(),
	links: z
		.array(z.object({ url: z.string(), title: z.string().nullish() }))
		.nullish(),
});

/** Canonical persisted playground message parts collaboration can render. */
export const roomMessagePartSchema = z.discriminatedUnion("type", [
	textPartSchema,
	thinkingPartSchema,
	mediaPartSchema,
	toolCallPartSchema,
	toolResultPartSchema,
]);

export type ValidatedRoomMessagePart = z.infer<typeof roomMessagePartSchema>;

/** Normalize reactor uppercase row columns before validating the message. */
const normalizeRoomMessage = (value: unknown) => {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return value;
	}

	const raw = value as Record<string, unknown>;
	const type = raw.type ?? raw.MESSAGE_TYPE_FORMAT;
	const text = raw.content ?? raw.inputPrompt ?? raw.MESSAGE_DATA;
	let parts = raw.parts ?? raw.PARTS;
	if (typeof parts === "string") {
		try {
			parts = JSON.parse(parts) as unknown;
		} catch {
			parts = undefined;
		}
	}
	const normalized: Record<string, unknown> = {
		...raw,
		messageId: raw.messageId ?? raw.MESSAGE_ID,
		type,
		dateCreated: raw.dateCreated ?? raw.DATE_CREATED,
		parentMessageId: raw.parentMessageId ?? raw.PARENT_MESSAGE_ID,
		summaryLeafMessageId:
			raw.summaryLeafMessageId ?? raw.SUMMARY_LEAF_MESSAGE_ID,
		visible: raw.visible ?? raw.VISIBLE,
		io: raw.io ?? raw.IO,
		modelId: raw.modelId ?? raw.MODEL_ID,
		parts,
	};

	if (typeof text === "string" && typeof type === "string") {
		if (type.toUpperCase().startsWith("INPUT")) {
			normalized.inputPrompt = raw.inputPrompt ?? text;
		} else {
			normalized.content = raw.content ?? text;
		}
	}

	return normalized;
};

/** A persisted message normalized from SDK-style or uppercase reactor rows. */
export const roomMessageSchema = z.preprocess(
	normalizeRoomMessage,
	z
		.object({
			messageId: z.string(),
			type: z.string().nullish(),
			parts: z.array(z.unknown()).nullish(),
			content: z.string().nullish(),
			inputPrompt: z.string().nullish(),
			role: z.string().nullish(),
			io: z.string().nullish(),
			dateCreated: z.string().nullish(),
			parentMessageId: z.string().nullish(),
			summaryLeafMessageId: z.string().nullish(),
			visible: z.boolean().nullish(),
			modelId: z.string().nullish(),
		})
		.catchall(z.unknown()),
);

export type ValidatedRoomMessage = z.infer<typeof roomMessageSchema>;

export const playgroundMessagesSchema = z.array(roomMessageSchema);
