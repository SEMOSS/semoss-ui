import { expect, test } from "vitest";
import type {
	InputPixelMessage,
	PixelMessage,
	ResponsePixelMessage,
} from "../../../types";
import {
	buildMessageTree,
	emptyMessageData,
	graftTurns,
	insertChild,
	type MessageData,
	type MessageMap,
	mergeMessage,
	removeChild,
	removeSubtree,
	setActiveChild,
	spliceHiddenMessages,
	toMessageData,
	updateMessage,
	updateParts,
} from "./message-map";

/** The fields every stored message shares. */
const PIXEL = {
	visible: true,
	platform_generated: false,
	modelId: "model-1",
	modelType: "OPEN_AI",
	dateCreated: "2026-01-01 00:00:00",
	tokens: 0,
	ornaments: { modelName: "Model One" },
	pruneToolsAbove: false,
};

/**
 * A stored user message.
 *
 * @param messageId - Its id.
 * @param parentMessageId - The response it follows.
 * @returns The pixel message.
 */
const input = (messageId: string, parentMessageId = ""): InputPixelMessage => ({
	...PIXEL,
	io: "INPUT",
	type: "INPUT_TEXT",
	messageId,
	parentMessageId,
	parts: [{ type: "TEXT", text: messageId, uiText: messageId }],
});

/**
 * A stored response.
 *
 * @param messageId - Its id.
 * @param parentMessageId - The message it answers.
 * @param extra - Any other fields.
 * @returns The pixel message.
 */
const output = (
	messageId: string,
	parentMessageId = "",
	extra: Partial<ResponsePixelMessage> = {},
): ResponsePixelMessage => ({
	...PIXEL,
	io: "OUTPUT",
	messageId,
	parentMessageId,
	parts: [],
	...extra,
});

/**
 * A map of detached messages, each keyed by its id.
 *
 * @param messages - The pixel messages.
 * @returns The map.
 */
const mapOf = (...messages: PixelMessage[]): MessageMap =>
	Object.fromEntries(
		messages.map((message) => [
			message.messageId,
			toMessageData(message, message.messageId),
		]),
	);

test("a pixel message becomes detached, plain data", () => {
	const data = toMessageData(
		output("r1", "", {
			feedback: {
				rating: true,
				feedbackText: "",
				messageId: "r1",
				messageType: "RESPONSE_TEXT",
				feedbackDate: "",
			},
			pruneToolsAbove: true,
			ornaments: { modelName: "Model One", agentRunId: "run-1" },
		}),
		"key-1",
	);
	expect(data).toMatchObject({
		key: "key-1",
		id: "r1",
		type: "OUTPUT",
		parentKey: null,
		childKeys: [],
		activeChildIndex: -1,
		isThinking: false,
		// only the rating and its text are kept
		feedback: { rating: true, feedbackText: "" },
		model: { id: "model-1", name: "Model One" },
		conversationCompactedAbove: true,
		agentRun: { runId: "run-1" },
		ornaments: { modelName: "Model One" },
	});
	expect(data.dateCreated).toBeInstanceOf(Date);
	expect(toMessageData(output("root"), "root", true).type).toBe("ROOT");
	expect(toMessageData(input("i1"), "key-2").type).toBe("INPUT");
});

test("inserting a child replaces the parent and the child, and makes it active", () => {
	const before = mapOf(output("root"), input("a"), input("b"), input("c"));
	const once = insertChild(before, "root", "a");
	const after = insertChild(once, "root", "b");

	expect(after.root).toMatchObject({
		childKeys: ["a", "b"],
		activeChildIndex: 1,
	});
	expect(after.b.parentKey).toBe("root");
	// the rest keep their references, and the earlier map is untouched
	expect(after.a).toBe(once.a);
	expect(after.c).toBe(before.c);
	expect(before.root.childKeys).toEqual([]);

	// a child already there is only made active
	const again = insertChild(after, "root", "a");
	expect(again.root).toMatchObject({
		childKeys: ["a", "b"],
		activeChildIndex: 0,
	});
	// a missing message changes nothing
	expect(insertChild(after, "root", "missing")).toBe(after);
});

test("removing a child by key keeps the active child where it was", () => {
	let messages = mapOf(output("root"), input("a"), input("b"), input("c"));
	for (const key of ["a", "b", "c"]) {
		messages = insertChild(messages, "root", key);
	}
	messages = setActiveChild(messages, "root", 1);

	const removed = removeChild(messages, "root", "a");
	expect(removed.root).toMatchObject({
		childKeys: ["b", "c"],
		activeChildIndex: 0,
	});
	expect(removed.a.parentKey).toBeNull();
	// it stays in the map, detached
	expect(removed.a.id).toBe("a");
	expect(removed.c).toBe(messages.c);

	const activeRemoved = removeChild(removed, "root", "b");
	expect(activeRemoved.root).toMatchObject({
		childKeys: ["c"],
		activeChildIndex: 0,
	});
	expect(removeChild(activeRemoved, "root", "c").root.activeChildIndex).toBe(
		-1,
	);
	// a message that is not a child changes nothing
	expect(removeChild(removed, "root", "a")).toBe(removed);
});

