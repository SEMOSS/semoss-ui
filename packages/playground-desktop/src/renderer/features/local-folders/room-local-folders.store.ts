import type { FileSource } from "@semoss/shared";
import { getErrorMessage } from "@semoss/utility/error";
import { StoreState } from "@semoss/utility/store";
import {
	createDesktopFilesSource,
	type DesktopFilesSource,
} from "./desktop-files-source";
import { DesktopFolders } from "./desktop-folders";
import type { LocalFolder, LocalFoldersHost } from "./local-folders-host";

/** A room's folders from the user's machine. Every field is readonly. */
export interface RoomLocalFoldersSnapshot {
	/** `IDLE` until the room asks for them. */
	readonly status: "IDLE" | "LOADING" | "READY" | "ERROR";
	/** The attached folders, in the order they were attached. */
	readonly folders: readonly LocalFolder[];
	/** Why the last load or change failed, or null. */
	readonly error: string | null;
	/** Whether the folder picker is open. */
	readonly isPicking: boolean;
}

/** What the store needs from its room. */
export interface RoomLocalFoldersDeps {
	/** The host that reaches the user's files. */
	host: LocalFoldersHost;
	/** The room's id, which the host keeps the folders under. */
	getRoomId: () => string;
	/**
	 * Called after every load and change, with the folders as they are, such
	 * as to bring the agent's tools in line with them.
	 */
	onFoldersChanged: (folders: readonly LocalFolder[]) => void;
	/** Called when a folder changes outside the chat. */
	onFilesChanged: (folderId: string, paths?: string[]) => void;
}

const NO_FOLDERS: readonly LocalFolder[] = [];

const INITIAL: RoomLocalFoldersSnapshot = {
	status: "IDLE",
	folders: NO_FOLDERS,
	error: null,
	isPicking: false,
};

/**
 * The folders from the user's machine attached to one room. The desktop's
 * tools host keeps one per room the chat has open, loads it when the room
 * loads, and disposes it once the chat lets go of the room. While a folder is
 * attached, the store listens for changes made to it outside the chat.
 */
export class RoomLocalFoldersStore {
	private readonly state = new StoreState<RoomLocalFoldersSnapshot>(INITIAL);
	/** Bumped by every load and change, so an answer that lands late is dropped. */
	private version = 0;
	/** Stops listening to each watched folder, by its id. */
	private readonly watchers = new Map<string, () => void>();
	/** The tools' view of the folders, kept while the folders are the same. */
	private toolFolderCache: {
		folders: readonly LocalFolder[];
		folder: DesktopFolders;
	} | null = null;
	/** The Desktop tree's source, kept while the folders are the same. */
	private filesSourceCache: {
		folders: readonly LocalFolder[];
		source: DesktopFilesSource;
	} | null = null;

	/**
	 * @param deps - The host and the room's callbacks.
	 */
	constructor(private readonly deps: RoomLocalFoldersDeps) {}

	getSnapshot = (): RoomLocalFoldersSnapshot => this.state.getSnapshot();

	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	/** The machine's file manager, such as Finder. */
	get fileManagerName(): string {
		return this.deps.host.fileManagerName;
	}

	/** The attached folders. */
	get folders(): readonly LocalFolder[] {
		return this.state.getSnapshot().folders;
	}

	/**
	 * The attached folders as one folder for the chat's file tools, each a top
	 * level entry. The same object while the folders are the same.
	 */
	get toolFolder(): DesktopFolders {
		const folders = this.folders;
		if (this.toolFolderCache?.folders !== folders) {
			this.toolFolderCache = {
				folders,
				folder: new DesktopFolders(
					folders.map((folder) => ({
						name: folder.name,
						source: this.sourceFor(folder.id),
					})),
				),
			};
		}
		return this.toolFolderCache.folder;
	}

	/**
	 * The attached folders as one tree for the room's Files, each a top level
	 * directory. The same object while the folders are the same.
	 */
	get filesSource(): DesktopFilesSource {
		const folders = this.folders;
		if (this.filesSourceCache?.folders !== folders) {
			this.filesSourceCache = {
				folders,
				source: createDesktopFilesSource(
					folders.map((folder) => ({
						id: folder.id,
						name: folder.name,
						source: this.sourceFor(folder.id),
					})),
				),
			};
		}
		return this.filesSourceCache.source;
	}

