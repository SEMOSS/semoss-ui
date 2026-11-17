import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import type {
	AbstractPixelMessage,
	InputPixelMessage,
	PixelMessage,
	ResponsePixelMessage,
} from "../../../types";

/**
 * A message's client key: unique in its room, and kept for the message's life.
 * Not the backend's id, which placeholders share and which changes once the
 * backend assigns one.
 */
export type MessageKey = string;

/** The user's rating of a response. */
export interface ResponseFeedback {
	/** True for thumbs up, false for thumbs down. */
	readonly rating: boolean;
	/** A comment; unused for now. */
	readonly feedbackText: string;
}

/** What every message holds. Every field is readonly. */
interface BaseMessageData {
	/** The message's client key. */
	readonly key: MessageKey;
	/** The message's backend id, or a placeholder id until it has one. */
	readonly id: string;
	/** The message above it in the tree, or null for the root and a detached message. */
	readonly parentKey: MessageKey | null;
	/** The messages that answer it, each a branch of the conversation. */
	readonly childKeys: readonly MessageKey[];
	/** Which child continues the conversation; -1 when it has none. */
	readonly activeChildIndex: number;
	/** The tokens the message used, for its cost. */
	readonly tokens: number;
	/** The model that answered, or the one the message was sent to. */
	readonly modelId: string;
	/** That model's type. */
	readonly modelType: string;
	/** The agent run the message belongs to, if any. */
	readonly agentRun: AbstractPixelMessage["agentRun"] | undefined;
	/** Extra properties that are not essential. */
	readonly ornaments: AbstractPixelMessage["ornaments"];
	/** When the message was created, once the backend has said. */
	readonly dateCreated: Date | undefined;
	/** Whether the message is shown to the user. */
	readonly visible: boolean;
}

/** A message the user sent. */
export interface InputMessageData extends BaseMessageData {
	/** Tells an input message from a response. */
	readonly type: "INPUT";
	/** What the user sent: text, files, and the results of tool calls it answers. */
	readonly parts: InputPixelMessage["parts"];
}

/** A response from the model, or the hidden root every conversation hangs from. */
export interface ResponseMessageData extends BaseMessageData {
	/** Tells a response, or the root, from an input message. */
	readonly type: "OUTPUT" | "ROOT";
	/** What the model said: text, reasoning, tool calls, and subagents. */
	readonly parts: ResponsePixelMessage["parts"];
	/** Whether the model is still working on it. */
	readonly isThinking: boolean;
	/** The user's rating; only for messages the model wrote. */
	readonly feedback: ResponseFeedback | null;
	/** The model that wrote it. */
	readonly model: { readonly id: string; readonly name: string };
	/** Whether the conversation above it is compacted. */
	readonly conversationCompactedAbove: boolean;
	/** Whether its conversation is being compacted now. */
	readonly isCompacting: boolean;
}

/**
 * Shape returned by the cancel-commit pixels (AskPlayground /
 * AddPlaygroundToolExecution with `responseParts`): the visible pair plus any
 * hidden (invisible) input/response pairs the backend appended alongside it.
 */
export interface CancelCommitOutput {
	/** The user's message, as the backend saved it. */
	inputMessage: InputPixelMessage;
	/** The response, with the parts that streamed before the cancel. */
	responseMessage: ResponsePixelMessage;
	/** Hidden pairs, in conversation order after the visible one. */
	extraMessages: {
		inputMessage: InputPixelMessage;
		responseMessage: ResponsePixelMessage;
	}[];
}

/** One message of a room's conversation, as plain data. */
export type MessageData = InputMessageData | ResponseMessageData;

/** Every message of a room, by key. */
export type MessageMap = Readonly<Record<MessageKey, MessageData>>;

/**
 * The agent run a pixel message names, in either of its two forms.
 *
 * @param message - The pixel message.
 * @returns Its run, from `agentRun` or its ornaments, or undefined.
 */
const readAgentRun = (
	message: AbstractPixelMessage,
): AbstractPixelMessage["agentRun"] | undefined =>
	message.agentRun ??
	(message.ornaments?.agentRunId
		? {
				runId: message.ornaments.agentRunId,
				role: message.ornaments.agentRunRole,
			}
		: undefined);