test("removing a subtree deletes the child and everything below it", () => {
	let messages = mapOf(
		output("root"),
		input("a"),
		output("a-reply"),
		input("a-next"),
		input("b"),
	);
	messages = insertChild(messages, "root", "a");
	messages = insertChild(messages, "a", "a-reply");
	messages = insertChild(messages, "a-reply", "a-next");
	messages = insertChild(messages, "root", "b");

	const { messages: next, removed } = removeSubtree(messages, "root", "a");
	expect(removed).toEqual(["a", "a-reply", "a-next"]);
	expect(Object.keys(next).sort()).toEqual(["b", "root"]);
	expect(next.root).toMatchObject({ childKeys: ["b"], activeChildIndex: 0 });
	// the rest keeps its references, and the old map is untouched
	expect(next.b).toBe(messages.b);
	expect(messages.a.id).toBe("a");

	// a message that is not a child deletes nothing
	expect(removeSubtree(next, "root", "a")).toEqual({
		messages: next,
		removed: [],
	});
});

test("an empty message is detached and has nothing in it", () => {
	expect(emptyMessageData("k", "INPUT")).toMatchObject({
		key: "k",
		type: "INPUT",
		parentKey: null,
		childKeys: [],
		parts: [],
	});
	expect(emptyMessageData("k", "OUTPUT")).toMatchObject({
		type: "OUTPUT",
		isThinking: false,
		conversationCompactedAbove: false,
	});
});

test("grafted turns each hang from the response as their own branch", () => {
	const messages = mapOf(output("r1"));
	const turn = (id: string) => ({
		input: toMessageData(input(`${id}-in`), `${id}-in`),
		response: toMessageData(output(`${id}-out`), `${id}-out`),
	});
	const next = graftTurns(messages, "r1", [turn("a"), turn("b")]);
	expect(next.r1).toMatchObject({
		childKeys: ["a-in", "b-in"],
		activeChildIndex: 1,
	});
	expect(next["a-in"]).toMatchObject({
		parentKey: "r1",
		childKeys: ["a-out"],
	});
	expect(next["b-out"].parentKey).toBe("b-in");
	expect(graftTurns(messages, "r1", [])).toBe(messages);
});

test("setting the active child keeps the map when it is already active", () => {
	let messages = mapOf(output("root"), input("a"), input("b"));
	messages = insertChild(insertChild(messages, "root", "a"), "root", "b");
	expect(setActiveChild(messages, "root", 1)).toBe(messages);
	const switched = setActiveChild(messages, "root", 0);
	expect(switched.root.activeChildIndex).toBe(0);
	expect(switched.a).toBe(messages.a);
});

test("updating a message replaces its entry alone, and nothing for no change", () => {
	const messages = mapOf(output("r1"), output("r2"));
	const same = updateMessage(messages, "r1", (data) =>
		mergeMessage(data, { tokens: 0 }),
	);
	expect(same).toBe(messages);

	const next = updateMessage(messages, "r1", (data) =>
		mergeMessage(data, { tokens: 5 }),
	);
	expect(next.r1.tokens).toBe(5);
	expect(next.r2).toBe(messages.r2);
	expect(messages.r1.tokens).toBe(0);
	expect(updateMessage(messages, "missing", (data) => data)).toBe(messages);
});

test("updating parts keeps the message when the parts are the same array", () => {
	const messages = mapOf(output("r1"), output("r2"));
	expect(updateParts(messages, "r1", (parts) => parts)).toBe(messages);
	const next = updateParts<MessageData["parts"]>(
		messages,
		"r1",
		(parts) =>
			[
				...parts,
				{ type: "TEXT", text: "x", uiText: "x" },
			] as MessageData["parts"],
	);
	expect(next.r1.parts).toEqual([{ type: "TEXT", text: "x", uiText: "x" }]);
	expect(next.r2).toBe(messages.r2);
});

test("hidden pairs splice in below a response, each under the one before", () => {
	const messages = mapOf(output("r1"));
	const pair = (id: string) => ({
		input: toMessageData(input(`${id}-in`), `${id}-in`),
		response: toMessageData(output(`${id}-out`), `${id}-out`),
	});
	const next = spliceHiddenMessages(messages, "r1", [pair("a"), pair("b")]);
	expect(next.r1.childKeys).toEqual(["a-in"]);
	expect(next["a-in"].childKeys).toEqual(["a-out"]);
	expect(next["a-out"].childKeys).toEqual(["b-in"]);
	expect(next["b-in"].childKeys).toEqual(["b-out"]);
	expect(spliceHiddenMessages(messages, "r1", [])).toBe(messages);
});

test("a tree builds from pixel messages, children before their parents", () => {
	let count = 0;
	const root = toMessageData(output("root"), "root", true);
	const { messages, created } = buildMessageTree(
		root,
		[
			// the child comes before its parent
			output("r1", "i1"),
			input("i1", ""),
			// two answers to r1: the later is the active one
			input("i2a", "r1"),
			input("i2b", "r1"),
			// its parent was compacted away: it hangs from the summary's leaf
			{ ...input("i3", "gone"), summaryLeafMessageId: "r1" },
		],
		() => {
			count += 1;
			return `k${count}`;
		},
	);
	const byId = (id: string) =>
		created.find((data) => data.id === id) as MessageData;

	expect(created.map((data) => data.key)).toEqual([
		"k1",
		"k2",
		"k3",
		"k4",
		"k5",
	]);
	expect(messages.root.childKeys).toEqual([byId("i1").key]);
	expect(messages[byId("i1").key].childKeys).toEqual([byId("r1").key]);
	const r1 = messages[byId("r1").key];
	expect(r1.childKeys).toEqual([
		byId("i2a").key,
		byId("i2b").key,
		byId("i3").key,
	]);
	expect(r1.activeChildIndex).toBe(2);
	expect(r1).toMatchObject({ conversationCompactedAbove: true });
	expect(messages[byId("i3").key].parentKey).toBe(r1.key);
});
