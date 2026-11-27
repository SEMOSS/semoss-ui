import {
	FileExplorer,
	type FileExplorerApi,
	FileExplorerHeader,
	type FileExplorerItemActions,
	type FileExplorerRoot,
	type FileExplorerRootsLayout,
	type FileItem,
	NewFileOverlay,
} from "@semoss/shared";
import type { WorkbenchPanelId } from "@semoss/workbench";
import {
	useWorkbenchControl,
	useWorkbenchEvent,
	useWorkbenchPanel,
} from "@semoss/workbench";
import {
	FILE_PANEL_EVENTS,
	type FilesChangedEvent,
} from "../../constants/file-panel.constants";
import { useFilesChanged } from "../../hooks/use-files-changed";
import {
	type FilePanelMode,
	getFilePanelScope,
} from "../../types/file-panel.types";
import { FileExplorerControl } from "./file-explorer-control";

interface FileExplorerPaneProps {
	/** The panel instance this explorer belongs to. */
	id: WorkbenchPanelId;
	/** The panel's own explorer. Decorated ones must be memoized. */
	explorer: FileExplorerApi;
	/** Per-row actions, e.g. the MCP toolbox glyphs. */
	itemActions?: (
		item: FileItem,
		root: FileExplorerRoot,
	) => FileExplorerItemActions;
	/** More trees under the panel's own, such as a host's folders. */
	roots?: readonly FileExplorerRoot[];
	/** The row over the panel's own tree, once there are more roots. */
	label?: string;
	layout?: FileExplorerRootsLayout;
	onLayoutChange?: (layout: FileExplorerRootsLayout) => void;
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
 * The panel publishes the explorer of the root the user is working in, so
 * the chrome control's New and Refresh act on it. Each api is identity-stable
 * by design, and so is `setValue`, so it publishes once per root change.
 *
 * @param props - The explorers and the panel wiring.
 * @return The trees and their header.
 */
export const FileExplorerPane = ({
	id,
	explorer,
	itemActions,
	roots = [],
	label = "",
	layout,
	onLayoutChange,
}: FileExplorerPaneProps) => {
	const { setValue } = useWorkbenchPanel<unknown, FileExplorerApi>(id);

	useWorkbenchControl(id, FileExplorerControl);
	// The tree is stale the moment anything else writes a file in this scope.
	// Here rather than in each explorer panel: all four render this body.
	useFilesChanged({
		mode: explorer.mode as FilePanelMode,
		refresh: explorer.commands.refresh,
	});
	// and so is a host's root, whose files the host may change itself
	useWorkbenchEvent<FilesChangedEvent>(
		FILE_PANEL_EVENTS.FILES_CHANGED,
		(changed) => {
			for (const root of roots) {
				if (
					getFilePanelScope(root.explorer.mode as FilePanelMode) ===
					changed.scope
				) {
					root.explorer.commands.refresh();
				}
			}
		},
	);

	return (
		<div className="relative size-full">
			<FileExplorer
				explorers={[{ id: "primary", name: label, explorer }, ...roots]}
				header={(active, place) => (
					<FileExplorerHeader explorer={active} place={place} />
				)}
				newFileOverlay={NewFileOverlay}
				itemActions={itemActions}
				layout={layout}
				onLayoutChange={onLayoutChange}
				onActiveRootChange={(_, active) => setValue(active)}
			/>
		</div>
	);
};