/**
 * Take the backend's copy of a message: the one place a pixel message becomes
 * message data.
 *
 * @param data - The message as it is.
 * @param message - The backend's copy.
 * @returns The message with the backend's fields; its tree links are kept.
 */
export const syncMessageData = <D extends MessageData>(
	data: D,
	message: PixelMessage,
): D => {
	const common = {
		...data,
		id: message.messageId,
		parts: message.parts,
		tokens: message.tokens,
		dateCreated: parseTimestampWithUtcDefault(message.dateCreated).toDate(),
		agentRun: readAgentRun(message),
		ornaments: {
			modelName: message.ornaments?.modelName,
			routing: message.ornaments?.routing,
		},
	};
	if (data.type === "INPUT" || message.io !== "OUTPUT") {
		return common as D;
	}
	return {
		...common,
		model: {
			id: message.modelId,
			name: message.ornaments?.modelName || "AI",
		},
		feedback: message.feedback
			? {
					rating: message.feedback.rating,
					feedbackText: message.feedback.feedbackText,
				}
			: data.feedback,
	} as D;
};

/**
 * A message's data from a pixel message, detached from the tree.
 *
 * @param message - The pixel message.
 * @param key - Its client key.
 * @param isRoot - Whether it is the room's hidden root.
 * @returns The message's data.
 * @throws When the message is neither input nor output.
 */
export const toMessageData = (
	message: PixelMessage,
	key: MessageKey,
	isRoot = false,
): MessageData => {
	const base = {
		key,
		id: message.messageId,
		parentKey: null,
		childKeys: [],
		activeChildIndex: -1,
		tokens: message.tokens,
		modelId: message.modelId,
		modelType: message.modelType,
		agentRun: undefined,
		ornaments: message.ornaments,
		dateCreated: undefined,
		visible: message.visible,
	};
	if (message.io === "INPUT") {
		return syncMessageData<InputMessageData>(
			{ ...base, type: "INPUT", parts: [] },
			message,
		);
	}
	if (message.io === "OUTPUT") {
		return syncMessageData<ResponseMessageData>(
			{
				...base,
				type: isRoot ? "ROOT" : "OUTPUT",
				parts: [],
				isThinking: false,
				feedback: null,
				model: { id: "", name: "" },
				// a prune means the conversation above was compacted
				conversationCompactedAbove: !!message.pruneToolsAbove,
				isCompacting: false,
			},
			message,
		);
	}
	throw new Error(`Unknown message type: ${message}`);
};

/**
 * Change some fields of a message, keeping it when none would change.
 *
 * @param data - The message.
 * @param changes - The fields to change.
 * @returns The message, or a new one with the changes.
 */
export const mergeMessage = <D extends MessageData>(
	data: D,
	changes: Partial<D>,
): D =>
	(Object.keys(changes) as (keyof D)[]).some(
		(field) => !Object.is(data[field], changes[field]),
	)
		? { ...data, ...changes }
		: data;

/**
 * Replace one message with what `change` makes of it. Every other message
 * keeps its reference, and the map is kept when nothing changes.
 *
 * @param messages - The room's messages.
 * @param key - The message to change; nothing happens when it is missing.
 * @param change - The next value of the message.
 * @returns The messages.
 */
export const updateMessage = (
	messages: MessageMap,
	key: MessageKey,
	change: (data: MessageData) => MessageData,
): MessageMap => {
	const data = messages[key];
	if (!data) {
		return messages;
	}
	const next = change(data);
	return next === data ? messages : { ...messages, [key]: next };
};

/**
 * Replace a message's parts with what `change` makes of them.
 *
 * @param messages - The room's messages.
 * @param key - The message.
 * @param change - Its next parts, from its current ones; the same array
 * changes nothing.
 * @returns The messages.
 */
export const updateParts = <P extends MessageData["parts"]>(
	messages: MessageMap,
	key: MessageKey,
	change: (parts: P) => P,
): MessageMap =>
	updateMessage(messages, key, (data) =>
		mergeMessage(data, { parts: change(data.parts as P) } as Partial<
			typeof data
		>),
	);

/**
 * Add messages that are not in the map yet.
 *
 * @param messages - The room's messages.
 * @param added - The new messages.
 * @returns The messages with them.
 */
