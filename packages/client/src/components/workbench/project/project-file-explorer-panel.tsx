import { FolderTreeIcon, HammerIcon, PencilIcon } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	FileExplorer,
	type FileExplorerApi,
	FileExplorerHeader,
	type FileExplorerItemActions,
	type FileExplorerMovedItem,
	type FileItem,
	type FileMode,
	getParentPath,
	NewFileOverlay,
	useFileExplorer,
} from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { MCP } from "@/constants";
import {
	useProject,
	useWorkbench,
	useWorkbenchControl,
	useWorkbenchFilePanels,
} from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import { writeSpawnDragSpec } from "../core/workbench-spawn-drag";
import { FileExplorerControl } from "../file-explorer-control";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";

/** The config a project file-explorer instance is opened with. */
export interface ProjectFileExplorerConfig {
	/** Directory the tree opens at. */
	initialPath?: string;
	/** Forced browse-only mode, set by the read-only workbenches. */
	readOnly?: boolean;
}

/**
 * Whether a reported move was an in-place rename — same parent directory. A
 * rename of a file with no editor open should reveal it; a move should not.
 *
 * @param moved - One entry from an `onItemsMoved` batch.
 * @return True when the item stayed in its directory.
 */
const isRename = (moved: FileExplorerMovedItem) =>
	getParentPath(moved.oldPath) === getParentPath(moved.newPath);

/**
 * Project-scoped file explorer panel. The engine workbenches use
 * `EngineFileExplorerPanel`; this is its `APP`-mode twin, opening project files
 * into `PROJECT_FILE_EDITOR` / `PROJECT_MCP_EDITOR` panels and keeping open tabs
 * in sync as files are renamed, moved, or deleted. `initialPath` and a forced
 * `readOnly` come through the instance's config (set by view-only workbenches).
 *
 * Refresh and new-file live in the panel's chrome control, not the explorer
 * header — the panel publishes the explorer on its scratch `value` and
 * `FileExplorerControl` draws them there.
 */
export const ProjectFileExplorerPanel: WorkbenchComponent<
	ProjectFileExplorerConfig,
	FileExplorerApi
> = ({ id, config, setValue }) => {
	const { project, permission } = useProject();
	const insight = useInsight();
	// Only OWNER/EDIT users can mutate project assets; everyone else gets
	// browse/open/download behavior without create/delete actions.
	const isReadOnly =
		Boolean(config.readOnly) ||
		!(permission === "OWNER" || permission === "EDIT");

	const layoutActions = useWorkbench((s) => s.layout.actions);
	const mode = useMemo<FileMode>(
		() => ({ type: "APP", app: project.project_id }),
		[project.project_id],
	);
	const { migrateMovedTabs, removeDeletedTabs } =
		useWorkbenchFilePanels(mode);

	const openFile = useCallback(
		(item: FileItem) =>
			layoutActions.selectPanel(
				WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR,
				{ name: item.name, path: item.path },
				{ name: item.name },
			),
		[layoutActions],
	);

	const explorer = useFileExplorer({
		mode: mode,
		readOnly: isReadOnly,
		initialPath: config.initialPath,
		onItemSelect: openFile,
		onItemsMoved: (movedItems) => {
			const migrated = migrateMovedTabs(movedItems);

			// renaming a file that had no editor open reveals it, so the user
			// lands on what they just named
			if (
				!migrated &&
				movedItems.length === 1 &&
				isRename(movedItems[0])
			) {
				const newPath = movedItems[0].newPath;
				openFile({
					name: newPath.split("/").filter(Boolean).pop() ?? newPath,
					path: newPath,
				});
			}
		},
		onItemsDeleted: removeDeletedTabs,
		onItemDragStart: (e, items) => {
			// dropping a file on the dock opens its editor there; a directory
			// and a multi-item drag have no single panel to become
			if (items.length !== 1 || items[0].type === "directory") {
				return;
			}

			writeSpawnDragSpec(e.dataTransfer, {
				type: WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR,
				config: { name: items[0].name, path: items[0].path },
				name: items[0].name,
			});
		},
	});

	// publish the explorer for the panel's chrome control. `explorer` is
	// identity-stable, so this runs once; `setValue` is intentionally not a
	// dependency — it takes a new identity whenever the value it writes does,
	// which would loop.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => setValue(explorer), [explorer]);
	useWorkbenchControl(id, FileExplorerControl);

	const itemActions = useCallback(
		(item: FileItem): FileExplorerItemActions => {
			const isDirectory = item.type === "directory";
			const actions = [];

			if (
				!isDirectory &&
				!isReadOnly &&
				MCP.DRIVER_PATHS.some((f) => item.path === f)
			) {
				actions.push({
					name: "Create",
					icon: <HammerIcon />,
					tooltip: "Create Toolbox",
					action: async () => {
						try {
							await insight.actions.run(
								`MakePythonMCP(project=["${project.project_id}"]);`,
							);

							explorer.commands.refresh();
						} catch (e) {
							toast.error(`Error: ${e}`);
						}

						// open the editor for the created file (always, even if MakePythonMCP fails)
						layoutActions.selectPanel(
							WORKBENCH_COMPONENTS.PROJECT_MCP_EDITOR,
							{ name: "py_mcp.json", path: "/mcp/py_mcp.json" },
							{ name: "Toolbox Editor - py_mcp.json" },
						);
					},
				});
			}

			if (
				!isDirectory &&
				MCP.JSON_PATHS.some((f) => item.path.startsWith(f))
			) {
				actions.push({
					name: "Edit",
					icon: <PencilIcon />,
					tooltip: "Edit Toolbox",
					action: async (target: FileItem) => {
						layoutActions.selectPanel(
							WORKBENCH_COMPONENTS.PROJECT_MCP_EDITOR,
							{ name: target.name, path: target.path },
							{ name: `Toolbox Editor - ${target.name}` },
						);
					},
				});
			}

			return { actions: actions };
		},
		[
			explorer.commands,
			insight.actions,
			isReadOnly,
			layoutActions,
			project.project_id,
		],
	);

	return (
		<FileExplorer
			explorer={explorer}
			header={<FileExplorerHeader explorer={explorer} />}
			newFileOverlay={NewFileOverlay}
			itemActions={itemActions}
		/>
	);
};

/**
 * Blueprint for the project file explorer. keepAlive: the expanded tree and
 * current directory survive tab switches.
 */
export const PROJECT_FILE_EXPLORER_PANEL: WorkbenchPanelConfig<
	ProjectFileExplorerConfig,
	FileExplorerApi
> = {
	name: "Files",
	helpText: "File Explorer",
	icon: ({ className }) => <FolderTreeIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: ProjectFileExplorerPanel,
};
