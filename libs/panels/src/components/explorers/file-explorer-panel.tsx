import { FolderTreeIcon, HammerIcon, PencilIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	type FileExplorerApi,
	type FileExplorerItemActions,
	type FileExplorerRoot,
	type FileExplorerRootsLayout,
	type FileItem,
	getFileExplorerAdapter,
	resolveScopedFilePath,
	scopeFileExplorerAdapter,
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
} from "@semoss/workbench";
import { FILE_PANEL_TYPES, MCP } from "../../constants/file-panel.constants";
import { useFileExplorerHost } from "../../contexts/file-explorer-host.context";
import {
	useFileExplorerRoots,
	useFileSources,
} from "../../contexts/file-sources.context";
import { useAccess } from "../../hooks/use-access";
import { useDockFileExplorer } from "../../hooks/use-dock-file-explorer";
import {
	type FilePanelMode,
	getFilePanelResource,
	sameFileMode,
} from "../../types/file-panel.types";
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
	/** How the user ordered, sized, and closed the panel's roots. */
	roots?: FileExplorerRootsLayout;
	/**
	 * The same, as layouts saved before the roots were rows of one tree kept
	 * it. Read until the user next arranges the roots.
	 */
	sections?: FileExplorerRootsLayout;
}

const FileExplorerPanel = ({ id }: WorkbenchPanelProps) => {
	const { config, setConfig } = useWorkbenchPanel<FileExplorerParams>(id);

	const insight = useInsight();
	const host = useFileExplorerHost();
	const resource = getFilePanelResource(config.mode);
	const access = useAccess(resource?.type ?? "INSIGHT", resource?.id ?? "");
	const readOnly = access.status !== "ready" || access.readOnly;
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const mode = config.mode;
	const rootPath = config.rootPath;
	const sources = useFileSources();
	const hostRoots = useFileExplorerRoots();

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

	const explorer = useDockFileExplorer({
		mode,
		adapter,
		readOnly,
		onRefresh: host?.onRefresh,
		initialPath: config.initialPath,
		toSourcePath,
	});

	const itemActions = useCallback(
		(item: FileItem, root: FileExplorerRoot): FileExplorerItemActions => {
			// a host's root carries the host's entries, and no toolbox ones
			if (root.explorer !== explorer) {
				return {
					actions: [],
					secondaryActions:
						host?.secondaryActions?.(
							item,
							root.explorer.mode as FilePanelMode,
							root.explorer,
						) ?? [],
				};
			}

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
				secondaryActions:
					host?.secondaryActions?.(source, mode, explorer) ?? [],
			};
		},
		[
			mode,
			explorer,
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

	// a host's roots show only in the panels it names, such as a room's Files
	const isShowingHost = sources?.isShownIn(mode) === true;

	return (
		<FileExplorerPane
			id={id}
			explorer={explorer}
			itemActions={itemActions}
			roots={isShowingHost ? hostRoots : undefined}
			label={sources?.primaryLabel}
			layout={config.roots ?? config.sections}
			onLayoutChange={(layout) => setConfig({ roots: layout })}
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
