import type { NewChatBuildDefaults } from "@semoss/chat";

/** The playground build's new-chat defaults, from its env. */
export const NEW_CHAT_BUILD_DEFAULTS: NewChatBuildDefaults = {
	modelId: import.meta.env.VITE_DEFAUlT_MODEL_ID,
	modelName: import.meta.env.VITE_DEFAUlT_MODEL_NAME,
	mode: import.meta.env.VITE_DEFAULT_CHAT_MODE,
	agentId: import.meta.env.VITE_DEFAULT_CHAT_AGENT_ID,
};
