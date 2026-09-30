import { createContext, type ReactNode, useContext } from "react";
import type { FileExplorerSecondaryAction, FileItem } from "@semoss/shared";
import type { FilePanelMode } from "../types/file-panel.types";

/** What a host adds to the file explorer panels below it. */
export interface FileExplorerHost {
	/**
	 * Extra right-click entries for one item, such as the playground's Add to
	 * Context. Called once per rendered row.
	 *
	 * @param item - The row's file or directory.
	 * @param mode - The space the explorer browses.
	 * @return The entries to add; none when the host has nothing for the item.
	 */
	secondaryActions?: (
		item: FileItem,
		mode: FilePanelMode,
	) => FileExplorerSecondaryAction[];
}

const FileExplorerHostContext = createContext<FileExplorerHost | null>(null);

/** Props for {@link FileExplorerHostProvider}. */
export interface FileExplorerHostProviderProps {
	/** The host's additions. Keep its identity stable, or rows rerender. */
	host: FileExplorerHost;
	children: ReactNode;
}

/** Give the file explorer panels below it the host's own entries. */
export const FileExplorerHostProvider = ({
	host,
	children,
}: FileExplorerHostProviderProps) => (
	<FileExplorerHostContext.Provider value={host}>
		{children}
	</FileExplorerHostContext.Provider>
);

/**
 * The nearest host's additions to the file explorer.
 *
 * @return The host, or null when the explorer has none.
 */
export const useFileExplorerHost = (): FileExplorerHost | null =>
	useContext(FileExplorerHostContext);
