import {
	WORKBENCH_COMPONENTS,
	type WorkbenchPanelRecord,
} from "@/stores/workbench";

export { WORKBENCH_COMPONENTS } from "@/stores/workbench";

/**
 * Shared panel-instance records seeded by the domain workbench layouts.
 * Static singletons keep `id === type` so persisted layouts, commands, and
 * the components map stay joined on the same `WORKBENCH_COMPONENTS` id.
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
	ENGINE_FILE_EXPLORER: {
		id: WORKBENCH_COMPONENTS.FILE_EXPLORER,
		type: WORKBENCH_COMPONENTS.FILE_EXPLORER,
		name: "Files",
		helpText: "File Explorer",
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
	ENGINE_SETTINGS: {
		id: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
		type: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
		name: "Settings",
		helpText: "Settings",
		canClose: true,
	},
	ENGINE_VERSION: {
		id: WORKBENCH_COMPONENTS.ENGINE_VERSION,
		type: WORKBENCH_COMPONENTS.ENGINE_VERSION,
		name: "Version Control",
		helpText: "Version Control",
		canClose: false,
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
	PROJECT_FILE_EXPLORER: {
		id: WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER,
		type: WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER,
		name: "Files",
		helpText: "File Explorer",
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
	PROJECT_VERSION: {
		id: WORKBENCH_COMPONENTS.PROJECT_VERSION,
		type: WORKBENCH_COMPONENTS.PROJECT_VERSION,
		name: "Version Control",
		helpText: "Version Control",
		canClose: false,
	},
	PROJECT_SETTINGS: {
		id: WORKBENCH_COMPONENTS.PROJECT_SETTINGS,
		type: WORKBENCH_COMPONENTS.PROJECT_SETTINGS,
		name: "Settings",
		helpText: "Settings",
		canClose: true,
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
