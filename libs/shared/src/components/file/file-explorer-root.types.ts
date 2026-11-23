import type { ReactNode } from "react";
import type { FileItem } from "./file.types";
import type { FileExplorerApi } from "./file-explorer.types";

/**
 * One tree of a `FileExplorer`: an explorer from one of the per-mode hooks
 * (`useInsightFileExplorer`, `useStorageFileExplorer`, …) and its row.
 */
export interface FileExplorerRoot {
	/** Unique among the roots and stable; it keys the layout. */
	id: string;
	/** The root row's label. */
	name: string;
	/** Buttons at the row's end, such as a folder's menu. */
	actions?: ReactNode;
	/**
	 * What its top level shows when it holds nothing, such as a button that
	 * attaches a folder; left out, that the folder is empty.
	 */
	emptyState?: ReactNode;
	/**
	 * A line under one of its listings, such as that a search stopped at a
	 * limit; it comes before the explorer's own `listingNote`.
	 */
	listingNote?: (items: FileItem[], path: string) => string | undefined;
	explorer: FileExplorerApi;
}

/** How the user arranged a `FileExplorer`'s roots; the host keeps it. */
export interface FileExplorerRootsLayout {
	/** Root ids, top first. A root not listed goes after the rest. */
	order?: readonly string[];
	/** The roots the user closed. */
	collapsed?: readonly string[];
}

/**
 * Where a `FileExplorer`'s header is drawn, once it has several roots: at the
 * top level, which lists the roots as folders, or inside one of them.
 */
export type FileExplorerPlace =
	| {
			level: "roots";
			/** What the top level is called, such as Files. */
			label: string;
	  }
	| {
			level: "root";
			/** The root's name, which stands for its own top. */
			rootName: string;
			/** What the top level is called, such as Files. */
			label: string;
			/** Go back up to the top level. */
			onExit: () => void;
	  };
