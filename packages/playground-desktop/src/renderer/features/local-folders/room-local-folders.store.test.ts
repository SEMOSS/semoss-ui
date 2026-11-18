import { describe, expect, it, vi } from "vitest";
import { createMemoryFileSource } from "../../test/memory-file-source";
import type { LocalFolder, LocalFoldersHost } from "./local-folders-host";
import { RoomLocalFoldersStore } from "./room-local-folders.store";

const NOTES: LocalFolder = { id: "f1", name: "notes" };
const CODE: LocalFolder = { id: "f2", name: "code" };

/** A host whose answers the test hands out, one call at a time. */
const createHost = () => {
	const lists: Array<(folders: LocalFolder[]) => void> = [];
	const stops = new Map<string, ReturnType<typeof vi.fn>>();
	const watchers = new Map<string, (paths?: string[]) => void>();
	const host: LocalFoldersHost = {
		fileManagerName: "Finder",
		list: vi.fn(
			() =>
				new Promise<LocalFolder[]>((resolve) => {
					lists.push(resolve);
				}),
		),
		pick: vi.fn(async () => [NOTES, CODE]),
		detach: vi.fn(async () => [CODE]),
		source: vi.fn(() => createMemoryFileSource()),
		open: vi.fn(async () => undefined),
		reveal: vi.fn(async () => undefined),
		watch: vi.fn((_roomId, folderId, onChange) => {
			const stop = vi.fn();
			stops.set(folderId, stop);
			watchers.set(folderId, onChange);
			return stop;
		}),
	};
	return { host, lists, stops, watchers };
};

const createStore = (host: LocalFoldersHost) => {
	const onFoldersChanged = vi.fn();
	const onFilesChanged = vi.fn();
	const store = new RoomLocalFoldersStore({
		host,
		getRoomId: () => "room-1",
		onFoldersChanged,
		onFilesChanged,
	});
	return { store, onFoldersChanged, onFilesChanged };
};

describe("RoomLocalFoldersStore", () => {
	it("loads the room's folders and tells the room", async () => {
		const { host, lists } = createHost();
		const { store, onFoldersChanged } = createStore(host);

		const loading = store.load();
		expect(store.getSnapshot().status).toBe("LOADING");
		lists[0]?.([NOTES]);
		await loading;

		expect(host.list).toHaveBeenCalledWith("room-1");
		expect(store.getSnapshot()).toMatchObject({
			status: "READY",
			folders: [NOTES],
		});
		expect(onFoldersChanged).toHaveBeenCalledWith([NOTES]);
	});

	it("drops a load that lands after a newer one", async () => {
		const { host, lists } = createHost();
		const { store } = createStore(host);

		const first = store.load();
		const second = store.load();
		lists[1]?.([CODE]);
		await second;
		lists[0]?.([NOTES]);
		await first;

		expect(store.folders).toEqual([CODE]);
	});

	it("keeps its snapshot when a load finds the same folders", async () => {
		const { host, lists } = createHost();
		const { store } = createStore(host);
		const first = store.load();
		lists[0]?.([NOTES]);
		await first;
		const folders = store.folders;

		const second = store.load();
		lists[1]?.([{ ...NOTES }]);
		await second;

		expect(store.folders).toBe(folders);
	});

	it("attaches what the user picks and listens to each folder", async () => {
		const { host, watchers } = createHost();
		const { store, onFilesChanged } = createStore(host);

		await store.attach();

		expect(store.folders).toEqual([NOTES, CODE]);
		expect(store.getSnapshot().isPicking).toBe(false);
		watchers.get("f1")?.(["/q3.md"]);
		expect(onFilesChanged).toHaveBeenCalledWith("f1", ["/q3.md"]);
	});

	it("stops listening to a folder once it is detached", async () => {
		const { host, stops } = createHost();
		const { store } = createStore(host);
		await store.attach();

		await store.detach("f1");

		expect(host.detach).toHaveBeenCalledWith("room-1", "f1");
		expect(store.folders).toEqual([CODE]);
		expect(stops.get("f1")).toHaveBeenCalledTimes(1);
		expect(stops.get("f2")).not.toHaveBeenCalled();
	});

	it("leaves picking once the picker fails", async () => {
		const { host } = createHost();
		vi.mocked(host.pick).mockRejectedValueOnce(new Error("denied"));
		const { store } = createStore(host);

		await expect(store.attach()).rejects.toThrow("denied");

		expect(store.getSnapshot().isPicking).toBe(false);
		expect(store.folders).toEqual([]);
	});

	it("reports a failed load rather than staying LOADING", async () => {
		const { host } = createHost();
		vi.mocked(host.list).mockRejectedValueOnce(new Error("no access"));
		const { store } = createStore(host);

		await store.load();

		expect(store.getSnapshot()).toMatchObject({
			status: "ERROR",
			error: "no access",
		});
	});

	it("gives the tools one folder while the folders are the same", async () => {
		const { host } = createHost();
		const { store } = createStore(host);
		await store.attach();

		expect(store.toolFolder).toBe(store.toolFolder);
		expect(store.toolFolder.folderNames).toEqual(["notes", "code"]);
	});

	it("stops every watcher when the room is dropped", async () => {
		const { host, stops } = createHost();
		const { store } = createStore(host);
		await store.attach();

		store.dispose();

		expect(stops.get("f1")).toHaveBeenCalledTimes(1);
		expect(stops.get("f2")).toHaveBeenCalledTimes(1);
	});
});
