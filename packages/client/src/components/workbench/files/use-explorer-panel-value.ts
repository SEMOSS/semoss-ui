import { useEffect } from "react";
import type { FileExplorerApi } from "@semoss/shared";
import { useWorkbenchControl } from "@/hooks";
import type { WorkbenchPanelId } from "@/stores/workbench";
import { FileExplorerControl } from "./file-explorer-control";

/**
 * Publish an explorer's api to its panel's scratch value and mount the shared
 * chrome control.
 *
 * The api is identity-stable by design, so this effect runs once. `setValue`
 * is deliberately *not* a dependency: `useWorkbenchPanel` rebuilds a panel's
 * methods whenever its value changes, so listing it loops forever.
 *
 * @param id - The panel instance.
 * @param explorer - The api to publish; memoize it if it is decorated.
 * @param setValue - The panel's scratch-value setter.
 */
export const useExplorerPanelValue = (
	id: WorkbenchPanelId,
	explorer: FileExplorerApi,
	setValue: (value: FileExplorerApi) => void,
): void => {
	// biome-ignore lint/correctness/useExhaustiveDependencies: the explorer is identity-stable; setValue changes after writes
	useEffect(() => setValue(explorer), [explorer]);
	useWorkbenchControl(id, FileExplorerControl);
};
