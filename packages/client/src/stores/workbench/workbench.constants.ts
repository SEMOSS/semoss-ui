import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { WorkbenchPanelRecord } from "@semoss/workbench";

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

/**
 * Shared panel instance records, keyed by role.
 *
 * A record is the *instance* a layout seeds (id, name, help text, capability
 * overrides); `WORKBENCH_COMPONENTS` above names the blueprint it points at.
 * Both live here so there is one constants file for the workbench, not two
 * files with the same name in two folders.
 */
export const WORKBENCH_PANEL_RECORDS = {
	AGENT_EDITOR: {
		id: WORKBENCH_COMPONENTS.AGENT_EDITOR,
		type: WORKBENCH_COMPONENTS.AGENT_EDITOR,
		name: "Agent",
		helpText: "Agent Editor",
		canClose: false,
	},
	ASSISTANT: {
		id: WORKBENCH_COMPONENTS.ASSISTANT,
		type: WORKBENCH_COMPONENTS.ASSISTANT,
		name: "Assistant",
		helpText: "Assistant",
		canClose: false,
		minWidth: 320,
	},
	FILE_EXPLORER: {
		id: WORKBENCH_COMPONENTS.FILE_EXPLORER,
		type: WORKBENCH_COMPONENTS.FILE_EXPLORER,
		name: "Files",
		helpText: "File Explorer",
		canClose: false,
	},
	GIT_VERSION: {
		id: WORKBENCH_COMPONENTS.GIT_VERSION,
		type: WORKBENCH_COMPONENTS.GIT_VERSION,
		name: "Version Control",
		helpText: "Version Control",
		canClose: false,
	},
	MODEL_CHAT: {
		id: WORKBENCH_COMPONENTS.MODEL_CHAT,
		type: WORKBENCH_COMPONENTS.MODEL_CHAT,
		name: "Chat",
		helpText: "Chat with this model",
		canClose: false,
	},
	MODEL_CHAT_SETTINGS: {
		id: WORKBENCH_COMPONENTS.MODEL_CHAT_SETTINGS,
		type: WORKBENCH_COMPONENTS.MODEL_CHAT_SETTINGS,
		name: "Model",
		helpText: "Model settings",
		canClose: false,
		minWidth: 300,
	},
	MODEL_CHAT_HISTORY: {
		id: WORKBENCH_COMPONENTS.MODEL_CHAT_HISTORY,
		type: WORKBENCH_COMPONENTS.MODEL_CHAT_HISTORY,
		name: "History",
		helpText: "Conversation history",
		canClose: false,
		minWidth: 280,
	},
	DATABASE_COLUMNS: {
		id: WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
		type: WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
		name: "Columns",
		helpText: "Database Structure",
		canClose: false,
	},
	STORAGE_EXPLORER: {
		id: WORKBENCH_COMPONENTS.STORAGE_EXPLORER,
		type: WORKBENCH_COMPONENTS.STORAGE_EXPLORER,
		name: "Storage",
		helpText: "Storage Explorer",
		canClose: false,
	},
	VECTOR_DOCUMENTS: {
		id: WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
		type: WORKBENCH_COMPONENTS.VECTOR_DOCUMENTS,
		name: "Documents",
		helpText: "Documents",
		canClose: false,
	},
	PROJECT_TERMINAL: {
		id: WORKBENCH_COMPONENTS.PROJECT_TERMINAL,
		type: WORKBENCH_COMPONENTS.PROJECT_TERMINAL,
		name: "Terminal",
		helpText: "Terminal",
		canClose: false,
	},
	PROJECT_ENGINES: {
		id: WORKBENCH_COMPONENTS.PROJECT_ENGINES,
		type: WORKBENCH_COMPONENTS.PROJECT_ENGINES,
		name: "Engines",
		helpText: "Available engines",
		canClose: false,
	},
	PROJECT_INSIGHT_EXPLORER: {
		id: WORKBENCH_COMPONENTS.PROJECT_INSIGHT_EXPLORER,
		type: WORKBENCH_COMPONENTS.PROJECT_INSIGHT_EXPLORER,
		name: "Insight",
		helpText: "Insight File Explorer",
		canClose: false,
	},
	PROJECT_APP_RENDERER: {
		id: WORKBENCH_COMPONENTS.PROJECT_APP_RENDERER,
		type: WORKBENCH_COMPONENTS.PROJECT_APP_RENDERER,
		name: "App",
		helpText: "App Preview",
		canClose: false,
	},
} as const satisfies Record<string, WorkbenchPanelRecord>;
