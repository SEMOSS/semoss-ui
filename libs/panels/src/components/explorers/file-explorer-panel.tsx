import { FolderTreeIcon, HammerIcon, PencilIcon } from "lucide-react";
import { useCallback } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	type FileExplorerApi,
	type FileExplorerItemActions,
	type FileExplorerMovedItem,
	type FileItem,
	getParentPath,
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
}

/** Whether a moved item stayed in its original directory. */
const isRename = (moved: FileExplorerMovedItem): boolean =>
	getParentPath(moved.oldPath) === getParentPath(moved.newPath);

const FileExplorerPanel = ({ id }: WorkbenchPanelProps) => {
	const { config } = useWorkbenchPanel<FileExplorerParams>(id);

	const insight = useInsight();
	const resource = getFilePanelResource(config.mode);
	const access = useAccess(resource?.type ?? "INSIGHT", resource?.id ?? "");
	const readOnly = access.status !== "ready" || access.readOnly;
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const emit = useWorkbench((state) => state.events.actions.emit);
	const mode = config.mode;
	const { migrateMovedTabs, removeDeletedTabs } =
		useWorkbenchFilePanels(mode);

	const openFile = useCallback(
		(item: FileItem) =>
			layoutActions.selectPanel(
				getFilePanelType(item.path),
				{ mode, name: item.name, path: item.path },
				{ name: item.name },
			),
		[mode, layoutActions],
	);

	const explorer = useFileExplorer({
		mode,
		readOnly,
		initialPath: config.initialPath,
		onItemSelect: openFile,
		onItemsMoved: (movedItems) => {
			const migrated = migrateMovedTabs(movedItems);
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
		// An extract or a copy can land on a file an editor is showing. Nothing
		// about the panel changes, so without this it keeps displaying — and
		// would save back — the content that was just replaced.
		onItemsWritten: (paths) =>
			emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
				scope: getFilePanelScope(mode),
				paths,
			}),
		onItemDragStart: (event, items) => {
			if (items.length !== 1 || items[0].type === "directory") {
				return;
			}

			writeSpawnDragSpec(event.dataTransfer, {
				type: getFilePanelType(items[0].path),
				config: { mode, name: items[0].name, path: items[0].path },
				name: items[0].name,
			});
		},
	});

	const itemActions = useCallback(
		(item: FileItem): FileExplorerItemActions => {
			const isDirectory = item.type === "directory";
			const actions: FileExplorerItemActions["actions"] = [];
			// toolboxes belong to a project or engine, never to an insight
			const mcpMode =
				mode.type === "APP" || mode.type === "ENGINE" ? mode : null;

			if (
				mcpMode &&
				!isDirectory &&
				!readOnly &&
				MCP.DRIVER_PATHS.some((path) => item.path === path)
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
				MCP.JSON_PATHS.some((path) => item.path.startsWith(path))
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
								path: target.path,
							},
							{ name: `Toolbox Editor - ${target.name}` },
						);
					},
				});
			}

			return { actions };
		},
		[mode, explorer.commands, insight.actions, layoutActions, readOnly],
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
