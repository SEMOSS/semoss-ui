import { FolderTreeIcon, HammerIcon, PencilIcon } from "lucide-react";
import { useCallback } from "react";
import { download, useInsight } from "@semoss/sdk/react";
import {
	FileExplorer,
	FileExplorerItem,
	type FileExplorerMovedItem,
	type FileItem,
	getFileEditorPathScope,
	notifyFileEditorPathMoved,
} from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { MCP } from "@/constants";
import { useProject, useWorkbench } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
	WorkbenchPanelRecord,
} from "@/stores/workbench";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";
import type { ProjectFileEditorConfig } from "./project-file-editor-panel";

/** The config a project file-explorer instance is opened with. */
export interface ProjectFileExplorerConfig {
	/** Directory the tree opens at. */
	initialPath?: string;
	/** Forced browse-only mode, set by the read-only workbenches. */
	readOnly?: boolean;
}

/**
 * The explorer walks every open record, so what it finds on a heterogeneous
 * `config` is at best a partial editor config — hence the cast and `Partial`.
 */
type FilePanelConfig = Partial<ProjectFileEditorConfig>;

/** The file a panel is open for, if it is a file-backed panel at all. */
const filePathOf = (record: WorkbenchPanelRecord): string | undefined =>
	(record.config as FilePanelConfig | undefined)?.path;

/** Panels a path move or delete can affect. */
const hasFilePath = (record: WorkbenchPanelRecord): boolean =>
	Boolean(filePathOf(record));

/**
 * Project-scoped file explorer panel. The engine workbenches use
 * `EngineFileExplorerPanel`; this is its `APP`-mode twin, opening project files
 * into `PROJECT_FILE_EDITOR` / `PROJECT_MCP_EDITOR` panels and keeping open tabs
 * in sync as files are renamed, moved, or deleted. `initialPath` and a forced
 * `readOnly` come through the instance's config (set by view-only workbenches).
 */
export const ProjectFileExplorerPanel: WorkbenchComponent<
	ProjectFileExplorerConfig
