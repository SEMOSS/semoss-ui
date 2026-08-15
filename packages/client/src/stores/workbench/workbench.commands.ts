import {
	createElement,
	FolderTreeIcon,
	RefreshCwIcon,
	SettingsIcon,
	XIcon,
} from "lucide-react";
import type { FlexLayout } from "@semoss/shared";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_TABS,
} from "./workbench.constants";
import type {
	WorkbenchActionsSliceInterface,
	WorkbenchCommand,
} from "./workbench.types";

export interface WorkbenchCommandHandlers {
	openPanel: WorkbenchActionsSliceInterface["openPanel"];
	closePanel: WorkbenchActionsSliceInterface["closePanel"];
	openFile: WorkbenchActionsSliceInterface["openFile"];
	closeFile: WorkbenchActionsSliceInterface["closeFile"];
	refreshFileExplorer: WorkbenchActionsSliceInterface["refreshFileExplorer"];
}

interface WorkbenchCommandCollection {
	globalCommands?: (handlers: WorkbenchCommandHandlers) => WorkbenchCommand[];
	staticCommands?: (handlers: WorkbenchCommandHandlers) => WorkbenchCommand[];
	activeCommands?: (
		node: FlexLayout.TabNode,
		handlers: WorkbenchCommandHandlers,
	) => WorkbenchCommand[];
}

/** Shared commands exposed by engine workbench panels. */
export const WORKBENCH_COMMANDS: Record<
	"FILE_EXPLORER" | "FILE_EDITOR" | "MCP_EDITOR" | "ENGINE_SETTINGS",
	WorkbenchCommandCollection
> = {
	FILE_EXPLORER: {
		globalCommands: ({ openPanel }) => [
			{
				id: "workbench.file-explorer.open",
				label: "Open File Explorer",
				scope: "WORKSPACE",
				icon: createElement(FolderTreeIcon, { className: "size-4" }),
				handler: async () => {
					openPanel({
						componentId: WORKBENCH_COMPONENTS.FILE_EXPLORER,
						tab: WORKBENCH_PANEL_TABS.FILE_EXPLORER,
						target: { type: "BORDER", location: "left" },
					});
				},
			},
		],
		staticCommands: ({ refreshFileExplorer }) => [
			{
				id: "workbench.file-explorer.refresh",
				label: "Refresh File Explorer",
				scope: "PANEL",
				icon: createElement(RefreshCwIcon, { className: "size-4" }),
				handler: async () => {
					refreshFileExplorer(WORKBENCH_COMPONENTS.FILE_EXPLORER);
				},
			},
		],
		activeCommands: (node, { closePanel }) => [
			{
				id: "workbench.file-explorer.close",
				label: "Close File Explorer",
				scope: "SELECTED_PANEL",
				nodeId: node.getId(),
				icon: createElement(XIcon, { className: "size-4" }),
				handler: async () => {
					closePanel({
						componentId: WORKBENCH_COMPONENTS.FILE_EXPLORER,
						nodeId: node.getId(),
					});
				},
			},
		],
	},
	FILE_EDITOR: {
		activeCommands: (node, { closeFile }) => [
			{
				id: "workbench.file.close",
				label: "Close File",
				scope: "SELECTED_PANEL",
				nodeId: node.getId(),
				icon: createElement(XIcon, { className: "size-4" }),
				handler: async () => {
					closeFile({ fileId: node.getId() });
				},
			},
		],
	},
	MCP_EDITOR: {
		activeCommands: (node, { closeFile }) => [
			{
				id: "workbench.mcp-editor.close",
				label: "Close Toolbox Editor",
				scope: "SELECTED_PANEL",
				nodeId: node.getId(),
				icon: createElement(XIcon, { className: "size-4" }),
				handler: async () => {
					closeFile({ fileId: node.getId() });
				},
			},
		],
	},
	ENGINE_SETTINGS: {
		globalCommands: ({ openPanel }) => [
			{
				id: "workbench.settings.open",
				label: "Open Settings",
				scope: "WORKSPACE",
				icon: createElement(SettingsIcon, { className: "size-4" }),
				handler: async () => {
					openPanel({
						componentId: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
						tab: WORKBENCH_PANEL_TABS.ENGINE_SETTINGS,
						target: { type: "MAIN" },
					});
				},
			},
		],
		activeCommands: (node, { closePanel }) => [
			{
				id: "workbench.settings.close",
				label: "Close Settings",
				scope: "SELECTED_PANEL",
				nodeId: node.getId(),
				icon: createElement(XIcon, { className: "size-4" }),
				handler: async () => {
					closePanel({
						componentId: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
						nodeId: node.getId(),
					});
				},
			},
		],
	},
};
