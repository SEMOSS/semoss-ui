import { FolderTreeIcon, HammerIcon, PencilIcon } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
	useEngine,
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

/**
 * An in-place rename, as opposed to a move to another directory.
 *
 * @param moved - One entry from an `onItemsMoved` batch.
 * @return True when the item stayed in its directory.
 */
const isRename = (moved: FileExplorerMovedItem) =>
	getParentPath(moved.oldPath) === getParentPath(moved.newPath);

/**
 * Engine-scoped file explorer panel — the `ENGINE`-mode twin of
 * `ProjectFileExplorerPanel`, opening engine files into `FILE_EDITOR` /
 * `MCP_EDITOR` panels and keeping open tabs in sync as files move or vanish.
 *
 * Refresh and new-file live in the panel's chrome control, not the explorer
 * header — the panel publishes the explorer on its scratch `value` and
 * `FileExplorerControl` draws them there.
 */
export const EngineFileExplorerPanel: WorkbenchComponent<
	Record<string, unknown>,
	FileExplorerApi
> = ({ id, setValue }) => {
	const { engine, permission } = useEngine();
	// Only OWNER/EDIT users can mutate engine assets; READ_ONLY users get
	// browse/open/download behavior without create/delete actions.
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const insight = useInsight();
	const [searchParams, setSearchParams] = useSearchParams();

	const layoutActions = useWorkbench((s) => s.layout.actions);
	const mode = useMemo<FileMode>(
		() => ({ type: "ENGINE", engine: engine.engine_id }),
		[engine.engine_id],
	);
	const { migrateMovedTabs, removeDeletedTabs } =
		useWorkbenchFilePanels(mode);

	const openFile = useCallback(
		(item: FileItem) =>
			layoutActions.selectPanel(
				WORKBENCH_COMPONENTS.FILE_EDITOR,
				{ name: item.name, path: item.path },
				{ name: item.name },
			),
		[layoutActions],
	);

	const explorer = useFileExplorer({
		mode: mode,
		readOnly: readOnly,
		onItemSelect: openFile,
		onItemsMoved: (movedItems) => {
			const migrated = migrateMovedTabs(movedItems);

			// renaming a file that had no editor open reveals it
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
			if (items.length !== 1 || items[0].type === "directory") {
				return;
			}

			writeSpawnDragSpec(e.dataTransfer, {
				type: WORKBENCH_COMPONENTS.FILE_EDITOR,
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

	useEffect(() => {
		const mcpParam = searchParams.get("mcp");
		if (mcpParam === "Generate") {
			const mcpFilePath = "/mcp/pixel_mcp.json";
			layoutActions.selectPanel(
				WORKBENCH_COMPONENTS.MCP_EDITOR,
				{
					name: "pixel_mcp.json",
					path: mcpFilePath,
				},
				{ name: "Toolbox Editor - pixel_mcp.json" },
			);
			toast.success("MCP generated");
			searchParams.delete("mcp");
			setSearchParams(searchParams);
		}
	}, [searchParams, layoutActions, setSearchParams]);

	const itemActions = useCallback(
		(item: FileItem): FileExplorerItemActions => {
			const isDirectory = item.type === "directory";
			const actions = [];

			if (
				!isDirectory &&
				!readOnly &&
				MCP.DRIVER_PATHS.some((f) => item.path === f)
			) {
				actions.push({
					name: "Create",
					icon: <HammerIcon />,
					tooltip: "Create Toolbox",
					action: async () => {
						try {
							await insight.actions.run(
								`MakePythonMCP(engine=["${engine.engine_id}"]);`,
							);

							explorer.commands.refresh();
						} catch (e) {
							toast.error(`Error: ${e}`);
						}

						// open the editor for the created file (always, even if MakePythonMCP fails)
						layoutActions.selectPanel(
							WORKBENCH_COMPONENTS.MCP_EDITOR,
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
							WORKBENCH_COMPONENTS.MCP_EDITOR,
							{ name: target.name, path: target.path },
							{ name: `Toolbox Editor - ${target.name}` },
						);
					},
				});
			}

			return { actions: actions };
		},
		[
			engine.engine_id,
			explorer.commands,
			insight.actions,
			layoutActions,
			readOnly,
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
 * Blueprint for the engine file explorer. keepAlive: the expanded tree and
 * current directory survive tab switches.
 */
export const ENGINE_FILE_EXPLORER_PANEL: WorkbenchPanelConfig<
	Record<string, unknown>,
	FileExplorerApi
> = {
	name: "Files",
	helpText: "File Explorer",
	icon: ({ className }) => <FolderTreeIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: EngineFileExplorerPanel,
};
