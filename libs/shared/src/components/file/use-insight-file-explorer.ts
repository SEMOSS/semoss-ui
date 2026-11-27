import { useMemo } from "react";
import type { FileMode } from "./file.types";
import type {
	FileExplorerApi,
	FileExplorerHookOptions,
} from "./file-explorer.types";
import { useFileExplorer } from "./use-file-explorer";

/** Options for {@link useInsightFileExplorer}. */
export interface InsightFileExplorerOptions extends FileExplorerHookOptions {
	/** The insight whose files to browse. */
	insightId: string;
}

/**
 * An explorer over an insight's files.
 *
 * @param options - Which one, and how the explorer behaves.
 * @return The explorer api, for `FileExplorer`'s `explorers`.
 */
export const useInsightFileExplorer = ({
	insightId,
	...options
}: InsightFileExplorerOptions): FileExplorerApi => {
	const mode = useMemo<FileMode>(
		() => ({ type: "INSIGHT", insightId: insightId }),
		[insightId],
	);
	return useFileExplorer({ ...options, mode: mode });
};
