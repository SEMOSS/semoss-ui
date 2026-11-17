import type {
	InputPixelMessage,
	PixelMessage,
	PixelMessageSubagentPart,
	PixelMessageToolCallPart,
	PixelMessageToolResultPart,
	ResponsePixelMessage,
	ToolOutcome,
} from "../../../types";
import type { AbstractMessageStore } from "../../conversation/store/abstract-message.store";
import { InputMessageStore } from "../../conversation/store/input-message.store";
import {
	addMessages,
	buildMessageTree,
	type CancelCommitOutput,
	graftTurns,
	insertChild,
	type MessageData,
	type MessageKey,
	type MessageMap,
	type MessageTurn,
	removeSubtree,
	setActiveChild,
	spliceHiddenMessages,
	toMessageData,
	updateMessage,
	updateParts,
} from "../../conversation/store/message-map";
import { ResponseMessageStore } from "../../conversation/store/response-message.store";
import {
	initialToolData,
	isToolSettled,
	type ToolData,
	ToolStore,
	toToolJson,
} from "../../conversation/store/tool.store";
import { STREAMING_PLACEHOLDER_ID } from "../../tools/mcp/mcp-constants";
import type { RoomStore } from "./room.store";
import { createRootMessage } from "./room-load";
import type { RoomSnapshot } from "./room-snapshot";

/** Counts the messages made in this page, so every key is new. */
let messageKeyCount = 0;

/** The part of the room's snapshot the tree writes. */
type TreeChange = Partial<Pick<RoomSnapshot, "messages" | "rootKey" | "tools">>;

/** A message view: an input message, or a response (and the root). */
type MessageView = InputMessageStore | ResponseMessageStore;

/**
 * Work out every tool call's `json` again, since a work folder call's
 * metadata follows the room's options. A call whose `json` comes back the
 * same keeps its entry, and the map is kept when none changes.
 *
 * @param tools - The room's tool calls.
 * @param decorateToolCall - Fills in a call's metadata from the options.
 * @returns The tool calls.
 */
export const redecorateTools = (
	tools: RoomSnapshot["tools"],
	decorateToolCall: (
		call: PixelMessageToolCallPart["toolCall"],
	) => PixelMessageToolCallPart["toolCall"],
): RoomSnapshot["tools"] => {
	let next: Record<string, ToolData> | null = null;
	for (const [id, data] of Object.entries(tools)) {
		const json = toToolJson(data, decorateToolCall);
		if (json !== data.json) {
			next ??= { ...tools };
			next[id] = { ...data, json };
		}
	}
	return next ?? tools;
};

/**
 * The room's conversation as plain data, and the views over it: every
 * message on every branch and every tool call, and the reads and writes the
 * views go through. Owned by `RoomStore`, which keeps each of its public
 * names as a delegate. Deleted messages and calls lose their views; a view
 * held elsewhere reads as empty.
 */
export class RoomMessageTree {
	/** The room the views are over. */
	private readonly room: RoomStore;

	/** Writes the tree's part of the room's snapshot. */
	private readonly write: (
		change: (current: RoomSnapshot) => TreeChange,
	) => void;

	/** One view per message, by key, so a message is the same object for its life. */
	private readonly messageViews = new Map<MessageKey, MessageView>();

	/** The views of each `childKeys` array, so `children` keeps its identity. */
	private readonly childViews = new WeakMap<
		readonly MessageKey[],
		readonly AbstractMessageStore[]
	>();

	/** One view per tool call, by id. */
	private readonly toolViews = new Map<string, ToolStore>();

	/**
	 * @param room - The room the views are over, whose snapshot holds the tree.
	 * @param write - Writes the tree's part of the room's snapshot.
	 */
	constructor(
		room: RoomStore,
		write: (change: (current: RoomSnapshot) => TreeChange) => void,
	) {
		this.room = room;
		this.write = write;
	}

	/** The room's current snapshot. */
	private get snapshot(): RoomSnapshot {
		return this.room.getSnapshot();
	}

	/**
	 * Find a message anywhere in the tree, on any branch.
	 *
	 * @param messageId - The message's id.
	 * @returns The message, or null when the room has none by that id.
	 */
	getMessage = (messageId: string): MessageView | null => {
		const { messages, rootKey } = this.snapshot;
		const queue: MessageKey[] = rootKey === null ? [] : [rootKey];
		for (let index = 0; index < queue.length; index += 1) {
			const data = messages[queue[index]];
			if (!data) {
				continue;
			}
			if (data.id === messageId) {
				return this.viewOf(data);
			}
			queue.push(...data.childKeys);
		}
		return null;
	};

