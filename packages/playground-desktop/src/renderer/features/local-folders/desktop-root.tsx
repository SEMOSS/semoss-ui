import { useTranslation } from "@semoss/i18n";
import {
	type FilePanelMode,
	useDockFileOptions,
	useFileExplorerRoot,
} from "@semoss/panels";
import { useSourceFileExplorer } from "@semoss/shared";
import { MAX_FOLDER_SEARCH_RESULTS } from "../../../contract/local-folders";
import { DesktopEmptyState } from "./desktop-empty-state";
import { DESKTOP_MOUNT_ID } from "./desktop-files-source";
import { DesktopRootMenu } from "./desktop-root-menu";
import type { RoomLocalFoldersStore } from "./room-local-folders.store";
import { useLocalFolders } from "./use-local-folders";

/** The Desktop tree's mode; one value, so its identity never changes. */
const DESKTOP_MODE: FilePanelMode = {
	type: "MOUNT",
	mountId: DESKTOP_MOUNT_ID,
};

/** Props for {@link DesktopRoot}. */
interface DesktopRootProps {
	/** The room's attached folders. */
	store: RoomLocalFoldersStore;
}

/**
 * The room's attached folders as one Desktop tree in its Files, each folder a
 * top level directory, wired into the room's dock. Its menu attaches a folder,
 * and with none attached, its tree offers Attach Folder. It draws nothing itself;
 * the Files panel draws the tree.
 *
 * @param props - The room's folders.
 * @returns Nothing.
 */
export const DesktopRoot = ({ store }: DesktopRootProps) => {
	const { t } = useTranslation("desktop");
	// rendered again as folders come and go: each set of folders makes a new
	// source, which lists the tree again
	useLocalFolders(store, (snapshot) => snapshot.folders);
	const explorer = useSourceFileExplorer({
		mountId: DESKTOP_MOUNT_ID,
		source: store.filesSource,
		...useDockFileOptions(DESKTOP_MODE),
	});
	useFileExplorerRoot({
		id: DESKTOP_MOUNT_ID,
		name: t("localFolders.desktop"),
		actions: <DesktopRootMenu store={store} />,
		emptyState: <DesktopEmptyState store={store} />,
		// a search that stopped at its limit says so, once, under its results
		listingNote: (_items, path) =>
			explorer.header.search &&
			path === explorer.header.path &&
			store.filesSource.isSearchTruncated
				? t("localFolders.searchTruncated", {
						count: MAX_FOLDER_SEARCH_RESULTS,
					})
				: undefined,
		explorer: explorer,
	});

	return null;
};