export const addMessages = (
	messages: MessageMap,
	added: readonly MessageData[],
): MessageMap =>
	added.length === 0
		? messages
		: {
				...messages,
				...Object.fromEntries(added.map((data) => [data.key, data])),
			};

/**
 * Hang a message under a parent, as its last child, and make it the active one.
 * A message that is already its child is only made active.
 *
 * @param messages - The room's messages.
 * @param parentKey - The parent.
 * @param childKey - The child.
 * @returns The messages, with the parent and the child replaced.
 */
export const insertChild = (
	messages: MessageMap,
	parentKey: MessageKey,
	childKey: MessageKey,
): MessageMap => {
	const parent = messages[parentKey];
	const child = messages[childKey];
	if (!parent || !child) {
		return messages;
	}
	const existing = parent.childKeys.indexOf(childKey);
	if (existing !== -1) {
		return setActiveChild(messages, parentKey, existing);
	}
	const childKeys = [...parent.childKeys, childKey];
	return {
		...messages,
		[parentKey]: {
			...parent,
			childKeys,
			activeChildIndex: childKeys.length - 1,
		},
		[childKey]: mergeMessage(child, { parentKey }),
	};
};

/**
 * Take a child from under its parent, keeping the active child where it was.
 * The child stays in the map, detached.
 *
 * @param messages - The room's messages.
 * @param parentKey - The parent.
 * @param childKey - The child; nothing happens when it is not one.
 * @returns The messages, with the parent and the child replaced.
 */
export const removeChild = (
	messages: MessageMap,
	parentKey: MessageKey,
	childKey: MessageKey,
): MessageMap => {
	const parent = messages[parentKey];
	const index = parent?.childKeys.indexOf(childKey) ?? -1;
	if (!parent || index === -1) {
		return messages;
	}
	const childKeys = parent.childKeys.filter((key) => key !== childKey);
	const { activeChildIndex } = parent;
	const child = messages[childKey];
	return {
		...messages,
		[parentKey]: {
			...parent,
			childKeys,
			activeChildIndex:
				activeChildIndex === index
					? childKeys.length
						? Math.min(index, childKeys.length - 1)
						: -1
					: activeChildIndex > index
						? activeChildIndex - 1
						: activeChildIndex,
		},
		...(child
			? { [childKey]: mergeMessage(child, { parentKey: null }) }
			: {}),
	};
};

/**
 * Choose which child continues the conversation.
 *
 * @param messages - The room's messages.
 * @param parentKey - The parent.
 * @param activeChildIndex - The child's index.
 * @returns The messages, with the parent replaced when it changed.
 */
export const setActiveChild = (
	messages: MessageMap,
	parentKey: MessageKey,
	activeChildIndex: number,
): MessageMap =>
	updateMessage(messages, parentKey, (data) =>
		mergeMessage(data, { activeChildIndex }),
	);

/**
 * Take a child from under its parent and delete it and every message below
 * it, so nothing detached is kept.
 *
 * @param messages - The room's messages.
 * @param parentKey - The parent.
 * @param childKey - The child; nothing happens when it is not one.
 * @returns The messages, and the keys of the messages deleted.
 */
export const removeSubtree = (
	messages: MessageMap,
	parentKey: MessageKey,
	childKey: MessageKey,
): { messages: MessageMap; removed: readonly MessageKey[] } => {
	const detached = removeChild(messages, parentKey, childKey);
	if (detached === messages) {
		return { messages, removed: [] };
	}
	const removed: MessageKey[] = [childKey];
	for (let index = 0; index < removed.length; index += 1) {
		removed.push(...(detached[removed[index]]?.childKeys ?? []));
	}
	const next: Record<MessageKey, MessageData> = { ...detached };
	for (const key of removed) {
		delete next[key];
	}
	return { messages: next, removed };
};

/**
 * What a view of a message reads once its entry is gone: an empty message,
 * detached from the tree.
 *
 * @param key - The message's key.
 * @param type - Whether the view is of an input message or a response.
 * @returns The empty data.
 */
