import { FILE_PANEL_TYPES } from "@semoss/panels";

/**
 * Component IDs shared by workbench state, commands, and renderers.
 *
 * The file panel ids live in `@semoss/panels` and are spread in, so every
 * existing `WORKBENCH_COMPONENTS.FILE_*` reference keeps resolving.
 */
export const WORKBENCH_COMPONENTS = {
	...FILE_PANEL_TYPES,
	AGENT_EDITOR: "project-agent-editor",
	ASSISTANT: "workbench-assistant",
	DATABASE_COLUMNS: "database-columns",
	DATABASE_QUERY: "database-query",
	DATABASE_RESULTS: "database-results",
	VECTOR_DOCUMENTS: "vector-documents",
	STORAGE_EXPLORER: "storage-file-explorer",
	MODEL_CHAT: "model-chat",
	MODEL_CHAT_SETTINGS: "model-chat-settings",
	MODEL_CHAT_HISTORY: "model-chat-history",
	ENGINE_SETTINGS: "engine-settings",
	GIT_VERSION: "git-version",
	GIT_DIFF: "git-diff",
	PROJECT_TERMINAL: "project-terminal",
	PROJECT_SETTINGS: "project-settings",
	PROJECT_INSIGHT_EXPLORER: "project-insight-explorer",
	PROJECT_APP_RENDERER: "project-app-renderer",
	PROJECT_ENGINES: "project-engines",
} as const;
