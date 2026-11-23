import { type BrowserWindow, dialog, shell } from "electron";
import { realpath, stat } from "node:fs/promises";
import { basename } from "node:path";
import {
	COMMAND_CHANNEL,
	type DesktopCommand,
} from "../../../contract/ipc-contract";
import {
	isLocalFolderId,
	isLocalFolderRef,
	type LocalFolderGrant,
	type LocalFolderRef,
	MAX_FOLDER_SEARCH_RESULTS,
} from "../../../contract/local-folders";
import { handleIpc, type IpcCaller } from "../ipc/handle-ipc";
import type { FolderGrant, FolderGrants } from "./folder-grants";
import { createFolderSearches } from "./folder-searches";
import type { FolderWatchers } from "./folder-watchers";
import { createLocalFs } from "./local-fs";
import { SEARCH_TIME_BUDGET_MS } from "./search-folder";
import createSearchWorker from "./search-folder.worker?nodeWorker";

/** What the local folder handlers act on. */
interface RegisterLocalFoldersOptions {
	/** Who may call: the app page, in the app's window. */
	readonly caller: IpcCaller;
	/** The saved grants. */
	readonly grants: FolderGrants;
	/** The watched folders. */
	readonly watchers: FolderWatchers;
	/** The partition of the server in use, or null before one is saved. */
	readonly getPartition: () => string | null;
	/** The app's window, which the picker belongs to and commands go to. */
	readonly getWindow: () => BrowserWindow | null;
}

/**
 * A grant as the page sees it: no path.
 *
 * @param grant - The saved grant.
 * @returns Its id and name.
 */
const toPageGrant = ({ id, name }: FolderGrant): LocalFolderGrant => ({
	id,
	name,
});

/**
 * A room id argument.
 *
 * @param value - The argument.
 * @returns The id.
 * @throws Error for anything but an id (`isLocalFolderId`).
 */
const readRoomId = (value: unknown): string => {
	if (!isLocalFolderId(value)) {
		throw new Error("A room id is required");
	}
	return value;
};

/**
 * A path argument.
 *
 * @param value - The argument.
 * @returns The path.
 * @throws Error for anything but text.
 */
const readPath = (value: unknown): string => {
	if (typeof value !== "string") {
		throw new Error("A path is required");
	}
	return value;
};

/**
 * The key a folder's watch goes by: its server, room, and attachment, so a
 * server's watches close together.
 *
 * @param partition - The server's partition.
 * @param ref - The room and attachment.
 * @returns The key.
 */
const watchKey = (partition: string, ref: LocalFolderRef): string =>
	`${partition}|${ref.roomId}|${ref.folderId}`;

/**
 * Wire the local folder channels. Folders are attached only through the
 * system's own folder picker, and every file call names a folder by its room
 * and attachment and a path inside it, which `local-fs` keeps inside.
 *
 * @param options - What the handlers act on.
 */
