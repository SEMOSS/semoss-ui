import { AbstractMessageStore } from "./abstract-message.store";
import type { InputMessageData } from "./message-map";

/**
 * A message the user sent: a view over its entry in the room. Make one with
 * `room.createMessage`.
 */
export class InputMessageStore extends AbstractMessageStore<InputMessageData> {
	/** Tells an input message from a response. */
	readonly type = "INPUT";
}
