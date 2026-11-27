import { useMemo } from "react";
import type { FileMode } from "./file.types";
import type {
	FileExplorerApi,
	FileExplorerHookOptions,
} from "./file-explorer.types";
import { useFileExplorer } from "./use-file-explorer";

/** Options for {@link useEngineFileExplorer}. */
export interface EngineFileExplorerOptions extends FileExplorerHookOptions {
	/** The engine whose files to browse, such as a vector database or model. */
	engine: string;
}

/**
 * An explorer over an engine's own files.
 *
 * @param options - Which one, and how the explorer behaves.
 * @return The explorer api, for `FileExplorer`'s `explorers`.
 */
export const useEngineFileExplorer = ({
	engine,
	...options
}: EngineFileExplorerOptions): FileExplorerApi => {
	const mode = useMemo<FileMode>(
		() => ({ type: "ENGINE", engine: engine }),
		[engine],
	);
	return useFileExplorer({ ...options, mode: mode });
};