export const registerLocalFolders = ({
	caller,
	grants,
	watchers,
	getPartition,
	getWindow,
}: RegisterLocalFoldersOptions): void => {
	const fs = createLocalFs({
		trash: (path) => shell.trashItem(path),
		openPath: (path) => shell.openPath(path),
		reveal: (path) => shell.showItemInFolder(path),
		// asked here, in main, so nothing a page does can answer it
		confirmRun: async (path) => {
			const options: Electron.MessageBoxOptions = {
				type: "warning",
				buttons: ["Cancel", "Open"],
				defaultId: 0,
				cancelId: 0,
				message: `Open “${basename(path)}”?`,
				detail: "Opening it can run a program on this computer. Open it only if you know where it came from.",
			};
			const window = getWindow();
			const { response } = window
				? await dialog.showMessageBox(window, options)
				: await dialog.showMessageBox(options);
			return response === 1;
		},
	});

	// each search walks its folder in a worker of its own
	const searches = createFolderSearches(createSearchWorker);

	const partitionInUse = (): string => {
		const partition = getPartition();
		if (!partition) throw new Error("No server is in use");
		return partition;
	};

	/** The attached folder a call names, on the server in use. */
	const folderOf = (value: unknown): FolderGrant => {
		if (!isLocalFolderRef(value)) {
			throw new Error("An attached folder is required");
		}
		const grant = grants.get(
			partitionInUse(),
			value.roomId,
			value.folderId,
		);
		if (!grant) throw new Error("That folder is not attached to this chat");
		return grant;
	};

	handleIpc("local-folders:list", caller, (roomId) =>
		grants.list(partitionInUse(), readRoomId(roomId)).map(toPageGrant),
	);

	handleIpc("local-folders:pick", caller, async (roomId) => {
		const room = readRoomId(roomId);
		const partition = partitionInUse();
		const window = getWindow();
		const options: Electron.OpenDialogOptions = {
			title: "Attach Folders",
			buttonLabel: "Attach",
			properties: ["openDirectory", "multiSelections", "createDirectory"],
		};
		const result = window
			? await dialog.showOpenDialog(window, options)
			: await dialog.showOpenDialog(options);
		if (result.canceled || result.filePaths.length === 0) {
			return grants.list(partition, room).map(toPageGrant);
		}
		const folders: string[] = [];
		for (const path of result.filePaths) {
			const real = await realpath(path);
			if ((await stat(real)).isDirectory()) folders.push(real);
		}
		return grants.add(partition, room, folders).map(toPageGrant);
	});

	handleIpc("local-folders:detach", caller, (ref) => {
		const grant = folderOf(ref);
		const { roomId } = ref as LocalFolderRef;
		const partition = partitionInUse();
		watchers.closeMatching(
			watchKey(partition, { roomId, folderId: grant.id }),
		);
		return grants.remove(partition, roomId, grant.id).map(toPageGrant);
	});

	handleIpc("local-folders:watch", caller, (ref) => {
		const grant = folderOf(ref);
		const { roomId } = ref as LocalFolderRef;
		watchers.watch(
			watchKey(partitionInUse(), { roomId, folderId: grant.id }),
			grant.path,
			(paths) => {
				const command: DesktopCommand = {
					type: "local-folders-changed",
					roomId,
					folderId: grant.id,
					paths,
				};
				getWindow()?.webContents.send(COMMAND_CHANNEL, command);
			},
		);
	});

	handleIpc("local-folders:unwatch", caller, (ref) => {
		if (!isLocalFolderRef(ref)) return;
		const partition = getPartition();
		if (partition) watchers.unwatch(watchKey(partition, ref));
	});

	handleIpc("local-fs:list", caller, (ref, path) =>
		fs.list(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:search", caller, (ref, path, term) => {
		const grant = folderOf(ref);
		if (typeof term !== "string") {
			throw new Error("A search term is required");
		}
		return searches.search(
			watchKey(partitionInUse(), ref as LocalFolderRef),
			{
				root: grant.path,
				start: readPath(path),
				term: term,
				limit: MAX_FOLDER_SEARCH_RESULTS,
				timeBudgetMs: SEARCH_TIME_BUDGET_MS,
			},
		);
	});
	handleIpc("local-fs:stat", caller, (ref, path) =>
		fs.stat(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:read", caller, (ref, path) =>
		fs.read(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:write", caller, (ref, path, bytes) => {
		if (!(bytes instanceof Uint8Array)) {
			throw new Error("A file's contents are required");
		}
		return fs.write(folderOf(ref).path, readPath(path), bytes);
	});
	handleIpc("local-fs:create-file", caller, (ref, path) =>
		fs.createFile(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:create-directory", caller, (ref, path) =>
		fs.createDirectory(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:move", caller, (ref, from, to) =>
		fs.move(folderOf(ref).path, readPath(from), readPath(to)),
	);
	handleIpc("local-fs:copy", caller, (ref, from, to) =>
		fs.copy(folderOf(ref).path, readPath(from), readPath(to)),
	);
	handleIpc("local-fs:remove", caller, (ref, path) =>
		fs.remove(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:open", caller, (ref, path) =>
		fs.open(folderOf(ref).path, readPath(path)),
	);
	handleIpc("local-fs:reveal", caller, (ref, path) =>
		fs.reveal(folderOf(ref).path, readPath(path)),
	);
};
