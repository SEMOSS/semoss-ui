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
	getParentPath,
	NewFileOverlay,
	useFileExplorer,
} from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { MCP } from "@/constants";
import {
	useWorkbench,
	useWorkbenchAccess,
	useWorkbenchControl,
	useWorkbenchFilePanels,
} from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@/stores/workbench";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench";
import { WorkbenchAccessError } from "../core/workbench-access-error";
import { WorkbenchAccessLoading } from "../core/workbench-access-loading";
import { writeSpawnDragSpec } from "../core/workbench-spawn-drag";
import { getFilePanelType } from "./file-editor.utility";
import { FileExplorerControl } from "./file-explorer-control";
import { getFileMode } from "./file-panel.utility";

export interface FileExplorerParams {
	type: "ENGINE" | "PROJECT" | "INSIGHT";
	id: string;
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
	const access = useWorkbenchAccess(config.type, config.id);
	const readOnly = access.status !== "ready" || access.readOnly;
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const { id: resourceId, type: resourceType } = config;
	const mode = useMemo(
		() => getFileMode({ id: resourceId, type: resourceType }),
		[resourceId, resourceType],
	);
	const { migrateMovedTabs, removeDeletedTabs } =
		useWorkbenchFilePanels(mode);

	const openFile = useCallback(
		(item: FileItem) =>
			layoutActions.selectPanel(
				getFilePanelType(item.path),
				{
					type: config.type,
					id: config.id,
					name: item.name,
					path: item.path,
				},
				{ name: item.name },
			),
		[config.id, config.type, layoutActions],
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
				config: {
					type: config.type,
					id: config.id,
					name: items[0].name,
					path: items[0].path,
				},
				name: items[0].name,
			});
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: the explorer is identity-stable; setValue changes after writes
	useEffect(() => setValue(explorer), [explorer]);
	useWorkbenchControl(id, FileExplorerControl);

	const itemActions = useCallback(
		(item: FileItem): FileExplorerItemActions => {
			const isDirectory = item.type === "directory";
			const actions: FileExplorerItemActions["actions"] = [];

			if (
				config.type !== "INSIGHT" &&
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
							const resource = config.type.toLowerCase();
							await insight.actions.run(
								`MakePythonMCP(${resource}=[${JSON.stringify(config.id)}]);`,
							);
							explorer.commands.refresh();
						} catch (error) {
							toast.error(`Error: ${error}`);
						}

						layoutActions.selectPanel(
							WORKBENCH_COMPONENTS.FILE_MCP_EDITOR,
							{
								type: config.type,
								id: config.id,
								name: "py_mcp.json",
								path: "/mcp/py_mcp.json",
							},
							{ name: "Toolbox Editor - py_mcp.json" },
						);
					},
				});
			}

			if (
				config.type !== "INSIGHT" &&
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
							WORKBENCH_COMPONENTS.FILE_MCP_EDITOR,
							{
								type: config.type,
								id: config.id,
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
		[config, explorer.commands, insight.actions, layoutActions, readOnly],
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
		<div className="relative size-full">
			<FileExplorer
				explorer={explorer}
				header={<FileExplorerHeader explorer={explorer} />}
				newFileOverlay={NewFileOverlay}
				itemActions={itemActions}
			/>
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
		</div>
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
	matches: (a, b) => a.type === b.type && a.id === b.id,
	content: FileExplorerPanel,
};
