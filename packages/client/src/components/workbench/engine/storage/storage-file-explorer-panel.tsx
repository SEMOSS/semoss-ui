import { CloudIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	FileExplorer,
	type FileExplorerApi,
	FileExplorerHeader,
	type FileMode,
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
 * `STORAGE` is a browse-only scope — the reactor family has no rename, delete,
 * upload, or search — so this panel needs none of the tab-sync the `APP` and
 * `ENGINE` explorers do. Opening a file is also indirect: the bucket's bytes
 * are pulled into a **new insight** first, and the editor opens against that
 * insight rather than the bucket.
 */
export const StorageFileExplorerPanel: WorkbenchComponent<
	Record<string, unknown>,
	FileExplorerApi
> = ({ id, setValue }) => {
	const { engine } = useEngine();
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

	// publish the explorer for the panel's chrome control. `explorer` is
	// identity-stable, so this runs once; `setValue` is intentionally not a
	// dependency — it takes a new identity whenever the value it writes does,
	// which would loop.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => setValue(explorer), [explorer]);
	useWorkbenchControl(id, FileExplorerControl);

	return (
		<FileExplorer
			explorer={explorer}
			header={<FileExplorerHeader explorer={explorer} />}
			newFileOverlay={null}
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
	mount: "keepAlive",
	content: StorageFileExplorerPanel,
};
