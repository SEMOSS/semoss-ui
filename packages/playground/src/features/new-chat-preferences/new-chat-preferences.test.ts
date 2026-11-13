import { beforeEach, describe, expect, test } from "vitest";
import { withPlaygroundDefaults } from "@/stores/root/playground-theme";
import {
	forgetSessionNewChat,
	NEW_CHAT_PREFERENCE_KEYS,
	readDeploymentNewChatDefaults,
	readNewChatPreferences,
	readSessionNewChat,
	resolveNewChatAgentId,
	resolveNewChatMode,
	resolveNewChatModel,
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

describe("readDeploymentNewChatDefaults", () => {
	test("reads the theme's defaults for a new room", () => {
		const theme = withPlaygroundDefaults(null);

		expect(
			readDeploymentNewChatDefaults({
				...theme,
				defaultRoomSettings: {
					model: {
						engine_id: "model-a",
						engine_name: "A",
						engine_type: "MODEL",
					},
					mode: "agent",
					agentId: "agent-1",
				},
			}),
		).toEqual({ modelId: "model-a", mode: "agent", agentId: "agent-1" });
		expect(readDeploymentNewChatDefaults(theme)).toEqual(NONE);
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
	test("takes the session's, then the user's, then the deployment's, then chat", () => {
		expect(
			resolveNewChatMode(
				{ mode: "chat", agentId: "" },
				USER,
				DEPLOYMENT,
				true,
			),
		).toBe("chat");
		expect(resolveNewChatMode(null, USER, DEPLOYMENT, true)).toBe("agent");
		expect(
			resolveNewChatMode(null, NONE, { ...NONE, mode: "agent" }, true),
		).toBe("agent");
		expect(resolveNewChatMode(null, NONE, NONE, true)).toBe("chat");
	});

	test("is always chat where agent mode is not offered", () => {
		expect(
			resolveNewChatMode(
				{ mode: "agent", agentId: "" },
				USER,
				{ ...NONE, mode: "agent" },
				false,
			),
		).toBe("chat");
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
