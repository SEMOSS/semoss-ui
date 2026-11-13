import type { ThemeMap } from "@semoss/shared";

/**
 * What a new chat starts with. The model, the mode, and the agent each follow
 * the same order, taking the first that is set:
 *
 * 1. what this login session last used (kept in memory while the page is
 *    open),
 * 2. the user's default (their metadata on the server, set in Settings),
 * 3. the deployment's default (the theme's `defaultRoomSettings`, then env),
 * 4. the first available: the first model, chat mode, and Default Agent.
 */

/** The user metadata keys the backend allows for the playground's defaults. */
export const NEW_CHAT_PREFERENCE_KEYS = {
	/** The engine id of the model a new chat starts with. */
	model: "playground--default-input-text-model",
	/** The mode a new chat starts in: `chat` or `agent`. */
	mode: "playground--default-chat-mode",
	/** The saved agent a new chat in agent mode starts with. */
	agent: "playground--default-chat-agent",
} as const;

/** The modes a chat runs in. */
export type NewChatMode = "chat" | "agent";

/** A set of defaults, the user's or the deployment's; null when unset. */
export interface NewChatPreferences {
	/** The default model's engine id. */
	modelId: string | null;
	/** The default mode. */
	mode: NewChatMode | null;
	/** The default saved agent's id. */
	agentId: string | null;
}

/** The chat last started in this login session. */
export interface SessionNewChat {
	/** The mode it ran in. */
	mode: NewChatMode;
	/** The saved agent it ran with; empty for none (Default Agent). */
	agentId: string;
}

/** The chat last started on this page, and the login it was started in. */
let sessionNewChat: (SessionNewChat & { login: string }) | null = null;

/**
 * Whether a value is a chat mode.
 *
 * @param value - The value to check.
 * @returns True for `chat` and `agent`.
 */
export const isNewChatMode = (value: unknown): value is NewChatMode =>
	value === "chat" || value === "agent";

/**
 * Read the user's defaults from their metadata.
 *
 * @param meta - The user's metadata, if they are signed in.
 * @returns Each default, null when it is not set or not valid.
 */
export const readNewChatPreferences = (
	meta: Record<string, string[]> | undefined,
): NewChatPreferences => {
	const first = (key: string): string | null => meta?.[key]?.[0] || null;
	const mode = first(NEW_CHAT_PREFERENCE_KEYS.mode);
	return {
		modelId: first(NEW_CHAT_PREFERENCE_KEYS.model),
		mode: isNewChatMode(mode) ? mode : null,
		agentId: first(NEW_CHAT_PREFERENCE_KEYS.agent),
	};
};

/**
 * Read the deployment's defaults: the playground theme's
 * `defaultRoomSettings`, then the build's env.
 *
 * @param theme - The playground theme.
 * @returns Each default, null when neither names one or it is not valid.
 */
export const readDeploymentNewChatDefaults = (
	theme: ThemeMap["playground"],
): NewChatPreferences => {
	const settings = theme.defaultRoomSettings;
	const mode = settings?.mode || import.meta.env.VITE_DEFAULT_CHAT_MODE;
	return {
		modelId:
			settings?.model?.engine_id ||
			import.meta.env.VITE_DEFAUlT_MODEL_ID ||
			null,
		mode: isNewChatMode(mode) ? mode : null,
		agentId:
			settings?.agentId ||
			import.meta.env.VITE_DEFAULT_CHAT_AGENT_ID ||
			null,
	};
};

/**
 * Read the chat last started in this login session. One started in another
 * login counts as none.
 *
 * @param lastLogin - The session user's last login, which names the session.
 * @returns The chat, or null when there is none.
 */
export const readSessionNewChat = (
	lastLogin: string | undefined,
): SessionNewChat | null => {
	if (!lastLogin || sessionNewChat?.login !== lastLogin) return null;
	return { mode: sessionNewChat.mode, agentId: sessionNewChat.agentId };
};

/**
 * Remember the chat just started, for the next new chat in this login
 * session.
 *
 * @param lastLogin - The session user's last login, which names the session.
 * @param chat - The chat started.
 */
export const writeSessionNewChat = (
	lastLogin: string | undefined,
	chat: SessionNewChat,
): void => {
	if (!lastLogin) return;
	sessionNewChat = {
		login: lastLogin,
		mode: chat.mode,
		agentId: chat.mode === "agent" ? chat.agentId : "",
	};
};

/** Forget the chat last started, as a fresh page would. */
export const forgetSessionNewChat = (): void => {
	sessionNewChat = null;
};

/**
 * The mode a new chat starts in: the session's last chat, then the user's
 * default, then the deployment's, then chat. Always chat where the deployment
 * offers no agent mode.
 *
 * @param session - The chat last started in this login session, if any.
 * @param preferences - The user's defaults.
 * @param deployment - The deployment's defaults.
 * @param offersAgentMode - Whether the deployment offers agent mode.
 * @returns The mode.
 */
export const resolveNewChatMode = (
	session: SessionNewChat | null,
	preferences: NewChatPreferences,
	deployment: NewChatPreferences,
	offersAgentMode: boolean,
): NewChatMode => {
	if (!offersAgentMode) return "chat";
	return session?.mode ?? preferences.mode ?? deployment.mode ?? "chat";
};

/**
 * The saved agent a new chat in agent mode starts with: the session's last
 * agent chat's (which may be none), then the user's default, then the
 * deployment's, then none, which runs Default Agent. Whether the user can
 * still open it is checked when it loads.
 *
 * @param session - The chat last started in this login session, if any.
 * @param preferences - The user's defaults.
 * @param deployment - The deployment's defaults.
 * @returns The agent's id, or empty for none.
 */
export const resolveNewChatAgentId = (
	session: SessionNewChat | null,
	preferences: NewChatPreferences,
	deployment: NewChatPreferences,
): string => {
	if (session?.mode === "agent") return session.agentId;
	return preferences.agentId ?? deployment.agentId ?? "";
};

/**
 * The model a new chat starts with, among the models the user can see: the
 * one selected in this login session, then the user's default, then the
 * deployment's, then the first.
 *
 * @param selectedId - The model selected in this login session, if any.
 * @param preferences - The user's defaults.
 * @param deployment - The deployment's defaults.
 * @param available - The models the user can see, in order.
 * @returns The model, or undefined when the user can see none.
 */
export const resolveNewChatModel = <M extends { engine_id: string }>(
	selectedId: string | null,
	preferences: NewChatPreferences,
	deployment: NewChatPreferences,
	available: readonly M[],
): M | undefined => {
	for (const id of [selectedId, preferences.modelId, deployment.modelId]) {
		const model = id
			? available.find((item) => item.engine_id === id)
			: undefined;
		if (model) return model;
	}
	return available[0];
};
