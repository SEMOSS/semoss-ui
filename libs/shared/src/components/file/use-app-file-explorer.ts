import { useMemo } from "react";
import type { FileMode } from "./file.types";
import type {
	FileExplorerApi,
	FileExplorerHookOptions,
} from "./file-explorer.types";
import { useFileExplorer } from "./use-file-explorer";

/** Options for {@link useAppFileExplorer}. */
export interface AppFileExplorerOptions extends FileExplorerHookOptions {
	/** The project whose assets to browse. */
	app: string;
}

/**
 * An explorer over a project's assets.
 *
 * @param options - Which one, and how the explorer behaves.
 * @return The explorer api, for `FileExplorer`'s `explorers`.
 */
export const useAppFileExplorer = ({
	app,
	...options
}: AppFileExplorerOptions): FileExplorerApi => {
	const mode = useMemo<FileMode>(() => ({ type: "APP", app: app }), [app]);
	return useFileExplorer({ ...options, mode: mode });
};
