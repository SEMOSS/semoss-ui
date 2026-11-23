import { useMemo } from "react";
import type { FileMode } from "./file.types";
import type {
	FileExplorerApi,
	FileExplorerHookOptions,
} from "./file-explorer.types";
import { useFileExplorer } from "./use-file-explorer";

/** Options for {@link useStorageFileExplorer}. */
export interface StorageFileExplorerOptions extends FileExplorerHookOptions {
	/** The storage engine whose bucket to browse. */
	storage: string;
}

/**
 * An explorer over a storage engine's bucket. A bucket can be browsed, uploaded to, and deleted from, but has no reactor to read a file, so the host opens one through `onItemSelect`, such as by pulling it into an insight.
 *
 * @param options - Which one, and how the explorer behaves.
 * @return The explorer api, for `FileExplorer`'s `explorers`.
 */
export const useStorageFileExplorer = ({
	storage,
	...options
}: StorageFileExplorerOptions): FileExplorerApi => {
	const mode = useMemo<FileMode>(
		() => ({ type: "STORAGE", storage: storage }),
		[storage],
	);
	return useFileExplorer({ ...options, mode: mode });
};
