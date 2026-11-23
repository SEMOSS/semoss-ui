import {
	type ComponentType,
	createContext,
	type ReactNode,
	useContext,
} from "react";
import type { FileExplorerSecondaryAction, FileItem } from "@semoss/shared";
import type { FilePanelMode } from "../types/file-panel.types";

/** A button a host adds to an open file's tab controls. */
export interface FileViewHostAction {
	/** Its accessible name and tooltip, such as Open with Default App. */
	name: string;
	/** Its glyph. */
	icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	/** What it does. Report a failure itself; nothing else will. */
	action: () => Promise<void>;
}

/** The file an open file panel shows, as a host's actions get it. */
export interface FileViewHostFile {
	mode: FilePanelMode;
	path: string;
	name: string;
}

/** What a host adds to the file explorer and file panels below it. */
export interface FileExplorerHost {
	/** Re-read a companion listing after file changes or a manual refresh. */
	onRefresh?: () => void;
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
	/**
	 * Extra buttons in an open file's tab controls, after Refresh and Save,
	 * such as the desktop app's Open with Default App.
	 *
	 * @param file - The file the panel shows.
	 * @return The buttons; none when the host has nothing for the file.
	 */
	fileActions?: (file: FileViewHostFile) => FileViewHostAction[];
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
