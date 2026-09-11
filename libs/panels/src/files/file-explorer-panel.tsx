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
	WorkbenchAccessError,
	WorkbenchAccessLoading,
	writeSpawnDragSpec,
} from "@semoss/workbench";
import { useAccess } from "../access";
import { getFilePanelType } from "./file-editor.utility";
import { FileExplorerPane } from "./file-explorer-pane";
import { FILE_PANEL_TYPES, MCP } from "./file-panel.constants";
import {
	type FilePanelMode,
	getFilePanelResource,
	sameFileMode,
} from "./file-panel.mode";
import { useWorkbenchFilePanels } from "./use-workbench-file-panels";

export interface FileExplorerParams {
	mode: FilePanelMode;
	initialPath?: string;
}

/** Whether a moved item stayed in its original directory. */
const isRename = (moved: FileExplorerMovedItem): boolean =>
	getParentPath(moved.oldPath) === getParentPath(moved.newPath);

const FileExplorerPanel = ({
	id,
	config,
	setValue,
}: WorkbenchPanelProps<FileExplorerParams, FileExplorerApi>) => {
	const insight = useInsight();
	const resource = getFilePanelResource(config.mode);
	const access = useAccess(resource?.type ?? "INSIGHT", resource?.id ?? "");
	const readOnly = access.status !== "ready" || access.readOnly;
	const layoutActions = useWorkbench((state) => state.layout.actions);
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
		return (
			<WorkbenchAccessLoading
				className="size-full"
				label="Loading resource access"
			/>
		);
	}

	if (access.status === "error") {
		return (
			<WorkbenchAccessError
				className="size-full"
				message={access.error}
				onRetry={() => void access.refresh()}
			/>
		);
	}

	return (
		<FileExplorerPane
			id={id}
			explorer={explorer}
			setValue={setValue}
			itemActions={itemActions}
			overlay={
				<>
					{access.refreshing ? (
						<WorkbenchAccessLoading
							className="absolute inset-0 bg-background/80"
							label="Refreshing resource access"
						/>
					) : null}
					{access.refreshError ? (
						<WorkbenchAccessError
							className="absolute inset-0 bg-background/90"
							message={access.refreshError}
							onRetry={() => void access.refresh()}
						/>
					) : null}
				</>
			}
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