> = ({ config }) => {
	const { project, permission } = useProject();
	const initialPath = config.initialPath;
	// Only OWNER/EDIT users can mutate project assets; everyone else gets
	// browse/open/download behavior without create/delete actions.
	const isReadOnly =
		Boolean(config.readOnly) ||
		!(permission === "OWNER" || permission === "EDIT");
	const insight = useInsight();

	const layoutActions = useWorkbench((s) => s.layout.actions);

	const getMovedPath = useCallback(
		(path: string, movedItem: FileExplorerMovedItem) => {
			const oldPathWithSlash = movedItem.oldPath.endsWith("/")
				? movedItem.oldPath
				: `${movedItem.oldPath}/`;
			const newPathWithSlash = movedItem.newPath.endsWith("/")
				? movedItem.newPath
				: `${movedItem.newPath}/`;

			if (path === movedItem.oldPath) {
				return movedItem.newPath;
			}

			if (
				movedItem.item.type === "directory" &&
				path.startsWith(oldPathWithSlash)
			) {
				return `${newPathWithSlash}${path.slice(oldPathWithSlash.length)}`;
			}

			return null;
		},
		[],
	);

	const updatePanelPath = useCallback(
		(record: WorkbenchPanelRecord, newPath: string) => {
			const newName = newPath.split("/").filter(Boolean).pop() ?? newPath;
			const oldPath = (record.config as FilePanelConfig | undefined)
				?.path;
			const scope = getFileEditorPathScope({
				type: "APP",
				app: project.project_id,
			});
			const displayName = record.name.endsWith("*")
				? `${newName}*`
				: newName;

			layoutActions.updatePanel(record.id, {
				name: displayName,
				config: {
					name: newName,
					path: newPath,
				},
			});

			if (oldPath) {
				notifyFileEditorPathMoved(oldPath, newPath, scope);
			}
		},
		[layoutActions, project.project_id],
	);

	const migrateMovedTabs = useCallback(
		(movedItems: FileExplorerMovedItem[]) => {
			let migrated = false;

			for (const record of layoutActions.findPanels(hasFilePath)) {
				const path = filePathOf(record);
				if (!path) {
					continue;
				}

				const movedPath = movedItems.reduce<string | null>(
					(currentPath, movedItem) => {
						if (!currentPath) return currentPath;
						return (
							getMovedPath(currentPath, movedItem) ?? currentPath
						);
					},
					path,
				);

				if (movedPath && movedPath !== path) {
					updatePanelPath(record, movedPath);
					migrated = true;
				}
			}

			return migrated;
		},
		[layoutActions, getMovedPath, updatePanelPath],
	);

	/** Close every file-backed panel at (or inside) a deleted path. */
	const removeDeletedTabs = useCallback(
		(path: string, isDirectory: boolean) => {
			const directoryPath = path.endsWith("/") ? path : `${path}/`;

			// the file itself, or anything under the deleted directory
			const doomed = layoutActions.findPanels((record) => {
				const recordPath = filePathOf(record);
				return (
					recordPath === path ||
					Boolean(
						isDirectory && recordPath?.startsWith(directoryPath),
					)
				);
			});

			for (const record of doomed) {
				layoutActions.closePanel(record.id);
			}
		},
		[layoutActions],
	);

	return (
		<FileExplorer
			readOnly={isReadOnly}
			initialPath={initialPath}
			mode={{
				type: "APP",
				app: project.project_id,
			}}
			onItemSelect={(item) => {
				// don't open directories
				if (item.type === "directory") {
					return;
				}

				// this will select if there or open if not
				layoutActions.selectPanel(
					WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR,
					{
						name: item.name,
						path: item.path,
					},
					{ name: item.name },
				);
			}}
			onItemsMoved={migrateMovedTabs}
			onItemsDeleted={(items) => {
				items.forEach((item) => {
					removeDeletedTabs(item.path, item.type === "directory");
				});
			}}
			ItemComponent={({ item, refresh, ...otherProps }) => {
				const isDriverFile =
					item.type !== "directory" &&
					MCP.DRIVER_PATHS.some((f) => item.path === f);
				const actions = [];

				if (isDriverFile && !isReadOnly) {
					actions.push({
						name: "Create",
						icon: <HammerIcon />,
						tooltip: "Create Toolbox",
						action: async () => {
							try {
								await insight.actions.run(
									`MakePythonMCP(project=["${project.project_id}"]);`,
								);

								// refresh the explorer
								refresh();
							} catch (e) {
								toast.error(`Error: ${e}`);
							}

							// open the editor for the created file (always, even if MakePythonMCP fails)
							layoutActions.selectPanel(
								WORKBENCH_COMPONENTS.PROJECT_MCP_EDITOR,
								{
									name: "py_mcp.json",
									path: "/mcp/py_mcp.json",
								},
								{ name: "Toolbox Editor - py_mcp.json" },
							);
						},
					});
				}

				if (
					MCP.JSON_PATHS.some((f) => item.path.startsWith(f)) &&
					item.type !== "directory"
				) {
					actions.push({
						name: "Edit",
						icon: <PencilIcon />,
						tooltip: "Edit Toolbox",
						action: async (item: FileItem) => {
							// this will select if there or open if not
							layoutActions.selectPanel(
								WORKBENCH_COMPONENTS.PROJECT_MCP_EDITOR,
								{
									name: item.name,
									path: item.path,
								},
								{ name: `Toolbox Editor - ${item.name}` },
							);
						},
					});
				}

				const secondaryActions = [
					{
						name: "Copy Path",
						action: async (item: FileItem) => {
							try {
								await navigator.clipboard.writeText(item.path);
							} catch (_e) {
								throw new Error("Failed to copy to clipboard");
							}
						},
					},
				];

				if (item.type !== "directory") {
					secondaryActions.push({
						name: "Download",
						action: async (item: FileItem) => {
							// save it
							const { pixelReturn } = await insight.actions.run<
								[string]
							>(
								`DownloadAppAsset(project=["${project.project_id}"], filePath=["${item.path}"]);`,
							);

							// get the file key
							const fileKey = pixelReturn[0].output;

							// download the file
							await download(insight.insightId, fileKey);

							refresh();
						},
					});
				}

				if (!isReadOnly) {
					secondaryActions.push({
						name: "Delete",
						action: async (item: FileItem) => {
							await insight.actions.run(
								`DeleteAppAssets(project=["${project.project_id}"], filePath=["${item.path}"]);`,
							);
							removeDeletedTabs(
								item.path,
								item.type === "directory",
							);
							refresh();
						},
					});
				}

				return (
					<FileExplorerItem
						item={item}
						refresh={refresh}
						onAfterRename={(oldPath, newPath) => {
							const migrated = migrateMovedTabs([
								{
									item,
									oldPath,
									newPath,
								},
							]);
							if (migrated) {
								return;
							}

							const newName =
								newPath.split("/").filter(Boolean).pop() ??
								newPath;
							layoutActions.selectPanel(
								WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR,
								{
									name: newName,
									path: newPath,
								},
								{ name: newName },
							);
						}}
						{...otherProps}
						actions={actions}
						secondaryActions={secondaryActions}
					/>
				);
			}}
		/>
	);
};

/**
 * Blueprint for the project file explorer. keepAlive: the expanded tree and
 * current directory survive tab switches.
 */
export const PROJECT_FILE_EXPLORER_PANEL: WorkbenchPanelConfig<ProjectFileExplorerConfig> =
	{
		name: "Files",
		helpText: "File Explorer",
		icon: ({ className }) => <FolderTreeIcon className={className} />,
		canClose: false,
		canRename: false,
		mount: "keepAlive",
		content: ProjectFileExplorerPanel,
	};
