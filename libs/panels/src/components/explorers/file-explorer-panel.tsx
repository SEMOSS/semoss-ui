import { FolderTreeIcon, HammerIcon, PencilIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	type FileExplorerApi,
	type FileExplorerItemActions,
	type FileExplorerMovedItem,
	type FileItem,
	getFileExplorerAdapter,
	getParentPath,
	resolveScopedFilePath,
	scopeFileExplorerAdapter,
	useFileExplorer,
} from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import {
	useWorkbench,
	useWorkbenchPanel,
	WorkbenchPanelError,
	WorkbenchPanelLoading,
	writeSpawnDragSpec,
} from "@semoss/workbench";
import {
	FILE_PANEL_EVENTS,
	FILE_PANEL_TYPES,
	MCP,
} from "../../constants/file-panel.constants";
import { useFileExplorerHost } from "../../contexts/file-explorer-host.context";
import { useAccess } from "../../hooks/use-access";
import { useWorkbenchFilePanels } from "../../hooks/use-workbench-file-panels";
import {
	type FilePanelMode,
	getFilePanelResource,
	getFilePanelScope,
	sameFileMode,
} from "../../types/file-panel.types";
import { getFilePanelType } from "../../utility/file-editor.utility";
import { FileExplorerPane } from "./file-explorer-pane";

export interface FileExplorerParams {
	mode: FilePanelMode;
	initialPath?: string;
	/**
	 * A folder to keep the explorer to, such as `/public`: it becomes the
	 * explorer's `/`, and nothing above it can be browsed, searched, or written
	 * to. `initialPath` is then a path inside it.
	 */
	rootPath?: string;
}

/** Whether a moved item stayed in its original directory. */
const isRename = (moved: FileExplorerMovedItem): boolean =>
	getParentPath(moved.oldPath) === getParentPath(moved.newPath);