	/** The hidden message every conversation hangs from, or null until the room loads. */
	get root(): ResponseMessageStore | null {
		const { rootKey } = this.snapshot;
		const root = rootKey === null ? null : this.getMessageByKey(rootKey);
		return root instanceof ResponseMessageStore ? root : null;
	}

	/** Each message's active child, from the root down, without the root itself. */
	get history(): MessageView[] {
		const { messages, rootKey } = this.snapshot;
		const history: MessageView[] = [];
		let data = rootKey === null ? undefined : messages[rootKey];
		while (data) {
			const key: MessageKey | undefined =
				data.childKeys[data.activeChildIndex];
			data = key === undefined ? undefined : messages[key];
			if (data) {
				history.push(this.viewOf(data));
			}
		}
		return history;
	}

	/** The last message of the history, or the root when it is empty. */
	get tail(): MessageView {
		const history = this.history;
		return (
			history[history.length - 1] ??
			(this.root as unknown as ResponseMessageStore)
		);
	}

	/**
	 * The last real response, walking up from the tail past input messages
	 * and the streaming placeholder. The root is no response, so an empty
	 * room has none.
	 */
	get latestResponseMessage(): ResponseMessageStore | null {
		const { rootKey } = this.snapshot;
		let message: AbstractMessageStore | null = this.tail;
		while (message && message.key !== rootKey) {
			if (
				message instanceof ResponseMessageStore &&
				message.id !== STREAMING_PLACEHOLDER_ID
			) {
				return message;
			}
			message = message.parent;
		}
		return null;
	}

	/**
	 * Total tokens used in the current conversation.
	 *
	 * How token counts work across message types:
	 * - INPUT messages have a cumulative count covering all prior exchanges.
	 * - RESPONSE messages have only the incremental count for that turn.
	 * - INPUT_TOOL_EXEC messages are also cumulative, but their count stays 0
	 *   until all tool results for the preceding response have come in.
	 *
	 * We never create INPUT_TOOL_EXEC messages, so mid-conversation the chain can look like:
	 *   INPUT → RESPONSE → RESPONSE(cumulative proxy) → RESPONSE(incremental) → ...
	 * saveToolExecution() in response-message.store stamps the server's cumulative input
	 * token count onto the parent RESPONSE so the math still works here. See that file.
	 *
	 * To get the total: walk back from tail and add up the two most-recent messages
	 * with non-zero tokens — one incremental, one cumulative (INPUT or proxy RESPONSE).
	 */
	get tokensUsed(): number {
		let message: AbstractMessageStore | null = this.tail;
		let tokensUsed = 0;
		while (message) {
			if (message.tokens) {
				if (tokensUsed) {
					return tokensUsed + message.tokens;
				}
				tokensUsed += message.tokens;
			}
			message = message.parent;
		}
		return tokensUsed;
	}

	/**
	 * Find a spawned subagent's part by id, wherever it falls in the history.
	 * Looked up live (not snapshotted) so a panel showing it stays in sync with
	 * status/result updates while open.
	 *
	 * @param subagentId - The subagent's id.
	 * @returns Its part, or undefined when no message in the history spawned it.
	 */
	getSubagentPart = (
		subagentId: string,
	): PixelMessageSubagentPart["subagent"] | undefined => {
		for (const message of this.history) {
			if (!(message instanceof ResponseMessageStore)) {
				continue;
			}
			const part = message.parts.find(
				(p): p is PixelMessageSubagentPart =>
					p.type === "SUBAGENT" && p.subagent.id === subagentId,
			);
			if (part) {
				return part.subagent;
			}
		}
		return undefined;
	};

	// Tools

	/**
	 * Create or update a tool call from a message part, for both tool calls and
	 * tool results. A call the room has not seen starts in its `tools`.
	 *
	 * @param toolId - The tool call's id.
	 * @param message - The message holding the part.
	 * @param part - The tool call or result part.
	 * @param options - `placeholder`: the part is the stub pushed while the
	 * call streams in.
	 */
	syncTool = (
		toolId: string,
		message: MessageView,
		part: PixelMessageToolCallPart | PixelMessageToolResultPart,
		options?: { placeholder?: boolean },
	): void => {
		this.getOrCreateTool(toolId).syncMessage(message, part, options);
	};

