import {
	FILE_PANEL_COMPONENTS,
	FILE_PANEL_TYPES,
	FileExplorerHostProvider,
	getFilePanelType,
	isFilePanelType,
} from "@semoss/panels";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import type { ChatFilePanels } from "../host/chat-host-config";

/** `@semoss/panels`' file panels, as `ChatHostConfig.filePanels` takes them. */
export const CHAT_FILE_PANELS: ChatFilePanels = {
	explorerType: FILE_PANEL_TYPES.FILE_EXPLORER,
	getPanelType: getFilePanelType,
	isFilePanelType: isFilePanelType,
	ExplorerHostProvider: FileExplorerHostProvider,
};

/**
 * `@semoss/panels`' file panel blueprints for a room's Workspace: the file
 * explorer and editors, the explorer made closable, since a room's explorer
 * is one tab among the rest and closing the last tab is how the Workspace
 * closes. Spread into `ChatHostConfig.panelComponents`.
 */
export const CHAT_FILE_PANEL_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	...FILE_PANEL_COMPONENTS,
	[FILE_PANEL_TYPES.FILE_EXPLORER]: {
		...FILE_PANEL_COMPONENTS[FILE_PANEL_TYPES.FILE_EXPLORER],
		canClose: true,
	},
};
