import type { ReactNode } from "react";
import {
	FileExplorer,
	type FileExplorerApi,
	FileExplorerHeader,
	type FileExplorerItemActions,
	type FileItem,
	NewFileOverlay,
} from "@semoss/shared";
import type { WorkbenchPanelId } from "@semoss/workbench";
import { useExplorerPanelValue } from "./use-explorer-panel-value";

interface FileExplorerPaneProps {
	/** The panel instance, for the chrome control. */
	id: WorkbenchPanelId;
	/** The explorer to render. Decorated ones must be memoized. */
	explorer: FileExplorerApi;
	/** The panel's scratch-value setter. */
	setValue: (value: FileExplorerApi) => void;
	/** Per-row actions, e.g. the MCP toolbox glyphs. */
	itemActions?: (item: FileItem) => FileExplorerItemActions;
	/** Access chrome drawn over the tree while a permission refresh is in flight. */
	overlay?: ReactNode;
}

/**
 * The body every file-explorer panel renders.
 *
 * The three explorers differ in where their `mode` comes from — panel config,
 * the engine context, or a walk of the layout's selection history — and two of
 * those dictate where the hook may be called, so they stay separate panels.
 * What they share is everything below `useFileExplorer`: the same tree, the
 * same header with no actions (those live in the chrome control instead), the
 * same overlay, and the same publish-and-register pair.
 *
 * @param props - The explorer and its panel wiring.
 * @return The tree, its header, and any access chrome.
 */
export const FileExplorerPane = ({
	id,
	explorer,
	setValue,
	itemActions,
	overlay,
}: FileExplorerPaneProps) => {
	useExplorerPanelValue(id, explorer, setValue);

	return (
		<div className="relative size-full">
			<FileExplorer
				explorer={explorer}
				header={<FileExplorerHeader explorer={explorer} />}
				newFileOverlay={NewFileOverlay}
				itemActions={itemActions}
			/>
			{overlay}
		</div>
	);
};