	/**
	 * Sync the tool calls and results a message holds. Server tools
	 * (provider-side, e.g. web_search) bring their call and their result in
	 * the same response, so both part types sync.
	 *
	 * @param message - The message.
	 */
	syncMessageTools = (message: AbstractMessageStore): void => {
		if (
			!(message instanceof InputMessageStore) &&
			!(message instanceof ResponseMessageStore)
		) {
			return;
		}
		for (const part of message.parts) {
			if (part.type === "TOOL_CALL") {
				this.syncTool(part.toolCall.id, message, part);
			} else if (part.type === "TOOL_RESULT") {
				this.syncTool(part.toolResult.toolCallId, message, part);
			}
		}
	};

	/**
	 * Find a tool call by id, or start one that has not synced anything yet.
	 *
	 * @param toolId - The tool call's id.
	 * @returns The call.
	 */
	getOrCreateTool = (toolId: string): ToolStore => {
		if (!this.snapshot.tools[toolId]) {
			this.write((current) => ({
				tools: { ...current.tools, [toolId]: initialToolData(toolId) },
			}));
		}
		return this.toolView(toolId);
	};

	/**
	 * Change a tool call, for its view. Its `json` is worked out again when
	 * its part or streamed name changes and the change does not bring one.
	 *
	 * @param toolId - The call; nothing happens when the room has not seen it.
	 * @param change - The fields to change, or makes them from the call.
	 */
	updateToolData = (
		toolId: string,
		change: Partial<ToolData> | ((current: ToolData) => Partial<ToolData>),
	): void => {
		this.write((current) => {
			const data = current.tools[toolId];
			if (!data) {
				return {};
			}
			const changes =
				typeof change === "function" ? change(data) : change;
			const isChanged = (Object.keys(changes) as (keyof ToolData)[]).some(
				(field) => !Object.is(data[field], changes[field]),
			);
			if (!isChanged) {
				return {};
			}
			const next: ToolData = { ...data, ...changes };
			const isJsonStale =
				!("json" in changes) &&
				(next.part !== data.part ||
					next.isStreamingPlaceholder !==
						data.isStreamingPlaceholder ||
					next.streamingName !== data.streamingName);
			return {
				tools: {
					...current.tools,
					[toolId]: isJsonStale
						? {
								...next,
								json: toToolJson(
									next,
									this.room.chatTools.decorateToolCall,
								),
							}
						: next,
				},
			};
		});
	};

	/**
	 * Find a tool call by id.
	 *
	 * @param toolId - The tool call's id.
	 * @returns The call, or null when the room has not seen it.
	 */
	getTool = (toolId: string): ToolStore | null =>
		this.snapshot.tools[toolId] ? this.toolView(toolId) : null;

	/**
	 * The one view of a tool call the room holds.
	 *
	 * @param toolId - The call's id.
	 * @returns Its view.
	 */
	private toolView = (toolId: string): ToolStore => {
		let view = this.toolViews.get(toolId);
		if (!view) {
			view = new ToolStore(this.room, toolId);
			this.toolViews.set(toolId, view);
		}
		return view;
	};

	/**
	 * Save a tool call's result on the response that made it. Ignores a call
	 * that has already settled, and logs rather than throws a failed save.
	 *
	 * @param messageId - The response message's id.
	 * @param toolId - The tool call's id.
	 * @param toolResponse - What the tool returned.
	 * @param toolStatus - How the call ended.
	 * @param executedParameters - The parameters the tool ran with.
	 */
	processTool = async (
		messageId: string,
		toolId: string,
		toolResponse: string,
		toolStatus: ToolOutcome,
		executedParameters: Record<string, unknown>,
	): Promise<void> => {
		try {
			const message = this.getMessage(messageId);
			const tool = this.getTool(toolId);
			if (
				!(message instanceof ResponseMessageStore) ||
				!tool ||
				isToolSettled(tool.status)
			) {
				return;
			}
			await message.saveToolExecution(
				tool,
				toolResponse,
				toolStatus,
				executedParameters,
			);
		} catch (e) {
			console.error(e);
		}
	};

	// Messages

	/**
	 * Make a message from a pixel message, detached from the tree, and sync
	 * the tool calls it holds.
	 *
	 * @param pixelMessage - The backend's message, or a placeholder.
	 * @returns Its view.
	 */
	createMessage = (pixelMessage: PixelMessage): MessageView => {
		const data = toMessageData(pixelMessage, this.createMessageKey());
		this.addMessages([data], (messages) => addMessages(messages, [data]));
		return this.viewOf(data);
	};

