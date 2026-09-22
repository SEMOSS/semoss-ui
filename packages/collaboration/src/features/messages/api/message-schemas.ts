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

const subagentPartSchema = z.object({
	type: z.literal("SUBAGENT"),
	subagent: z.object({
		id: z.string(),
		status: z.enum([
			"SUBMITTED",
			"RUNNING",
			"INPUT_REQUIRED",
			"COMPLETED",
			"FAILED",
			"CANCELLED",
		]),
		alias: z.string().nullish(),
		resultPreview: z.string().nullish(),
		error: z.string().nullish(),
	}),
});

/** Canonical persisted message parts that collaboration can render. */
export const roomMessagePartSchema = z.discriminatedUnion("type", [
	textPartSchema,
	thinkingPartSchema,
	mediaPartSchema,
	toolCallPartSchema,
	toolResultPartSchema,
	subagentPartSchema,
]);

export type ValidatedRoomMessagePart = z.infer<typeof roomMessagePartSchema>;

/** Normalize the reactor's uppercase row columns before validating the message. */
const normalizeRoomMessage = (value: unknown) => {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return value;
	}

	const raw = value as Record<string, unknown>;
	const type = raw.type ?? raw.MESSAGE_TYPE_FORMAT;
	const text = raw.content ?? raw.inputPrompt ?? raw.MESSAGE_DATA;
	let parts = raw.parts;
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

/**
 * A persisted room message, normalized from either SDK-style or reactor rows.
 *
 * `GetRoomMessages` returns uppercase columns such as `MESSAGE_DATA` and
 * `MESSAGE_TYPE_FORMAT`; the SDK's loose `RoomMessage` type uses camelCase.
 */
export const roomMessageSchema = z.preprocess(
	normalizeRoomMessage,
	z.object({
		messageId: z.string(),
		// "INPUT_TEXT" | "INPUT_MEDIA" | "INPUT_TOOL_EXEC" | "RESPONSE_TEXT" | "RESPONSE_TOOL" | "RESPONSE_MEDIA"
		type: z.string().nullish(),
		parts: z.array(z.unknown()).nullish(),
		/** Agent text (ResponseMessage). */
		content: z.string().nullish(),
		/** User text (InputMessage). */
		inputPrompt: z.string().nullish(),
		/** Accepted because the SDK's own type declares it, though the server omits it. */
		role: z.string().nullish(),
		io: z.string().nullish(),
		// Some server variants omit this; the UI then deliberately omits the time.
		dateCreated: z.string().nullish(),
	}),
);

/** A message that passed validation and is safe to render. */
export type ValidatedRoomMessage = z.infer<typeof roomMessageSchema>;
