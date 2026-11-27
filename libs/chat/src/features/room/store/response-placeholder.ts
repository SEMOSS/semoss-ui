import type { Engine, ResponsePixelMessage } from "../../../types";
import type { InputMessageStore } from "./input-message.store";
import type { ResponseMessageStore } from "./response-message.store";
import type { RoomStore } from "./room.store";
import {
	ASK_PLACEHOLDER_ID,
	STREAMING_PLACEHOLDER_ID,
} from "./room-placeholders";

/**
 * The model's name as a message's `ornaments.modelName` records it, until the
 * backend's copy of the message replaces it: its display name, else its
 * engine name. `app_name` is a deprecated MyEngines key and is not read.
 *
 * @param model - The model the message runs with.
 * @returns Its name, or an empty string when it has none.
 */
export const getModelOrnamentName = (
	model: Engine | null | undefined,
): string => model?.engine_display_name || model?.engine_name || "";

/**
 * Make the empty response a model reply streams into, shown while it arrives
 * and synced with the backend's message once it lands. It is not in the tree
 * yet: the caller adds it where the reply belongs.
 *
 * @param room - The room the reply is in, and whose model writes it.
 * @returns The placeholder.
 */
export const createResponsePlaceholder = (
	room: RoomStore,
): ResponseMessageStore =>
	room.createMessage({
		io: "OUTPUT",
		messageId: STREAMING_PLACEHOLDER_ID,
		visible: true,
		platform_generated: true,
		modelId: room.model.engine_id,
		dateCreated: new Date().toISOString(),
		parts: [],
		tokens: 0,
		ornaments: { modelName: getModelOrnamentName(room.model) },
	} as ResponsePixelMessage);

/**
 * Make the user's message as it shows while its turn starts, before the
 * backend's copy replaces it. It is not in the tree yet.
 *
 * @param room - The room the message is in, and whose model it is sent to.
 * @param prompt - What the user wrote.
 * @param visible - Whether the user's bubble renders.
 * @returns The placeholder.
 */
export const createInputPlaceholder = (
	room: RoomStore,
	prompt: string,
	visible: boolean,
): InputMessageStore =>
	room.createMessage({
		io: "INPUT",
		type: "INPUT_TEXT",
		messageId: ASK_PLACEHOLDER_ID,
		visible,
		platform_generated: true,
		modelId: room.model?.engine_id,
		modelType: room.model?.engine_type,
		dateCreated: new Date().toISOString(),
		parts: [{ type: "TEXT", text: prompt, uiText: prompt }],
		tokens: 0,
		ornaments: { modelName: getModelOrnamentName(room.model) },
		pruneToolsAbove: false,
	});

/** What a user's message sends to the model. */
export interface InputPayload {
	/** Its text parts, joined. */
	readonly text: string;
	/** Where its attachments were uploaded in the room's insight. */
	readonly media: string[];
}

/**
 * Read what a user's message sends: its text, and the files it attaches
 * that were uploaded, as `AskPlayground` and `RunAgent` take them.
 *
 * @param input - The user's message.
 * @returns Its text and its attachments' locations.
 */
export const readInputPayload = (
	input: Pick<InputMessageStore, "parts">,
): InputPayload => {
	let text = "";
	const media: string[] = [];
	for (const part of input.parts) {
		if (part.type === "TEXT") {
			text += part.text;
		} else if (part.type === "MEDIA" && part.mediaInfo.fileLocation) {
			media.push(part.mediaInfo.fileLocation);
		}
	}
	return { text, media };
};
