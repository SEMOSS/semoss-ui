import type { PlaygroundMessagePart } from "@/api/rooms";
import type { BuiltinToolSelection } from "@/components/engine";

/** One tool invocation surfaced on an assistant turn, for display only. */
export interface ModelChatToolCall {
	/** Provider-assigned id of the call. */
	id: string;
	/** Tool that was invoked. */
	name: string;
	/** Arguments the model passed, when the backend reported them. */
	arguments?: Record<string, unknown>;
	/** Result the tool returned, when the turn carried one. */
	output?: unknown;
}

/**
 * One file attached to a turn — the MEDIA part's payload as the backend
 * persists it. `fileLocation` is absent on an optimistic attachment, which is
 * minted from the local File before the upload resolves.
 */
export type ModelChatAttachment = NonNullable<
	PlaygroundMessagePart["mediaInfo"]
>;

/** One turn rendered in the model chat transcript. */
export interface ModelChatMessage {
	/**
	 * Durable message id once the turn is persisted, or a client-minted
	 * `pending-*` id while a turn is in flight.
	 */
	id: string;
	/** Direction of the message relative to the model. */
	io: "INPUT" | "OUTPUT";
	/** Rendered message body. */
	text: string;
	/** Extended-thinking content, when the model produced any. */
	thinking?: string;
	/** Provider-executed tool calls attached to the turn. */
	toolCalls?: ModelChatToolCall[];
	/** Files sent with the turn, on an INPUT message. */
	attachments?: ModelChatAttachment[];
	/** Tokens attributed to the message. */
	tokens?: number;
	/** Display name of the model that produced the message. */
	modelName?: string;
	/** When the message was persisted. */
	dateCreated?: string;
	/** True while the message is still streaming in. */
	isStreaming?: boolean;
}

/**
 * Per-conversation model configuration. Persisted onto the room's options so
 * resuming a conversation restores how it was tuned.
 */
export interface ModelChatConfig {
	/** System prompt applied to every turn (the room's `instructions`). */
	instructions: string;
	/**
	 * Provider-hosted built-in tools enabled for this conversation, keyed by
	 * canonical tool name. Sent as `built_in_tools`, which overrides the
	 * engine's saved selection — including an empty object, which disables
	 * every tool.
	 */
	builtinTools: Record<string, BuiltinToolSelection>;
}
