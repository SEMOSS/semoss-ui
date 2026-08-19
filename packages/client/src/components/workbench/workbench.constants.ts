import { WORKBENCH_COMPONENTS } from "@/stores/workbench";

export { WORKBENCH_COMPONENTS } from "@/stores/workbench";

/** Shared tab payloads for common workbench panels. */
export const WORKBENCH_PANEL_TABS = {
	ENGINE_SETTINGS: {
		type: "tab",
		id: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
		name: "Settings",
		component: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
		enableClose: true,
	},
	PROJECT_FILE_EXPLORER: {
		type: "tab",
		id: WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER,
		name: "Files",
		component: WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER,
		config: {},
		helpText: "File Explorer",
		enableClose: false,
	},
	PROJECT_TERMINAL: {
		type: "tab",
		id: WORKBENCH_COMPONENTS.PROJECT_TERMINAL,
		name: "Terminal",
		component: WORKBENCH_COMPONENTS.PROJECT_TERMINAL,
		config: {},
		helpText: "Terminal",
		enableClose: false,
	},
	PROJECT_ENGINES: {
		type: "tab",
		id: WORKBENCH_COMPONENTS.PROJECT_ENGINES,
		name: "Engines",
		component: WORKBENCH_COMPONENTS.PROJECT_ENGINES,
		config: {},
		helpText: "Available engines",
		enableClose: false,
	},
	PROJECT_SETTINGS: {
		type: "tab",
		id: WORKBENCH_COMPONENTS.PROJECT_SETTINGS,
		name: "Settings",
		component: WORKBENCH_COMPONENTS.PROJECT_SETTINGS,
		enableClose: true,
	},
	PROJECT_INSIGHT_EXPLORER: {
		type: "tab",
		id: WORKBENCH_COMPONENTS.PROJECT_INSIGHT_EXPLORER,
		name: "Insight",
		component: WORKBENCH_COMPONENTS.PROJECT_INSIGHT_EXPLORER,
		config: {},
		helpText: "Insight File Explorer",
		enableClose: false,
	},
	PROJECT_APP_RENDERER: {
		type: "tab",
		id: WORKBENCH_COMPONENTS.PROJECT_APP_RENDERER,
		name: "App",
		component: WORKBENCH_COMPONENTS.PROJECT_APP_RENDERER,
		config: {},
		helpText: "App Preview",
		enableClose: false,
	},
	PROJECT_AGENT_EDITOR: {
		type: "tab",
		id: WORKBENCH_COMPONENTS.PROJECT_AGENT_EDITOR,
		name: "Agent",
		component: WORKBENCH_COMPONENTS.PROJECT_AGENT_EDITOR,
		config: {},
		helpText: "Agent Editor",
		enableClose: false,
	},
} as const;
