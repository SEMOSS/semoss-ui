import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigStore, SessionStore } from "@semoss/sdk";
import { SessionProvider } from "@semoss/sdk/react";
import type {
	FileExplorerApi,
	FileExplorerOptions,
	FileMode,
	FileSource,
} from "@semoss/shared";
import {
	createWorkbenchStore,
	type WorkbenchPanelConfigAny,
	WorkbenchProvider,
} from "@semoss/workbench";
import { FILE_PANEL_TYPES } from "../../constants/file-panel.constants";
import {
	type FileSources,
	FileSourcesProvider,
} from "../../contexts/file-sources.context";
import { FILE_EXPLORER_PANEL } from "./file-explorer-panel";

// the tree itself is not under test: what matters is what the panel hands the
// explorer, and what it does with the paths the explorer reports back
const captured = vi.hoisted(() => ({
	options: null as unknown as FileExplorerOptions,
	calls: [] as FileExplorerOptions[],
	explorer: {
		capabilities: { mutate: true, upload: true },
		header: { path: "/" },
		commands: { refresh: () => undefined, openNewFile: () => undefined },
	},
}));
vi.mock("@semoss/shared", async () => {
	const actual =
		await vi.importActual<typeof import("@semoss/shared")>(
			"@semoss/shared",
		);
	return {
		...actual,
		FileExplorer: () => null,
		FileExplorerHeader: () => null,
		FileExplorerNewAction: () => null,
		FileExplorerRefreshAction: () => null,
		NewFileOverlay: () => null,
		useFileExplorer: (options: FileExplorerOptions) => {
			if (options.mode.type !== "MOUNT") {
				captured.options = options;
			}
			captured.calls.push(options);
			return {
				...captured.explorer,
				mode: options.mode,
			} as unknown as FileExplorerApi;
		},
	};
});
vi.mock("@semoss/sdk/react", async () => ({
	...(await vi.importActual<typeof import("@semoss/sdk/react")>(
		"@semoss/sdk/react",
	)),
	useInsight: () => ({ actions: { run: vi.fn() } }),
}));

const PROJECT_ID = "project-1";
const MODE: FileMode = { type: "APP", app: PROJECT_ID };
const EXPLORER_ID = "explorer";
const COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[FILE_PANEL_TYPES.FILE_CODE_EDITOR]: {
		name: "Editor",
		content: () => null,
	},
	[FILE_PANEL_TYPES.FILE_PDF_VIEWER]: { name: "PDF", content: () => null },
};
const FileExplorerPanel = FILE_EXPLORER_PANEL.content;

/** The explorer panel in a dock that already has `/public/a.txt` open. */
const setup = (rootPath?: string, sources?: FileSources) => {
	const session = new SessionStore({ config: new ConfigStore() });
	vi.spyOn(session.permissions, "load").mockReturnValue(
		new Promise(() => undefined),
	);
	session.permissions.sync("PROJECT", PROJECT_ID, "EDIT");

	const store = createWorkbenchStore({ components: COMPONENTS });
	const { actions } = store.getState().layout;
	actions.loadSnapshot({
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [EXPLORER_ID],
			activeId: EXPLORER_ID,
		},
		panels: {
			[EXPLORER_ID]: {
				id: EXPLORER_ID,
				type: FILE_PANEL_TYPES.FILE_EXPLORER,
				name: "Files",
				config: rootPath ? { mode: MODE, rootPath } : { mode: MODE },
			},
		},
	});
	const openId = actions.spawnPanel(FILE_PANEL_TYPES.FILE_CODE_EDITOR, {
		config: { mode: MODE, name: "a.txt", path: "/public/a.txt" },
		name: "a.txt",
	});

	render(
		<SessionProvider session={session}>
			<WorkbenchProvider store={store}>
				{sources ? (
					<FileSourcesProvider sources={sources}>
						<FileExplorerPanel id={EXPLORER_ID} />
					</FileSourcesProvider>
				) : (
					<FileExplorerPanel id={EXPLORER_ID} />
				)}
			</WorkbenchProvider>
		</SessionProvider>,
	);

	const paths = (): string[] =>
		store
			.getState()
			.layout.actions.findPanels((record) => record.id !== EXPLORER_ID)
			.map((record) => (record.config as { path: string }).path);

	return { openId, paths, store };
};

