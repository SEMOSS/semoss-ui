import { CloudIcon } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import { FileExplorerPane, useDockFileOptions } from "@semoss/panels";
import { useInsight } from "@semoss/sdk/react";
import {
	decorateExplorer,
	type FileExplorerApi,
	type FileMode,
	getFileOperationErrorMessage,
	useStorageFileExplorer,
} from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@semoss/workbench";
import { useEngine } from "@/hooks";

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
const StorageFileExplorerPanel: WorkbenchComponent = ({ id }) => {
	const { engine, permission } = useEngine();
	const insight = useInsight();
	const { t } = useTranslation("common");
	const readOnly = !(permission === "OWNER" || permission === "EDIT");
	const mode = useMemo<Extract<FileMode, { type: "STORAGE" }>>(
		() => ({ type: "STORAGE", storage: engine.engine_id }),
		[engine.engine_id],
	);

	// a file opens by being pulled into a new insight; see `useDockFileOptions`
	const explorer = useStorageFileExplorer({
		storage: mode.storage,
		readOnly,
		...useDockFileOptions(mode),
	});

	// Pulling the bucket down to local is folded into refresh rather than a
	// separate action — every refresh (chrome control, header) also asks the
	// backend to mirror the current directory into the paired engine's local
	// tree. Best-effort: a failed sync doesn't block the listing reload.
	//
	// Read `explorer.header.path` at call time, not at wrap time, so it
	// targets the directory that is actually open when refresh fires.
	// `decorateExplorer` keeps the api live behind one stable identity;
	// memoizing is required, not an optimization — an unmemoized decoration
	// churns the identity every render and the pane would republish it in a
	// loop.
	const wrappedExplorer = useMemo(
		() =>
			decorateExplorer(explorer, {
				refresh: (live) => (paths) => {
					const target = paths?.[0] ?? live.header.path;
					if (!readOnly) {
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
					}
					live.commands.refresh(paths);
				},
			}),
		[engine.engine_id, explorer, insight.actions, readOnly, t],
	);

	return <FileExplorerPane id={id} explorer={wrappedExplorer} />;
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
