import { CloudIcon } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { runPixel, useInsight } from "@semoss/sdk/react";
import {
	FileExplorer,
	FileExplorerItem,
	type FileExplorerMovedItem,
	type FileItem,
	getFileEditorPathScope,
	notifyFileEditorPathMoved,
} from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { useEngine, useWorkbench } from "@/hooks";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelRecord,
} from "@/stores/workbench";
import { WORKBENCH_COMPONENTS } from "../../workbench.constants";
import type { EngineFileEditorConfig } from "../engine-file-editor-panel";

/** Same heterogeneous-record caveat as the engine explorer. */
type StorageFilePanelConfig = Partial<EngineFileEditorConfig>;

/** The file a panel is open for, if it is a file-backed panel at all. */
const filePathOf = (record: WorkbenchPanelRecord): string | undefined =>
	(record.config as StorageFilePanelConfig | undefined)?.path;

/** Panels a path move or delete can affect. */
const hasFilePath = (record: WorkbenchPanelRecord): boolean =>
	Boolean(filePathOf(record));

export const StorageFileExplorerPanel: React.FC = () => {
	const { engine, permission } = useEngine();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const insight = useInsight();
	const [searchParams, setSearchParams] = useSearchParams();
	const layoutActions = useWorkbench((s) => s.layout.actions);

	const getMovedPath = (path: string, movedItem: FileExplorerMovedItem) => {
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
	};

	const updatePanelPath = (record: WorkbenchPanelRecord, newPath: string) => {
		const config = (record.config ?? {}) as StorageFilePanelConfig;
		const newName = newPath.split("/").filter(Boolean).pop() ?? newPath;
		const oldPath = config.path;
		const scope =
			config.fileMode === "INSIGHT"
				? getFileEditorPathScope(
						{
							type: "INSIGHT",
							insightId: config.insightId,
						},
						insight.insightId,
					)
				: getFileEditorPathScope({
						type: "ENGINE",
						engine: engine.engine_id,
					});
		const displayName = record.name.endsWith("*") ? `${newName}*` : newName;

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
	};

	const migrateMovedTabs = (movedItems: FileExplorerMovedItem[]) => {
		let migrated = false;

		for (const record of layoutActions.findPanels(hasFilePath)) {
			const path = filePathOf(record);
			if (!path) {
				continue;
			}

			const movedPath = movedItems.reduce<string | null>(
				(currentPath, movedItem) => {
					if (!currentPath) return currentPath;
					return getMovedPath(currentPath, movedItem) ?? currentPath;
				},
				path,
			);

			if (movedPath && movedPath !== path) {
				updatePanelPath(record, movedPath);
				migrated = true;
			}
		}

		return migrated;
	};

	/**
	 * Close panels that are open for a file that has been deleted. If it's a
	 * directory, close every panel open for a file within that directory.
	 *
	 * @param deletedPath - The path of the deleted file or directory.
	 * @param isDirectory - Whether the deleted path is a directory.
	 */
	const removeDeletedTabs = useCallback(
		(deletedPath: string, isDirectory: boolean) => {
			const directoryPath = deletedPath.endsWith("/")
				? deletedPath
				: `${deletedPath}/`;

			// the file itself, or anything under the deleted directory
			const doomed = layoutActions.findPanels((record) => {
				const recordPath = filePathOf(record);
				return (
					recordPath === deletedPath ||
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

	return (
		<FileExplorer
			readOnly={readOnly}
			mode={{
				type: "STORAGE",
				storage: engine.engine_id,
			}}
			onItemSelect={(item) => {
				if (item.type === "directory") {
					return;
				}

				const fileName =
					item.name.split("/").filter(Boolean).pop() || item.name;
				const insightFilePath = `/${fileName}`;

				runPixel<[string]>(
					`PullFromStorage(storage=["${engine.engine_id}"], storagePath=["${item.path}"], filePath="/");`,
					"new",
				)
					.then((response) => {
						if (response.errors.length > 0) {
							throw new Error(response.errors[0]);
						}

						layoutActions.selectPanel(
							WORKBENCH_COMPONENTS.FILE_EDITOR,
							{
								name: item.name,
								path: insightFilePath,
								fileMode: "INSIGHT",
								insightId: response.insightId,
							},
							{ name: item.name },
						);
					})
					.catch((e) => {
						toast.error(
							e?.message || "Failed to load storage file",
						);
					});
			}}
			onItemsMoved={migrateMovedTabs}
			onItemsDeleted={(items) => {
				items.forEach((item) => {
					removeDeletedTabs(item.path, item.type === "directory");
				});
			}}
			ItemComponent={({ item, refresh, ...otherProps }) => {
				const secondaryActions: Array<{
					name: string;
					action: (item: FileItem) => Promise<void>;
				}> = [
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

				return (
					<FileExplorerItem
						draggable={false}
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
								WORKBENCH_COMPONENTS.FILE_EDITOR,
								{
									name: newName,
									path: newPath,
								},
								{ name: newName },
							);
						}}
						{...otherProps}
						actions={[]}
						secondaryActions={secondaryActions}
					/>
				);
			}}
		/>
	);
};

/**
 * Blueprint for the storage-bucket explorer. keepAlive: the expanded tree
 * and current directory survive tab switches.
 */
export const STORAGE_FILE_EXPLORER_PANEL: WorkbenchPanelConfig = {
	name: "Storage",
	helpText: "Storage Explorer",
	icon: ({ className }) => <CloudIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: StorageFileExplorerPanel,
};
