import { type FSWatcher, watch } from "node:fs";
import { sep } from "node:path";
import { isHiddenName } from "./local-fs";

/** How long a burst of changes is gathered before it is reported. */
const DEBOUNCE_MS = 200;

/** Most paths one report names; past it, it names none, which means "everything". */
const MAX_REPORTED_PATHS = 200;

/** One watched folder. */
interface Watch {
	watcher: FSWatcher;
	/** How many watches asked for it; it closes when the last one stops. */
	count: number;
	/** Changed paths since the last report, or null when too many to name. */
	pending: Set<string> | null;
	timer: ReturnType<typeof setTimeout> | null;
}

/** The folders being watched, by a key the caller chooses. */
export interface FolderWatchers {
	/**
	 * Watch a folder, or count one more watch on it.
	 *
	 * @param key - Names the watch, such as server, room, and folder.
	 * @param path - The folder on the machine.
	 * @param onChange - Told what changed inside it, as `/`-separated paths
	 * starting with `/`, or nothing when it cannot say.
	 */
	watch(
		key: string,
		path: string,
		onChange: (paths?: string[]) => void,
	): void;
	/** Count one watch off, closing the watcher with the last. */
	unwatch(key: string): void;
	/** Close the watchers whose keys start with a prefix, such as a server's. */
	closeMatching(prefix: string): void;
	/** Close every watcher. */
	closeAll(): void;
}

/**
 * Watch folders for changes made outside the app, reporting each burst once.
 *
 * @returns The watchers.
 */
export const createFolderWatchers = (): FolderWatchers => {
	const watches = new Map<string, Watch>();

	const close = (key: string): void => {
		const entry = watches.get(key);
		if (!entry) return;
		if (entry.timer) clearTimeout(entry.timer);
		entry.watcher.close();
		watches.delete(key);
	};

	return {
		watch: (key, path, onChange) => {
			const existing = watches.get(key);
			if (existing) {
				existing.count++;
				return;
			}
			const entry: Watch = {
				// recursive on macOS, Windows, and (from Node 20) Linux
				watcher: watch(path, { recursive: true }),
				count: 1,
				pending: new Set(),
				timer: null,
			};
			entry.watcher.on("change", (_event, filename) => {
				// what is hidden from the page is not reported either
				if (
					typeof filename === "string" &&
					filename.split(sep).some(isHiddenName)
				) {
					return;
				}
				if (entry.pending) {
					if (typeof filename === "string" && filename) {
						entry.pending.add(`/${filename.split(sep).join("/")}`);
					} else {
						entry.pending = null;
					}
					if (
						entry.pending &&
						entry.pending.size > MAX_REPORTED_PATHS
					) {
						entry.pending = null;
					}
				}
				if (entry.timer) return;
				entry.timer = setTimeout(() => {
					const paths = entry.pending
						? [...entry.pending]
						: undefined;
					entry.pending = new Set();
					entry.timer = null;
					onChange(paths);
				}, DEBOUNCE_MS);
			});
			// a folder that went away, or one the system stops watching
			entry.watcher.on("error", () => close(key));
			watches.set(key, entry);
		},
		unwatch: (key) => {
			const entry = watches.get(key);
			if (!entry) return;
			entry.count--;
			if (entry.count <= 0) close(key);
		},
		closeMatching: (prefix) => {
			for (const key of [...watches.keys()]) {
				if (key.startsWith(prefix)) close(key);
			}
		},
		closeAll: () => {
			for (const key of [...watches.keys()]) close(key);
		},
	};
};