	/**
	 * Replace the tree with one built from the backend's messages, below a
	 * new root, and sync their tool calls. What an earlier load made is
	 * deleted, with the tool calls only it held.
	 *
	 * @param pixelMessages - The backend's messages.
	 */
	load = (pixelMessages: readonly PixelMessage[]): void => {
		const root = createRootMessage(
			this.snapshot.model,
			this.createMessageKey(),
		);
		const tree = buildMessageTree(
			root,
			pixelMessages,
			this.createMessageKey,
		);
		this.write(() => ({ messages: tree.messages, rootKey: root.key }));
		for (const data of tree.created) {
			this.syncMessageTools(this.viewOf(data));
		}
		this.pruneDeleted((key) => !(key in tree.messages));
	};

	/**
	 * The one view of a message the room holds.
	 *
	 * @param key - The message's key.
	 * @returns Its view, or null when the room has no such message.
	 */
	getMessageByKey = (key: MessageKey): MessageView | null => {
		const data = this.snapshot.messages[key];
		return data ? this.viewOf(data) : null;
	};

	/**
	 * The views of some messages, the same array for the same keys array.
	 *
	 * @param keys - The messages' keys, such as a message's `childKeys`.
	 * @returns Their views, leaving out keys the room has no message for.
	 */
	getMessagesByKey = (
		keys: readonly MessageKey[],
	): readonly AbstractMessageStore[] => {
		let views = this.childViews.get(keys);
		if (!views) {
			views = keys.flatMap((key) => {
				const view = this.getMessageByKey(key);
				return view ? [view] : [];
			});
			this.childViews.set(keys, views);
		}
		return views;
	};

	/**
	 * Replace one message's data. Every other message keeps its entry, and the
	 * snapshot is kept when nothing changes.
	 *
	 * @param key - The message.
	 * @param change - Its next data; the same object changes nothing.
	 */
	updateMessageData = (
		key: MessageKey,
		change: (data: MessageData) => MessageData,
	): void => {
		this.setMessages((messages) => updateMessage(messages, key, change));
	};

	/**
	 * Replace one message's parts.
	 *
	 * @param key - The message.
	 * @param change - Its next parts; the same array changes nothing.
	 */
	updateMessageParts = <P extends MessageData["parts"]>(
		key: MessageKey,
		change: (parts: P) => P,
	): void => {
		this.setMessages((messages) => updateParts(messages, key, change));
	};

	/**
	 * Hang a message under another, as its active child.
	 *
	 * @param parentKey - The parent.
	 * @param childKey - The child.
	 */
	insertChildMessage = (
		parentKey: MessageKey,
		childKey: MessageKey,
	): void => {
		this.setMessages((messages) =>
			insertChild(messages, parentKey, childKey),
		);
	};

	/**
	 * Take a message from under its parent and delete it, everything below
	 * it, and the tool calls they made. Their views read as empty after.
	 *
	 * @param parentKey - The parent.
	 * @param childKey - The child; nothing happens when it is not one.
	 */
	removeChildMessage = (
		parentKey: MessageKey,
		childKey: MessageKey,
	): void => {
		const { messages, removed } = removeSubtree(
			this.snapshot.messages,
			parentKey,
			childKey,
		);
		if (removed.length > 0) {
			const gone = new Set(removed);
			this.pruneDeleted((key) => gone.has(key), messages);
		}
	};

	/**
	 * Choose which child of a message continues the conversation.
	 *
	 * @param parentKey - The parent.
	 * @param index - The child's index.
	 */
	setActiveChildMessage = (parentKey: MessageKey, index: number): void => {
		this.setMessages((messages) =>
			setActiveChild(messages, parentKey, index),
		);
	};

	/**
	 * Splice the backend's hidden input/response pairs into the tree in
	 * conversation order, under `parent`, so `tail` stays aligned with the
	 * backend's provider history.
	 *
	 * @param parent - The visible response the hidden pairs follow.
	 * @param extraMessages - The backend's hidden pairs, if any.
	 */
	spliceHiddenMessages = (
		parent: AbstractMessageStore,
		extraMessages: CancelCommitOutput["extraMessages"] | undefined,
	): void => {
		const pairs = (extraMessages ?? []).map((pair) =>
			this.toTurn(pair.inputMessage, pair.responseMessage),
		);
		this.addTurns(pairs, (messages) =>
			spliceHiddenMessages(messages, parent.key, pairs),
		);
	};

