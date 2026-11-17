import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type {
	RoomLocalFoldersSnapshot,
	RoomLocalFoldersStore,
} from "./room-local-folders.store";

/** What a room with no way to the user's files reads: no folders, ever. */
const NO_LOCAL_FOLDERS = {
	getSnapshot: (): RoomLocalFoldersSnapshot => EMPTY_SNAPSHOT,
	subscribe: (): (() => void) => () => undefined,
};

const EMPTY_SNAPSHOT: RoomLocalFoldersSnapshot = {
	status: "IDLE",
	folders: [],
	error: null,
	isPicking: false,
};

/**
 * Read a room's attached folders.
 *
 * @param store - The room's `localFolders`, or null where the host cannot
 * reach the user's files; then the selector reads an empty, idle snapshot.
 * @param selector - What to read.
 * @returns The selection.
 */
export const useLocalFolders = <T>(
	store: RoomLocalFoldersStore | null,
	selector: (snapshot: RoomLocalFoldersSnapshot) => T,
): T => useStoreSelector(store ?? NO_LOCAL_FOLDERS, selector);
