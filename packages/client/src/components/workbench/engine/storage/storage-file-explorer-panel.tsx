import { CloudIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { runPixel, useInsight } from "@semoss/sdk/react";
import {
	FileExplorer,
	type FileExplorerApi,
	type FileExplorerCommands,
	FileExplorerHeader,
	type FileMode,
	getFileOperationErrorMessage,
	NewFileOverlay,
	useFileExplorer,
} from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { useEngine, useWorkbench, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import { FileExplorerControl } from "../../file-explorer-control";
import { WORKBENCH_COMPONENTS } from "../../workbench.constants";

/**
 * Storage-bucket explorer panel.
 *
 * `STORAGE` supports browse, upload (push), and delete, but has no rename,
 * copy, create, or search reactors — so this panel needs none of the tab-sync
 * the `APP` and `ENGINE` explorers do. Opening a file is also indirect: the
 * bucket's bytes are pulled into a **new insight** first, and the editor opens
 * against that insight rather than the bucket. Refresh additionally syncs the
 * current directory down into the paired engine's local file tree.
 */
const StorageFileExplorerPanel: WorkbenchComponent<
	Record<string, unknown>,
	FileExplorerApi
> = ({ id, setValue }) => {
	const { engine } = useEngine();
	const insight = useInsight();
	const { t } = useTranslation("common");
	const layoutActions = useWorkbench((s) => s.layout.actions);
	const mode = useMemo<FileMode>(
		() => ({ type: "STORAGE", storage: engine.engine_id }),
		[engine.engine_id],
	);

	const explorer = useFileExplorer({
		mode: mode,
		onItemSelect: (item) => {
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
					toast.error(e?.message || "Failed to load storage file");
				});
		},
	});

	// `explorer`'s slices (header, tree, ...) are getters onto live state, kept
	// behind one stable identity so a non-rendering holder still reads current
	// data (see the big comment at the end of `useFileExplorer`). Wrapping it
	// to layer sync-on-refresh has to preserve that — spreading `explorer`
	// would snapshot every getter's *current value* once and freeze it, so the
	// wrapper forwards each slice through its own getter instead, and only
	// `commands` is a plain object (reading `explorer.header.path` at call
	// time, not at wrap time, keeps it targeting the directory that's actually
	// open when refresh fires).
	//
	// Pulling the bucket down to local is folded into refresh rather than a
	// separate action — every refresh (chrome control, header) also asks the
	// backend to mirror the current directory into the paired engine's local
	// tree. Best-effort: a failed sync doesn't block the listing reload.
	// `explorer`, `engine.engine_id`, and `insight.actions` are all stable for
	// this panel's lifetime, so this builds once.
	const wrappedExplorer = useMemo<FileExplorerApi>(() => {
		const wrappedCommands: FileExplorerCommands = {
			...explorer.commands,
			refresh: (paths) => {
				const target = paths?.[0] ?? explorer.header.path;
				insight.actions
					.run(
						`Storage(storage = "${engine.engine_id}") | SyncStorageToLocal(storagePath='${target}', filePath='${target}');`,
					)
					.catch((e) => {
						toast.error(
							getFileOperationErrorMessage(
								t("fileExplorer.toasts.syncFailed"),
								e,
							),
						);
					});
				explorer.commands.refresh(paths);
			},
		};

		return {
			get instanceId() {
				return explorer.instanceId;
			},
			get mode() {
				return explorer.mode;
			},
			get adapter() {
				return explorer.adapter;
			},
			get capabilities() {
				return explorer.capabilities;
			},
			get header() {
				return explorer.header;
			},
			get tree() {
				return explorer.tree;
			},
			get dnd() {
				return explorer.dnd;
			},
			get newFile() {
				return explorer.newFile;
			},
			commands: wrappedCommands,
		};
	}, [explorer, engine.engine_id, insight.actions, t]);

	// publish the explorer for the panel's chrome control. `wrappedExplorer`
	// is identity-stable (built once above), so this runs once; `setValue` is
	// intentionally not a dependency — it takes a new identity whenever the
	// value it writes does, which would loop.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => setValue(wrappedExplorer), [wrappedExplorer]);
	useWorkbenchControl(id, FileExplorerControl);

	return (
		<FileExplorer
			explorer={wrappedExplorer}
			header={<FileExplorerHeader explorer={wrappedExplorer} />}
			newFileOverlay={NewFileOverlay}
		/>
	);
};

/**
 * Blueprint for the storage-bucket explorer. keepAlive: the expanded tree
 * and current directory survive tab switches.
 */
export const STORAGE_FILE_EXPLORER_PANEL: WorkbenchPanelConfig<
	Record<string, unknown>,
	FileExplorerApi
> = {
	name: "Storage",
	helpText: "Storage Explorer",
	icon: ({ className }) => <CloudIcon className={className} />,
	canClose: false,
	canRename: false,
	canSplitTab: true,
	mount: "keepAlive",
	content: StorageFileExplorerPanel,
};