export const emptyMessageData = (
	key: MessageKey,
	type: "INPUT" | "OUTPUT",
): MessageData => {
	const base = {
		key,
		id: "",
		parentKey: null,
		childKeys: [],
		activeChildIndex: -1,
		tokens: 0,
		modelId: "",
		modelType: "",
		agentRun: undefined,
		ornaments: {},
		dateCreated: undefined,
		visible: false,
		parts: [],
	};
	return type === "INPUT"
		? { ...base, type }
		: {
				...base,
				type,
				isThinking: false,
				feedback: null,
				model: { id: "", name: "" },
				conversationCompactedAbove: false,
				isCompacting: false,
			};
};

/** A user's message and the response to it, not in the map yet. */
export interface MessageTurn {
	/** The user's message. */
	readonly input: MessageData;
	/** The response to it. */
	readonly response: MessageData;
}

/**
 * Hang turns below a message, each as a branch of its own, the last one
 * active: a compaction adds one summary turn this way for each method that
 * worked.
 *
 * @param messages - The room's messages.
 * @param parentKey - The response the turns answer.
 * @param turns - The turns.
 * @returns The messages with the turns in the tree.
 */
export const graftTurns = (
	messages: MessageMap,
	parentKey: MessageKey,
	turns: readonly MessageTurn[],
): MessageMap =>
	turns.reduce((current, { input, response }) => {
		const next = insertChild(
			addMessages(current, [input, response]),
			input.key,
			response.key,
		);
		return insertChild(next, parentKey, input.key);
	}, messages);

/**
 * Splice the backend's hidden input and response pairs below a message, in
 * conversation order: each pair hangs from the response before it.
 *
 * @param messages - The room's messages.
 * @param parentKey - The visible response the hidden pairs follow.
 * @param pairs - The hidden pairs, not in the map yet.
 * @returns The messages with the pairs in the tree.
 */
export const spliceHiddenMessages = (
	messages: MessageMap,
	parentKey: MessageKey,
	pairs: readonly MessageTurn[],
): MessageMap =>
	pairs.reduce<{ messages: MessageMap; cursor: MessageKey }>(
		({ messages: current, cursor }, { input, response }) => {
			let next = addMessages(current, [input, response]);
			next = insertChild(next, cursor, input.key);
			next = insertChild(next, input.key, response.key);
			return { messages: next, cursor: response.key };
		},
		{ messages, cursor: parentKey },
	).messages;

/**
 * Build a room's tree from the backend's messages. A child can come before its
 * parent, so every message is made first and linked after. A message whose
 * parent is missing hangs from the message its compaction summarized, which
 * marks it as compacted above; with neither, from the root. Of two messages
 * with one id, the later is linked and the earlier left detached.
 *
 * @param root - The root, not linked to anything yet.
 * @param pixelMessages - The backend's messages, in its order.
 * @param createKey - Makes each message's client key.
 * @returns The messages, and the data made for each pixel message, in order.
 */
export const buildMessageTree = (
	root: MessageData,
	pixelMessages: readonly PixelMessage[],
	createKey: () => MessageKey,
): { messages: MessageMap; created: readonly MessageData[] } => {
	const created = pixelMessages.map((pixelMessage) =>
		toMessageData(pixelMessage, createKey()),
	);
	const byId: Record<
		string,
		{ parentId: string; summaryLeafId: string; key: MessageKey }
	> = {};
	created.forEach((data, index) => {
		const pixelMessage = pixelMessages[index];
		byId[data.id] = {
			parentId: pixelMessage.parentMessageId || "",
			summaryLeafId: pixelMessage.summaryLeafMessageId || "",
			key: data.key,
		};
	});

	let messages = addMessages({ [root.key]: root }, created);
	for (const entry of Object.values(byId)) {
		const parent = byId[entry.parentId];
		if (parent) {
			messages = insertChild(messages, parent.key, entry.key);
			continue;
		}
		// a message whose parent was compacted hangs from the summary's leaf
		const pseudoParent = byId[entry.summaryLeafId];
		if (pseudoParent) {
			messages = insertChild(messages, pseudoParent.key, entry.key);
			messages = updateMessage(messages, pseudoParent.key, (data) =>
				data.type === "INPUT"
					? data
					: mergeMessage(data, { conversationCompactedAbove: true }),
			);
			continue;
		}
		messages = insertChild(messages, root.key, entry.key);
	}
	return { messages, created };
};
