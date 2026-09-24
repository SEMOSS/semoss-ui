import { useEffect } from "react";
import {
	FileExplorer,
	type FileExplorerApi,
	FileExplorerHeader,
	type FileExplorerItemActions,
	type FileItem,
	NewFileOverlay,
} from "@semoss/shared";
import type { WorkbenchPanelId } from "@semoss/workbench";
import { useWorkbenchControl, useWorkbenchPanel } from "@semoss/workbench";
import { useFilesChanged } from "../../hooks/use-files-changed";
import type { FilePanelMode } from "../../types/file-panel.types";
import { FileExplorerControl } from "./file-explorer-control";

interface FileExplorerPaneProps {
	/** The panel instance this explorer belongs to. */
	id: WorkbenchPanelId;
	/** The explorer to render. Decorated ones must be memoized. */
	explorer: FileExplorerApi;
	/** Per-row actions, e.g. the MCP toolbox glyphs. */
	itemActions?: (item: FileItem) => FileExplorerItemActions;
}

/**
 * The body every file-explorer panel renders.
 *
 * The four explorers differ in where their `mode` comes from — panel config,
 * the engine context, the terminal's scope, or a walk of the layout's
 * selection history — and those dictate where the hook may be called, so they
 * stay separate panels. What they share is everything below `useFileExplorer`:
 * the same tree, the same header with no actions (those live in the chrome
 * control instead), the same overlay, and the same publish-and-register pair.
 *
 * Publishing is done here rather than by each panel: the api is identity-stable
 * by design and so is `setValue`, so the effect runs once, and the control
 * reads the api back off the panel's scratch value.
 *
 * @param props - The explorer and its panel wiring.
 * @return The tree and its header.
 */
export const FileExplorerPane = ({
	id,
	explorer,
	itemActions,
}: FileExplorerPaneProps) => {
	const { setValue } = useWorkbenchPanel<unknown, FileExplorerApi>(id);

	useEffect(() => setValue(explorer), [explorer, setValue]);
	useWorkbenchControl(id, FileExplorerControl);
	// The tree is stale the moment anything else writes a file in this scope.
	// Here rather than in each explorer panel: all four render this body.
	useFilesChanged({
		mode: explorer.mode as FilePanelMode,
		refresh: explorer.commands.refresh,
	});

	return (
		<div className="relative size-full">
			<FileExplorer
				explorer={explorer}
				header={<FileExplorerHeader explorer={explorer} />}
				newFileOverlay={NewFileOverlay}
				itemActions={itemActions}
			/>
		</div>
	);
};
