import { describe, expect, it, vi } from "vitest";
import { Blob as NodeBlob } from "node:buffer";
import { createMemoryFileSource } from "../../test/memory-file-source";
import { createDesktopToolsHost } from "./desktop-tools-host";
import type { LocalFolder, LocalFoldersHost } from "./local-folders-host";

// jsdom's Blob has no arrayBuffer; browsers and Electron do
vi.stubGlobal("Blob", NodeBlob);

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	getI18n: () => ({ t: (key: string) => key }),
}));

const NOTES: LocalFolder = { id: "f1", name: "notes" };

/** A machine with one folder, notes, holding `q3.md`, that the room can attach. */
const setup = () => {
	const notes = createMemoryFileSource({ "/q3.md": "# Q3" });
	const folders: LocalFoldersHost = {
		fileManagerName: "Finder",
		list: vi.fn(async () => [NOTES]),
		pick: vi.fn(async () => [NOTES]),
		detach: vi.fn(async () => []),
		source: vi.fn(() => notes),
		open: vi.fn(async () => undefined),
		reveal: vi.fn(async () => undefined),
		watch: vi.fn(() => () => undefined),
	};
	return { host: createDesktopToolsHost(folders), folders, notes };
};

describe("the desktop's tools host", () => {
	it("owns the desktop tools by name, whatever is attached", () => {
		const { host } = setup();
		expect(host.owns("desktop_read")).toBe(true);
		expect(host.owns("desktop_nope")).toBe(false);
		expect(host.owns("folder_read")).toBe(false);
	});

	it("offers a room's folder tools once it has folders, and tells the room", async () => {
		const { host } = setup();
		const onChange = vi.fn();
		host.subscribe("room-1", onChange);
		expect(host.list("room-1")).toEqual([]);

		await host.load?.("room-1");

		expect(onChange).toHaveBeenCalledWith(undefined);
		const tools = host.list("room-1");
		expect(tools.map((tool) => tool.name)).toContain("desktop_read");
		const write = tools.find((tool) => tool.name === "desktop_write");
		expect(write).toMatchObject({
			title: "desktop:localFolders.titles.write",
			usualMode: "ask",
			modeKey: "folder_write",
		});
		const list = tools.find((tool) => tool.name === "desktop_list");
		expect(list?.description).toContain('"notes"');
		// the same tools while the folders are the same
		expect(host.list("room-1")).toBe(tools);
	});

	it("a write lands in the folder and tells its Files", async () => {
		const { host, notes } = setup();
		const onChange = vi.fn();
		host.subscribe("room-1", onChange);
		await host.load?.("room-1");
		const write = host
			.list("room-1")
			.find((tool) => tool.name === "desktop_write");

		const outcome = await write?.run({
			path: "notes/todo.md",
			content: "- ship",
		});

		expect(outcome?.isError).toBe(false);
		expect(notes.files.get("/todo.md")).toBe("- ship");
		expect(onChange).toHaveBeenCalledWith({ mountId: "f1" });
	});

	it("lists the folders in Files, and detaches them when a new chat is left", async () => {
		const { host, folders } = setup();
		host.subscribe("room-1", vi.fn());
		await host.load?.("room-1");

		expect(host.files?.("room-1")?.mounts).toEqual([
			expect.objectContaining({
				id: "f1",
				name: "notes",
				group: "desktop",
			}),
		]);

		await host.discard?.("room-1");
		expect(folders.detach).toHaveBeenCalledWith("room-1", "f1");
	});

	it("lets go of a room once the chat stops listening", async () => {
		const { host } = setup();
		const stop = host.subscribe("room-1", vi.fn());
		await host.load?.("room-1");
		expect(host.list("room-1")).not.toEqual([]);

		stop();

		expect(host.list("room-1")).toEqual([]);
	});
});