const FileExplorerPanel = ({ id }: WorkbenchPanelProps) => {
	const { config } = useWorkbenchPanel<FileExplorerParams>(id);

	const insight = useInsight();
	const host = useFileExplorerHost();
	const resource = getFilePanelResource(config.mode);
	const access = useAccess(resource?.type ?? "INSIGHT", resource?.id ?? "");
	const readOnly = access.status !== "ready" || access.readOnly;
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const emit = useWorkbench((state) => state.events.actions.emit);
	const mode = config.mode;
	const rootPath = config.rootPath;
	const { migrateMovedTabs, removeDeletedTabs } =
		useWorkbenchFilePanels(mode);

	// Kept to a folder, the explorer's paths are relative to it. Open panels,
	// events and drags all speak paths in the source, so every path that
	// leaves the explorer goes through `toSourcePath` first.
	const adapter = useMemo(
		() =>
			rootPath
				? scopeFileExplorerAdapter(
						getFileExplorerAdapter(mode),
						rootPath,
					)
				: undefined,
		[mode, rootPath],
	);
	const toSourcePath = useCallback(
		(path: string): string =>
			rootPath ? resolveScopedFilePath(rootPath, path) : path,
		[rootPath],
	);

	const openFile = useCallback(
		(item: FileItem) =>
			layoutActions.selectPanel(
				getFilePanelType(item.path),
				{ mode, name: item.name, path: toSourcePath(item.path) },
				{ name: item.name },
			),
		[mode, layoutActions, toSourcePath],
	);

	const explorer = useFileExplorer({
		mode,
		adapter,
		readOnly,
		initialPath: config.initialPath,
		onItemSelect: openFile,
		onItemsMoved: (movedItems) => {
			const migrated = migrateMovedTabs(
				movedItems.map((moved) => ({
					item: {
						...moved.item,
						path: toSourcePath(moved.item.path),
					},
					oldPath: toSourcePath(moved.oldPath),
					newPath: toSourcePath(moved.newPath),
				})),
			);
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
		onItemsDeleted: (items) =>
			removeDeletedTabs(
				items.map((item) => ({
					...item,
					path: toSourcePath(item.path),
				})),
			),
		// An extract or a copy can land on a file an editor is showing. Nothing
		// about the panel changes, so without this it keeps displaying — and
		// would save back — the content that was just replaced.
		onItemsWritten: (paths) =>
			emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
				scope: getFilePanelScope(mode),
				paths: paths?.map(toSourcePath),
			}),
		onItemDragStart: (event, items) => {
			if (items.length !== 1 || items[0].type === "directory") {
				return;
			}

			writeSpawnDragSpec(event.dataTransfer, {
				type: getFilePanelType(items[0].path),
				config: {
					mode,
					name: items[0].name,
					path: toSourcePath(items[0].path),
				},
				name: items[0].name,
			});
		},
	});

	const itemActions = useCallback(
		(item: FileItem): FileExplorerItemActions => {
			// the row as it is in the source, which the toolbox paths and a
			// host's own entries go by
			const source = rootPath
				? { ...item, path: toSourcePath(item.path) }
				: item;
			const isDirectory = source.type === "directory";
			const actions: FileExplorerItemActions["actions"] = [];
			// toolboxes belong to a project or engine, never to an insight
			const mcpMode =
				mode.type === "APP" || mode.type === "ENGINE" ? mode : null;

			if (
				mcpMode &&
				!isDirectory &&
				!readOnly &&
				MCP.DRIVER_PATHS.some((path) => source.path === path)
			) {
				actions.push({
					name: "Create",
					icon: <HammerIcon />,
					tooltip: "Create Toolbox",
					action: async () => {
						try {
							const [reactorScope, resourceId] =
								mcpMode.type === "APP"
									? ["project", mcpMode.app]
									: ["engine", mcpMode.engine];
							await insight.actions.run(
								`MakePythonMCP(${reactorScope}=[${JSON.stringify(resourceId)}]);`,
							);
							explorer.commands.refresh();
						} catch (error) {
							toast.error(`Error: ${error}`);
						}

						layoutActions.selectPanel(
							FILE_PANEL_TYPES.FILE_MCP_EDITOR,
							{
								mode: mcpMode,
								name: "py_mcp.json",
								path: "/mcp/py_mcp.json",
							},
							{ name: "Toolbox Editor - py_mcp.json" },
						);
					},
				});
			}

			if (
				mcpMode &&
				!isDirectory &&
				!readOnly &&
				MCP.JSON_PATHS.some((path) => source.path.startsWith(path))
			) {
				actions.push({
					name: "Edit",
					icon: <PencilIcon />,
					tooltip: "Edit Toolbox",
					action: async (target: FileItem) => {
						layoutActions.selectPanel(
							FILE_PANEL_TYPES.FILE_MCP_EDITOR,
							{
								mode: mcpMode,
								name: target.name,
								path: toSourcePath(target.path),
							},
							{ name: `Toolbox Editor - ${target.name}` },
						);
					},
				});
			}

			return {
				actions,
				secondaryActions: host?.secondaryActions?.(source, mode) ?? [],
			};
		},
		[
			mode,
			explorer.commands,
			insight.actions,
			layoutActions,
			readOnly,
			host,
			rootPath,
			toSourcePath,
		],
	);

	if (access.status === "loading") {
		return <WorkbenchPanelLoading label="Loading resource access" />;
	}

	if (access.status === "error") {
		return (
			<WorkbenchPanelError
				message={access.error}
				onRetry={() => void access.refresh()}
			/>
		);
	}

	return (
		<FileExplorerPane
			id={id}
			explorer={explorer}
			itemActions={itemActions}
		/>
	);
};

/** Scope-aware file explorer blueprint shared by all workbenches. */
export const FILE_EXPLORER_PANEL: WorkbenchPanelConfig<
	FileExplorerParams,
	FileExplorerApi
> = {
	name: "Files",
	helpText: "File Explorer",
	icon: ({ className }) => <FolderTreeIcon className={className} />,
	canClose: false,
	canRename: false,
	canSplitTab: true,
	mount: "keepAlive",
	matches: (a, b) =>
		Boolean(a.mode) && Boolean(b.mode) && sameFileMode(a.mode, b.mode),
	content: FileExplorerPanel,
};