	/**
	 * Hang a compaction's summary turns below the response it compacted into,
	 * each as a branch of its own.
	 *
	 * @param parent - The response.
	 * @param turns - Each summary turn's input and response, from the backend.
	 */
	graftTurns = (
		parent: AbstractMessageStore,
		turns: readonly {
			inputMessage: InputPixelMessage | PixelMessage;
			responseMessage: ResponsePixelMessage | PixelMessage;
		}[],
	): void => {
		const data = turns.map((turn) =>
			this.toTurn(turn.inputMessage, turn.responseMessage),
		);
		this.addTurns(data, (messages) =>
			graftTurns(messages, parent.key, data),
		);
	};

	/**
	 * A turn's data from the backend's messages, each with a new key.
	 *
	 * @param input - The user's message.
	 * @param response - The response.
	 * @returns The turn, not in the map yet.
	 */
	private toTurn = (
		input: PixelMessage,
		response: PixelMessage,
	): MessageTurn => ({
		input: toMessageData(input, this.createMessageKey()),
		response: toMessageData(response, this.createMessageKey()),
	});

	/**
	 * Add turns to the tree, as `change` hangs them, and sync their tool calls.
	 *
	 * @param turns - The turns; none changes nothing.
	 * @param change - The next messages, with the turns in them.
	 */
	private addTurns = (
		turns: readonly MessageTurn[],
		change: (messages: MessageMap) => MessageMap,
	): void => {
		if (turns.length > 0) {
			this.addMessages(
				turns.flatMap(({ input, response }) => [input, response]),
				change,
			);
		}
	};

	/**
	 * Add messages, as `change` puts them in the map, and sync the tool calls
	 * each holds.
	 *
	 * @param added - The new messages.
	 * @param change - The next messages, with the new ones in them.
	 */
	private addMessages = (
		added: readonly MessageData[],
		change: (messages: MessageMap) => MessageMap,
	): void => {
		this.setMessages(change);
		for (const data of added) {
			this.syncMessageTools(this.viewOf(data));
		}
	};

	/**
	 * Replace the room's messages with what `change` makes of them.
	 *
	 * @param change - The next messages; the same map changes nothing.
	 */
	private setMessages = (change: (messages: MessageMap) => MessageMap) => {
		this.write((current) => ({ messages: change(current.messages) }));
	};

	/**
	 * Drop the tool calls of deleted messages, and the views of both, in one
	 * write with the messages that are left.
	 *
	 * @param isGone - Whether a message is deleted.
	 * @param messages - The messages left; the current ones by default.
	 */
	private pruneDeleted = (
		isGone: (key: MessageKey) => boolean,
		messages?: MessageMap,
	): void => {
		const { tools } = this.snapshot;
		const dropped = new Set(
			Object.keys(tools).filter((id) => {
				const { messageKey } = tools[id];
				return messageKey !== null && isGone(messageKey);
			}),
		);
		this.write((current) => ({
			messages: messages ?? current.messages,
			tools:
				dropped.size === 0
					? current.tools
					: Object.fromEntries(
							Object.entries(current.tools).filter(
								([id]) => !dropped.has(id),
							),
						),
		}));
		for (const key of [...this.messageViews.keys()]) {
			if (isGone(key)) {
				this.messageViews.delete(key);
			}
		}
		for (const id of dropped) {
			this.toolViews.delete(id);
		}
	};

	/**
	 * The one view of a message, made the first time it is asked for.
	 *
	 * @param data - The message's data.
	 * @returns Its view: an input message, or a response for a response and
	 * the root.
	 */
	private viewOf = (data: MessageData): MessageView => {
		let view = this.messageViews.get(data.key);
		if (!view) {
			view =
				data.type === "INPUT"
					? new InputMessageStore(this.room, data.key)
					: new ResponseMessageStore(this.room, data.key);
			this.messageViews.set(data.key, view);
		}
		return view;
	};

	/**
	 * A new message key, unique in the page.
	 *
	 * @returns The key.
	 */
	private createMessageKey = (): MessageKey => {
		messageKeyCount += 1;
		return `room-${this.snapshot.roomId}-${messageKeyCount}`;
	};
}
