import { useMemo } from "react";
import type { FileMode } from "./file.types";
import type {
	FileExplorerApi,
	FileExplorerHookOptions,
} from "./file-explorer.types";
import type { FileSource } from "./file-source";
import { useFileExplorer } from "./use-file-explorer";

/** Options for {@link useSourceFileExplorer}. */
export interface SourceFileExplorerOptions extends FileExplorerHookOptions {
	/** The id the host registers the source under; its panels open with it. */
	mountId: string;
	/**
	 * Where the files are read and written, without Pixels. Keep its identity
	 * stable: a new source reloads the listing.
	 */
	source: FileSource;
}

/**
 * An explorer over a tree the host reaches without Pixels, such as a folder
 * on the user's machine.
 *
 * @param options - The source, its id, and how the explorer behaves.
 * @return The explorer api, for `FileExplorer`'s `explorers`.
 */
export const useSourceFileExplorer = ({
	mountId,
	source,
	...options
}: SourceFileExplorerOptions): FileExplorerApi => {
	const mode = useMemo<FileMode>(
		() => ({ type: "MOUNT", mountId: mountId }),
		[mountId],
	);
	return useFileExplorer({ ...options, mode: mode, source: source });
};
