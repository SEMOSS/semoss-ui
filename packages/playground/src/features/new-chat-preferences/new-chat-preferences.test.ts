import { beforeEach, describe, expect, test } from "vitest";
import {
	forgetSessionNewChat,
	NEW_CHAT_PREFERENCE_KEYS,
	readNewChatPreferences,
	readSessionNewChat,
	resolveNewChatAgentId,
	resolveNewChatMode,
	writeSessionNewChat,
} from "./new-chat-preferences";

const NONE = { modelId: null, mode: null, agentId: null };

beforeEach(() => {
	forgetSessionNewChat();
});

describe("readNewChatPreferences", () => {
	test("reads each default from the user's metadata", () => {
		expect(
			readNewChatPreferences({
				[NEW_CHAT_PREFERENCE_KEYS.model]: ["model-a"],
				[NEW_CHAT_PREFERENCE_KEYS.mode]: ["agent"],
				[NEW_CHAT_PREFERENCE_KEYS.agent]: ["agent-1"],
			}),
		).toEqual({ modelId: "model-a", mode: "agent", agentId: "agent-1" });
	});

	test("treats missing, empty, and unknown values as unset", () => {
		expect(readNewChatPreferences(undefined)).toEqual(NONE);
		expect(
			readNewChatPreferences({
				[NEW_CHAT_PREFERENCE_KEYS.model]: [],
				[NEW_CHAT_PREFERENCE_KEYS.mode]: ["sideways"],
				[NEW_CHAT_PREFERENCE_KEYS.agent]: [""],
			}),
		).toEqual(NONE);
	});
});

describe("session new chat", () => {
	test("reads back what was written for the same login", () => {
		writeSessionNewChat("login-1", { mode: "agent", agentId: "agent-1" });

		expect(readSessionNewChat("login-1")).toEqual({
			mode: "agent",
			agentId: "agent-1",
		});
	});

	test("forgets the agent of a chat-mode chat", () => {
		writeSessionNewChat("login-1", { mode: "chat", agentId: "agent-1" });

		expect(readSessionNewChat("login-1")).toEqual({
			mode: "chat",
			agentId: "",
		});
	});

	test("ignores another login's chat", () => {
		writeSessionNewChat("login-1", { mode: "agent", agentId: "agent-1" });

		expect(readSessionNewChat("login-2")).toBeNull();
		expect(readSessionNewChat(undefined)).toBeNull();
	});

	test("is none until a chat is started, and after it is forgotten", () => {
		expect(readSessionNewChat("login-1")).toBeNull();

		writeSessionNewChat("login-1", { mode: "agent", agentId: "agent-1" });
		forgetSessionNewChat();

		expect(readSessionNewChat("login-1")).toBeNull();
	});

	test("keeps only the last chat started", () => {
		writeSessionNewChat("login-1", { mode: "agent", agentId: "agent-1" });
		writeSessionNewChat("login-1", { mode: "agent", agentId: "agent-2" });

		expect(readSessionNewChat("login-1")).toEqual({
			mode: "agent",
			agentId: "agent-2",
		});
	});
});

describe("resolveNewChatMode", () => {
	test("prefers the session's chat, then the user's default, then chat", () => {
		const agentDefault = { ...NONE, mode: "agent" as const };

		expect(
			resolveNewChatMode(
				{ mode: "chat", agentId: "" },
				agentDefault,
				true,
			),
		).toBe("chat");
		expect(resolveNewChatMode(null, agentDefault, true)).toBe("agent");
		expect(resolveNewChatMode(null, NONE, true)).toBe("chat");
	});

	test("is always chat where agent mode is not offered", () => {
		expect(
			resolveNewChatMode(
				{ mode: "agent", agentId: "" },
				{ ...NONE, mode: "agent" },
				false,
			),
		).toBe("chat");
	});
});

describe("resolveNewChatAgentId", () => {
	const agentDefault = { ...NONE, agentId: "agent-1" };

	test("prefers the session's agent chat, even one with Default Agent", () => {
		expect(
			resolveNewChatAgentId(
				{ mode: "agent", agentId: "agent-2" },
				agentDefault,
			),
		).toBe("agent-2");
		expect(
			resolveNewChatAgentId({ mode: "agent", agentId: "" }, agentDefault),
		).toBe("");
	});

	test("falls back to the user's default, then Default Agent", () => {
		expect(
			resolveNewChatAgentId({ mode: "chat", agentId: "" }, agentDefault),
		).toBe("agent-1");
		expect(resolveNewChatAgentId(null, agentDefault)).toBe("agent-1");
		expect(resolveNewChatAgentId(null, NONE)).toBe("");
	});
});
