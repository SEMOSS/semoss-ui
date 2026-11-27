import type { FileMode } from "./file.types";
import type {
	FileExplorerApi,
	FileExplorerHookOptions,
} from "./file-explorer.types";
import { useFileExplorer } from "./use-file-explorer";

/** The signed in user's own files; one value, so its identity never changes. */
const USER_MODE: FileMode = { type: "USER" };

/**
 * An explorer over the signed in user's own files.
 *
 * @param options - How the explorer behaves.
 * @return The explorer api, for `FileExplorer`'s `explorers`.
 */
export const useUserFileExplorer = (
	options: FileExplorerHookOptions,
): FileExplorerApi => useFileExplorer({ ...options, mode: USER_MODE });
