import { WORKBENCH_COMPONENTS } from "@/stores/workbench";

export { WORKBENCH_COMPONENTS } from "@/stores/workbench";

/** Shared tab payloads for common workbench panels. */
export const WORKBENCH_PANEL_TABS = {
	FILE_EXPLORER: {
		type: "tab",
		id: WORKBENCH_COMPONENTS.FILE_EXPLORER,
		name: "Files",
		component: WORKBENCH_COMPONENTS.FILE_EXPLORER,
		config: {},
		helpText: "File Explorer",
		enableClose: false,
	},
	ENGINE_SETTINGS: {
		type: "tab",
		id: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
		name: "Settings",
		component: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
		enableClose: true,
	},
} as const;
