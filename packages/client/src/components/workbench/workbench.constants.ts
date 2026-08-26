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
	ENGINE_SETTINGS: {
		id: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
		type: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
		name: "Settings",
		helpText: "Settings",
		canClose: true,
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
	PROJECT_AGENT_EDITOR: {
		id: WORKBENCH_COMPONENTS.PROJECT_AGENT_EDITOR,
		type: WORKBENCH_COMPONENTS.PROJECT_AGENT_EDITOR,
		name: "Agent",
		helpText: "Agent Editor",
		canClose: false,
	},
} as const satisfies Record<string, WorkbenchPanelRecord>;
