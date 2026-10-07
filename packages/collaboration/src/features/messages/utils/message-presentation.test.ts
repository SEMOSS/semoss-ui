import type {
	ConversationMessage,
	ConversationMessagePart,
	ConversationToolStatus,
} from "../types/message";
import {
	completedToolGroups,
	messagePartBlocks,
	ownedMessageParts,
	presentMessages,
} from "./message-presentation";

function tool(
	id: string,
	status: ConversationToolStatus = "COMPLETED",
): ConversationMessagePart {
	return {
		type: "tool",
		tool: {
			id,
			parentMessageId: "parent",
			name: id,
			title: id,
			arguments: {},
			status,
		},
	};
}
function message(
	id: string,
	parts: ConversationMessagePart[],
): ConversationMessage {
	return { id, role: "assistant", createdAt: "2026-09-24T16:00:00Z", parts };
}

it("folds tool continuations across message boundaries without mutating their owners", () => {
	const first = message("first", [
		{ type: "text", text: "Searching" },
		tool("one"),
	]);
	const second = message("second", [tool("two")]);
	const entries = presentMessages([
		first,
		second,
		message("answer", [{ type: "text", text: "Answer" }]),
	]);
	expect(entries).toHaveLength(1);
	expect(entries[0].parts.map((item) => item.message.id)).toEqual([
		"first",
		"first",
		"second",
		"answer",
	]);
	expect(entries[0].parts[2].message).toBe(second);
	expect(first.parts).toHaveLength(2);
	expect(second.parts).toHaveLength(1);
	expect(
		messagePartBlocks(entries[0].parts).map((block) => block.type),
	).toEqual(["part", "tools", "part"]);
	expect(entries[0].createdAt).toBe(first.createdAt);
});

it("keeps text, thinking, media, user turns and delegation boundaries in order", () => {
	const parts = [
		tool("one"),
		{ type: "text", text: "Update" } as const,
		tool("two"),
		{ type: "thinking", text: "Reasoning" } as const,
		tool("three"),
		{ type: "media", fileName: "result.csv" } as const,
		tool("four"),
	];
	expect(
		messagePartBlocks(ownedMessageParts(message("parts", parts))).map(
			(block) => block.type,
		),
	).toEqual(["tools", "part", "tools", "part", "tools", "part", "tools"]);
	const user = {
		...message("user", [{ type: "text", text: "Next question" }]),
		role: "user" as const,
	};
	const delegation = {
		...message("delegation", []),
		delegationReply: {
			assignee: "Pat",
			outcome: "RESPONDED" as const,
			text: "Response",
		},
	};
	const entries = presentMessages([
		message("first", [tool("one")]),
		user,
		message("second", [tool("two")]),
		delegation,
		message("third", [tool("three")]),
	]);
	expect(entries).toHaveLength(5);
	expect(entries.map((entry) => entry.message.id)).toEqual([
		"first",
		"user",
		"second",
		"delegation",
		"third",
	]);
});

it("keeps cross-message tools together when their source later receives prose", () => {
	const first = message("first", [tool("one")]);
	const second = message("second", [tool("two")]);
	const before = presentMessages([first, second]);
	const after = presentMessages([
		first,
		{
			...second,
			parts: [
				...second.parts,
				{ type: "text", text: "Result" },
				tool("three"),
			],
		},
	]);
	expect(after[0].parts.slice(0, 2).map((part) => part.key)).toEqual(
		before[0].parts.map((part) => part.key),
	);
	expect(
		completedToolGroups(after[0].parts, new Set())[0].map(
			(part) => part.key,
		),
	).toEqual(["one", "two"]);
	expect(after).toHaveLength(1);
	expect(after[0].message.id).toBe("first");
	expect(after[0].parts.slice(2).map(({ part }) => part.type)).toEqual([
		"text",
		"tool",
	]);
});

it("omits empty and hidden activity but restores hidden tools requiring a decision", () => {
	const hidden = tool("hidden");
	if (hidden.type !== "tool") throw new Error("Expected tool");
	hidden.tool.metadata = { SMSS_MCP_UI: { displayLocation: "hidden" } };
	const source = message("tools", [tool("one"), hidden, tool("two")]);
	const entries = presentMessages([
		message("empty", [{ type: "thinking", text: "" }]),
		source,
	]);
	expect(entries).toHaveLength(1);
	expect(completedToolGroups(entries[0].parts, new Set())[0]).toHaveLength(2);
	const withApproval = presentMessages([source], {
		hidden: { ...hidden.tool, status: "INPUT_REQUIRED" },
	});
	expect(withApproval[0].parts).toHaveLength(3);
	expect(completedToolGroups(withApproval[0].parts, new Set())).toEqual([]);
});