describe("FileExplorerPanel", () => {
	beforeEach(() => {
		captured.options = null as unknown as FileExplorerOptions;
		captured.calls = [];
	});

	it("browses the whole asset tree when it is given no root", () => {
		const { paths } = setup();

		expect(captured.options.adapter).toBeUndefined();
		act(() =>
			captured.options.onItemSelect?.({
				name: "guide.pdf",
				path: "/guide.pdf",
			}),
		);

		expect(paths()).toEqual(["/public/a.txt", "/guide.pdf"]);
	});

	it("keeps the explorer to its root folder", () => {
		setup("/public");

		expect(captured.options.adapter?.browse("/")).toBe(
			'BrowseAppAssets(filePath=["/public/"], project=["project-1"]);',
		);
	});

	it("opens a file from a rooted explorer at its place in the source", () => {
		const { paths } = setup("/public");

		act(() =>
			captured.options.onItemSelect?.({
				name: "guide.pdf",
				path: "/guide.pdf",
			}),
		);

		expect(paths()).toEqual(["/public/a.txt", "/public/guide.pdf"]);
	});

	it("moves and closes the open tabs a rooted explorer's changes touch", () => {
		const { openId, paths, store } = setup("/public");

		act(() =>
			captured.options.onItemsMoved?.([
				{
					item: { name: "a.txt", path: "/a.txt" },
					oldPath: "/a.txt",
					newPath: "/b.txt",
				},
			]),
		);
		expect(store.getState().layout.panels[openId].config).toMatchObject({
			path: "/public/b.txt",
		});

		act(() =>
			captured.options.onItemsDeleted?.([
				{ name: "b.txt", path: "/b.txt" },
			]),
		);
		expect(paths()).toEqual([]);
	});

	describe("with a host's mounts", () => {
		const SOURCE = { capabilities: {} } as unknown as FileSource;
		const sources = (
			overrides: Partial<FileSources> = {},
		): FileSources => ({
			primaryLabel: "Room Files",
			isShownIn: () => true,
			missingMountMessage: "Not here",
			groups: [{ id: "desktop", label: "Desktop" }],
			mounts: [
				{ id: "m1", name: "notes", group: "desktop", source: SOURCE },
			],
			...overrides,
		});

		it("lists each mount under its group, below the panel's own tree", () => {
			setup(undefined, sources());

			expect(
				screen.getByRole("button", { name: "Room Files" }),
			).toBeTruthy();
			expect(
				screen.getByRole("button", { name: "Desktop" }),
			).toBeTruthy();
			expect(screen.getByRole("button", { name: "notes" })).toBeTruthy();
			const mountCall = captured.calls.find(
				(options) => options.mode.type === "MOUNT",
			);
			expect(mountCall?.mode).toEqual({ type: "MOUNT", mountId: "m1" });
			expect(mountCall?.source).toBe(SOURCE);
		});

		it("opens a mount's file in a panel for that mount", () => {
			const { paths, store } = setup(undefined, sources());
			const mountCall = captured.calls.find(
				(options) => options.mode.type === "MOUNT",
			);

			act(() =>
				mountCall?.onItemSelect?.({ name: "a.md", path: "/a.md" }),
			);

			expect(paths()).toEqual(["/public/a.txt", "/a.md"]);
			const opened = store
				.getState()
				.layout.actions.findPanels(
					(record) =>
						(record.config as { path?: string }).path === "/a.md",
				)[0];
			expect(opened?.config).toMatchObject({
				mode: { type: "MOUNT", mountId: "m1" },
			});
		});

		it("collapses a section without dropping its explorer", () => {
			setup(undefined, sources());
			const heading = screen.getByRole("button", { name: "notes" });

			act(() => heading.click());

			expect(heading.getAttribute("aria-expanded")).toBe("false");
			expect(
				captured.calls.filter(
					(options) => options.mode.type === "MOUNT",
				).length,
			).toBeGreaterThan(1);
		});

		it("stays a single tree where the host does not show mounts", () => {
			setup(undefined, sources({ isShownIn: () => false }));

			expect(
				screen.queryByRole("button", { name: "Desktop" }),
			).toBeNull();
			expect(
				captured.calls.some((options) => options.mode.type === "MOUNT"),
			).toBe(false);
		});

		it("moves a section from the keyboard and keeps the order in the panel's config", () => {
			const { store } = setup(undefined, sources());

			fireEvent.keyDown(screen.getByRole("button", { name: "Desktop" }), {
				key: "ArrowUp",
				altKey: true,
			});

			const headings = screen
				.getAllByRole("button", { expanded: true })
				.map((button) => button.textContent);
			expect(headings.indexOf("Desktop")).toBeLessThan(
				headings.indexOf("Room Files"),
			);
			expect(
				store.getState().layout.panels[EXPLORER_ID].config,
			).toMatchObject({
				mode: MODE,
				sections: { order: ["group:desktop", "primary"] },
			});
		});

		it("restores a saved order and puts a line between open sections", () => {
			const { store } = setup(undefined, sources());
			act(() =>
				store.getState().layout.actions.updatePanel(EXPLORER_ID, {
					config: {
						sections: { order: ["group:desktop", "primary"] },
					},
				}),
			);

			const headings = screen
				.getAllByRole("button", { expanded: true })
				.map((button) => button.textContent);
			expect(headings.indexOf("Desktop")).toBeLessThan(
				headings.indexOf("Room Files"),
			);
			expect(screen.getAllByRole("separator")).toHaveLength(1);
		});

		it("drops the line once a section is closed", () => {
			setup(undefined, sources());

			act(() =>
				screen.getByRole("button", { name: "Room Files" }).click(),
			);

			expect(screen.queryByRole("separator")).toBeNull();
		});

		it("hides a group with no mounts and no empty state", () => {
			setup(undefined, sources({ mounts: [] }));

			expect(
				screen.queryByRole("button", { name: "Room Files" }),
			).toBeNull();
		});
	});
});
