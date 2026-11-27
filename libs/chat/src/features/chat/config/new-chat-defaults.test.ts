import { beforeEach, describe, expect, test } from "vitest";
import {
	forgetSessionNewChat,
	NEW_CHAT_DEFAULT_KEYS,
	readDeploymentNewChatDefaults,
	readSessionNewChat,
	readUserNewChatDefaults,
	resolveNewChatAgentId,
	resolveNewChatMode,
	resolveNewChatModel,
	writeSessionNewChat,
} from "./new-chat-defaults";

const NONE = { modelId: null, mode: null, agentId: null };

beforeEach(() => {
	forgetSessionNewChat();
});

describe("readUserNewChatDefaults", () => {
	test("reads each default from the user's metadata", () => {
		expect(
			readUserNewChatDefaults({
				[NEW_CHAT_DEFAULT_KEYS.model]: ["model-a"],
				[NEW_CHAT_DEFAULT_KEYS.mode]: ["agent"],
				[NEW_CHAT_DEFAULT_KEYS.agent]: ["agent-1"],
			}),
		).toEqual({ modelId: "model-a", mode: "agent", agentId: "agent-1" });
	});

	test("treats missing, empty, and unknown values as unset", () => {
		expect(readUserNewChatDefaults(undefined)).toEqual(NONE);
		expect(
			readUserNewChatDefaults({
				[NEW_CHAT_DEFAULT_KEYS.model]: [],
				[NEW_CHAT_DEFAULT_KEYS.mode]: ["sideways"],
				[NEW_CHAT_DEFAULT_KEYS.agent]: [""],
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

describe("readDeploymentNewChatDefaults", () => {
	test("reads the host's defaults for a new room", () => {
		expect(
			readDeploymentNewChatDefaults({
				modelId: "model-a",
				mode: "agent",
				agentId: "agent-1",
			}),
		).toEqual({ modelId: "model-a", mode: "agent", agentId: "agent-1" });
		expect(readDeploymentNewChatDefaults({})).toEqual(NONE);
	});

	test("ignores a mode that is not chat or agent", () => {
		expect(readDeploymentNewChatDefaults({ mode: "sideways" })).toEqual(
			NONE,
		);
	});
});

// Each follows the same order: session, user, deployment, first available
const USER = { modelId: "model-b", mode: "agent" as const, agentId: "agent-b" };
const DEPLOYMENT = {
	modelId: "model-c",
	mode: "chat" as const,
	agentId: "agent-c",
};

describe("resolveNewChatModel", () => {
	const models = ["model-a", "model-b", "model-c", "model-d"].map(
		(engine_id) => ({ engine_id }),
	);

	test("takes the session's, then the user's, then the deployment's, then the first", () => {
		const pick = (
			selected: string | null,
			user: typeof NONE | typeof USER,
			deployment: typeof NONE | typeof DEPLOYMENT,
		) => resolveNewChatModel(selected, user, deployment, models)?.engine_id;

		expect(pick("model-d", USER, DEPLOYMENT)).toBe("model-d");
		expect(pick(null, USER, DEPLOYMENT)).toBe("model-b");
		expect(pick(null, NONE, DEPLOYMENT)).toBe("model-c");
		expect(pick(null, NONE, NONE)).toBe("model-a");
	});

	test("skips a model the user cannot see", () => {
		expect(
			resolveNewChatModel(
				"gone",
				{ ...NONE, modelId: "also-gone" },
				DEPLOYMENT,
				models,
			)?.engine_id,
		).toBe("model-c");
		expect(resolveNewChatModel(null, USER, DEPLOYMENT, [])).toBeUndefined();
	});
});

describe("resolveNewChatMode", () => {
	const BOTH = ["chat", "agent"] as const;

	test("takes the session's, then the user's, then the deployment's, then chat", () => {
		expect(
			resolveNewChatMode(
				{ mode: "chat", agentId: "" },
				USER,
				DEPLOYMENT,
				BOTH,
			),
		).toBe("chat");
		expect(resolveNewChatMode(null, USER, DEPLOYMENT, BOTH)).toBe("agent");
		expect(
			resolveNewChatMode(null, NONE, { ...NONE, mode: "agent" }, BOTH),
		).toBe("agent");
		expect(resolveNewChatMode(null, NONE, NONE, BOTH)).toBe("chat");
	});

	test("is always chat where agent mode is not offered", () => {
		expect(
			resolveNewChatMode(
				{ mode: "agent", agentId: "" },
				USER,
				{ ...NONE, mode: "agent" },
				["chat"],
			),
		).toBe("chat");
	});

	test("is always agent where every chat runs in agent mode", () => {
		expect(
			resolveNewChatMode(
				{ mode: "chat", agentId: "" },
				{ ...NONE, mode: "chat" },
				{ ...NONE, mode: "chat" },
				["agent"],
			),
		).toBe("agent");
		expect(resolveNewChatMode(null, NONE, NONE, ["agent"])).toBe("agent");
	});
});

describe("resolveNewChatAgentId", () => {
	test("takes the session's agent chat, even one with Default Agent", () => {
		expect(
			resolveNewChatAgentId(
				{ mode: "agent", agentId: "agent-a" },
				USER,
				DEPLOYMENT,
			),
		).toBe("agent-a");
		expect(
			resolveNewChatAgentId(
				{ mode: "agent", agentId: "" },
				USER,
				DEPLOYMENT,
			),
		).toBe("");
	});

	test("then the user's, then the deployment's, then Default Agent", () => {
		expect(
			resolveNewChatAgentId(
				{ mode: "chat", agentId: "" },
				USER,
				DEPLOYMENT,
			),
		).toBe("agent-b");
		expect(resolveNewChatAgentId(null, NONE, DEPLOYMENT)).toBe("agent-c");
		expect(resolveNewChatAgentId(null, NONE, NONE)).toBe("");
	});
});