it("groups finished neighbors while keeping inspected, active and decision tools separate", () => {
	const parts = ownedMessageParts(
		message("tools", [
			tool("one"),
			tool("two"),
			tool("first-failure", "FAILED"),
			tool("running", "RUNNING"),
			tool("failed", "FAILED"),
			tool("cancelled", "CANCELLED"),
			tool("rejected", "REJECTED"),
			tool("approval", "INPUT_REQUIRED"),
			tool("three"),
			tool("four"),
			tool("last-failure", "FAILED"),
		]),
	);
	expect(
		completedToolGroups(parts, new Set()).map((group) =>
			group.map((item) => item.key),
		),
	).toEqual([
		["one", "two", "first-failure"],
		["three", "four", "last-failure"],
	]);
	expect(
		completedToolGroups(parts, new Set(["three"])).map((group) =>
			group.map((item) => item.key),
		),
	).toEqual([
		["one", "two", "first-failure"],
		["four", "last-failure"],
	]);
});

it("keeps failures grouped across source messages and excludes hidden failures", () => {
	const hidden = tool("hidden-failure", "FAILED");
	if (hidden.type !== "tool") throw new Error("Expected tool");
	hidden.tool.metadata = { SMSS_MCP_UI: { displayLocation: "hidden" } };
	const entries = presentMessages([
		message("first", [tool("success"), hidden]),
		message("second", [tool("failure", "FAILED")]),
	]);
	expect(
		completedToolGroups(entries[0].parts, new Set())[0].map(
			({ key }) => key,
		),
	).toEqual(["success", "failure"]);
	expect(entries[0].parts[1].message.id).toBe("second");
});

it("starts a new response and date separator across local midnight", () => {
	const yesterday = new Date(2026, 8, 23, 23, 59).toISOString();
	const today = new Date(2026, 8, 24, 0, 1).toISOString();
	const entries = presentMessages([
		{ ...message("yesterday", [tool("one")]), createdAt: yesterday },
		{ ...message("today", [tool("two")]), createdAt: today },
		{
			...message("answer", [{ type: "text", text: "Done" }]),
			createdAt: today,
		},
	]);
	expect(entries).toHaveLength(2);
	expect(entries[0].dateSeparator).toBeUndefined();
	expect(entries[1].dateSeparator).toBe(today);
	expect(entries[1].parts.map(({ message }) => message.id)).toEqual([
		"today",
		"answer",
	]);
});

it("uses the first valid timestamp without replacing the response or source identities", () => {
	const first = {
		...message("first", [{ type: "text", text: "Start" }]),
		createdAt: "invalid",
	};
	const second = message("second", [
		{ type: "text", text: "More", renderKey: "stable-part" },
	]);
	const third = {
		...message("third", [{ type: "text", text: "Done" }]),
		createdAt: "2026-09-24T17:00:00Z",
	};
	const [entry] = presentMessages([first, second, third]);
	expect(entry.message).toBe(first);
	expect(entry.createdAt).toBe(second.createdAt);
	expect(entry.parts[1].key).toBe("stable-part");
	expect(entry.parts[1].message).toBe(second);
	expect(entry.parts[2].message.createdAt).toBe(third.createdAt);
});

it("keeps an empty user boundary even while suppressing its placeholder", () => {
	const entries = presentMessages([
		message("first", [{ type: "text", text: "First answer" }]),
		{ ...message("user", []), role: "user" },
		message("second", [{ type: "text", text: "Next answer" }]),
	]);
	expect(entries.map(({ message }) => message.id)).toEqual([
		"first",
		"second",
	]);
});

it("retains the response timestamp and identity when an initially empty source fills in", () => {
	const placeholder = message("first", []);
	const continuation = {
		...message("second", [
			{ type: "text", text: "Useful content", renderKey: "useful" },
		]),
		createdAt: "2026-09-24T16:01:00Z",
	};
	expect(presentMessages([placeholder])).toEqual([]);
	const [before] = presentMessages([placeholder, continuation]);
	const [after] = presentMessages([
		{ ...placeholder, parts: [{ type: "thinking", text: "Context" }] },
		continuation,
	]);
	expect(before.message.id).toBe("first");
	expect(after.message.id).toBe(before.message.id);
	expect(before.createdAt).toBe(placeholder.createdAt);
	expect(after.parts.at(-1)?.key).toBe(before.parts[0].key);
});
