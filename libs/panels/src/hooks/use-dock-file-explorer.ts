import {
	type FileExplorerAdapter,
	type FileExplorerApi,
	type FileSource,
	useFileExplorer,
} from "@semoss/shared";
import type { FilePanelMode } from "../types/file-panel.types";
import { useDockFileOptions } from "./use-dock-file-options";

interface UseDockFileExplorerOptions {
	/** The explorer's scope, which every panel it opens is opened with. */
	mode: FilePanelMode;
	/** Pixels of the explorer's own, such as one kept to a folder. */
	adapter?: FileExplorerAdapter;
	/** A host's own tree, read without Pixels. */
	source?: FileSource;
	readOnly: boolean;
	initialPath?: string;
	/** Fired when a command or file operation explicitly reloads the listing. */
	onRefresh?: () => void;
	/**
	 * Where a path from the explorer is in its source, for an explorer kept to
	 * a folder. Open panels, events and drags all speak source paths.
	 */
	toSourcePath?: (path: string) => string;
}

/**
 * A file explorer over any panel scope, wired into the dock through
 * {@link useDockFileOptions}. The Files panel builds its own tree with it,
 * whatever the scope its config names.
 *
 * @param options - The explorer's scope and source.
 * @returns The explorer.
 */
export const useDockFileExplorer = ({
	mode,
	adapter,
	source,
	readOnly,
	initialPath,
	onRefresh,
	toSourcePath,
}: UseDockFileExplorerOptions): FileExplorerApi =>
	useFileExplorer({
		mode,
		adapter,
		source,
		readOnly,
		initialPath: initialPath,
		onRefresh,
		...useDockFileOptions(mode, toSourcePath),
	});