	/**
	 * A folder's files.
	 *
	 * @param folderId - The attachment.
	 * @returns Its source; the host keeps one per folder.
	 */
	sourceFor = (folderId: string): FileSource =>
		this.deps.host.source(this.deps.getRoomId(), folderId);

	/** Read the room's folders. A load that lands after a newer one is dropped. */
	load = async (): Promise<void> => {
		const version = ++this.version;
		this.state.update({ status: "LOADING", error: null });
		try {
			const folders = await this.deps.host.list(this.deps.getRoomId());
			if (version === this.version) {
				this.setFolders(folders);
			}
		} catch (error) {
			if (version === this.version) {
				this.state.update({
					status: "ERROR",
					error: getErrorMessage(
						error,
						"The folders could not be read",
					),
				});
			}
		}
	};

	/**
	 * Ask the user for folders to attach.
	 *
	 * @throws Error when the host cannot attach them; the folders stay as they were.
	 */
	attach = async (): Promise<void> => {
		if (this.state.getSnapshot().isPicking) {
			return;
		}
		const version = ++this.version;
		this.state.update({ isPicking: true, error: null });
		try {
			const folders = await this.deps.host.pick(this.deps.getRoomId());
			if (version === this.version) {
				this.setFolders(folders);
			}
		} finally {
			this.state.update({ isPicking: false });
		}
	};

	/**
	 * Detach a folder. The folder on the machine is left as it is.
	 *
	 * @param folderId - The attachment.
	 * @throws Error when the host cannot detach it.
	 */
	detach = async (folderId: string): Promise<void> => {
		const version = ++this.version;
		const folders = await this.deps.host.detach(
			this.deps.getRoomId(),
			folderId,
		);
		if (version === this.version) {
			this.setFolders(folders);
		}
	};

	/**
	 * Open a file or folder in the app the machine opens it with.
	 *
	 * @param folderId - The attachment.
	 * @param path - Inside the folder, as the explorer has it.
	 */
	open = (folderId: string, path: string): Promise<void> =>
		this.deps.host.open(this.deps.getRoomId(), folderId, path);

	/**
	 * Show a file or folder in the machine's file manager.
	 *
	 * @param folderId - The attachment.
	 * @param path - Inside the folder, as the explorer has it.
	 */
	reveal = (folderId: string, path: string): Promise<void> =>
		this.deps.host.reveal(this.deps.getRoomId(), folderId, path);

	/** Stop listening to every folder, for a room its owner dropped. */
	dispose = (): void => {
		this.version++;
		for (const stop of this.watchers.values()) {
			stop();
		}
		this.watchers.clear();
	};

	/**
	 * Keep the folders, listen to the new ones and stop listening to the
	 * gone, and tell the room.
	 *
	 * @param folders - The room's folders now.
	 */
	private setFolders(folders: readonly LocalFolder[]): void {
		const current = this.state.getSnapshot().folders;
		const isSame =
			current.length === folders.length &&
			current.every(
				(folder, index) =>
					folder.id === folders[index]?.id &&
					folder.name === folders[index]?.name,
			);
		const next = isSame ? current : folders;
		this.state.update({ status: "READY", folders: next, error: null });
		this.syncWatchers(next);
		this.deps.onFoldersChanged(next);
	}

	/**
	 * Listen to exactly the attached folders.
	 *
	 * @param folders - The attached folders.
	 */
	private syncWatchers(folders: readonly LocalFolder[]): void {
		const ids = new Set(folders.map((folder) => folder.id));
		for (const [id, stop] of this.watchers) {
			if (!ids.has(id)) {
				stop();
				this.watchers.delete(id);
			}
		}
		for (const folder of folders) {
			if (!this.watchers.has(folder.id)) {
				this.watchers.set(
					folder.id,
					this.deps.host.watch(
						this.deps.getRoomId(),
						folder.id,
						(paths) => this.deps.onFilesChanged(folder.id, paths),
					),
				);
			}
		}
	}
}
