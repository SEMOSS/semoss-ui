import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigStore, SessionStore } from "@semoss/sdk";
import { SessionProvider } from "@semoss/sdk/react";
import type {
	FileExplorerApi,
	FileExplorerOptions,
	FileExplorerProps,
	FileMode,
	FileSource,
} from "@semoss/shared";
import {
	createWorkbenchStore,
	type WorkbenchPanelConfigAny,
	WorkbenchProvider,
} from "@semoss/workbench";
import {
	FILE_PANEL_EVENTS,
	FILE_PANEL_TYPES,
} from "../../constants/file-panel.constants";
import {
	type FileSources,
	FileSourcesProvider,
	useFileExplorerRoot,
	useFileMount,
} from "../../contexts/file-sources.context";
import { FILE_EXPLORER_PANEL } from "./file-explorer-panel";

// the tree itself is not under test: what matters is what the panel hands the
// explorer, and what it does with the paths the explorer reports back
const captured = vi.hoisted(() => ({
	options: null as unknown as FileExplorerOptions,
	calls: [] as FileExplorerOptions[],
	props: null as unknown as FileExplorerProps,
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
		FileExplorer: (props: FileExplorerProps) => {
			captured.props = props;
			return null;
		},
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
const setup = (
	rootPath?: string,
	sources?: FileSources,
	hostChildren?: ReactNode,
) => {
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
						{hostChildren}
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

	describe("with a host's roots", () => {
		const SOURCE = { capabilities: {} } as unknown as FileSource;
		const refresh = vi.fn();
		const MOUNT = {
			mode: { type: "MOUNT", mountId: "m1" },
			source: SOURCE,
			commands: { refresh: refresh },
		} as unknown as FileExplorerApi;
		const sources = (
			overrides: Partial<FileSources> = {},
		): FileSources => ({
			primaryLabel: "Room Files",
			isShownIn: () => true,
			missingMountMessage: "Not here",
			...overrides,
		});

		/** A host's component adding one folder, as the desktop app's do. */
		const Folder = () => {
			useFileExplorerRoot({ id: "m1", name: "notes", explorer: MOUNT });
			return null;
		};

		/** What a file panel opened from the folder reads it through. */
		const mounts: (ReturnType<typeof useFileMount> | null)[] = [];
		const MountReader = () => {
			mounts.push(useFileMount({ type: "MOUNT", mountId: "m1" }));
			return null;
		};

		beforeEach(() => {
			refresh.mockClear();
			mounts.length = 0;
		});

		it("lists the host's roots after the panel's own tree", () => {
			setup(undefined, sources(), <Folder />);

			const roots = captured.props.explorers;
			expect(roots.map((root) => root.name)).toEqual([
				"Room Files",
				"notes",
			]);
			expect(roots[1].explorer).toBe(MOUNT);
		});

		it("stays a single tree where the host does not show its roots", () => {
			setup(undefined, sources({ isShownIn: () => false }), <Folder />);

			expect(captured.props.explorers).toHaveLength(1);
		});

		it("keeps the user's arrangement in the panel's config", () => {
			const { store } = setup(undefined, sources(), <Folder />);

			act(() =>
				captured.props.onLayoutChange?.({
					order: ["m1", "primary"],
					collapsed: ["primary"],
				}),
			);

			expect(
				store.getState().layout.panels[EXPLORER_ID].config,
			).toMatchObject({
				mode: MODE,
				roots: { order: ["m1", "primary"], collapsed: ["primary"] },
			});
			expect(captured.props.layout).toEqual({
				order: ["m1", "primary"],
				collapsed: ["primary"],
			});
		});

		it("reads an arrangement saved before the roots were one tree", () => {
			const { store } = setup(undefined, sources(), <Folder />);
			act(() =>
				store.getState().layout.actions.updatePanel(EXPLORER_ID, {
					config: { sections: { order: ["m1", "primary"] } },
				}),
			);

			expect(captured.props.layout).toEqual({ order: ["m1", "primary"] });
		});

		it("refreshes a root when its files change elsewhere", () => {
			const { store } = setup(undefined, sources(), <Folder />);

			act(() =>
				store
					.getState()
					.events.actions.emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
						scope: "MOUNT:m1",
					}),
			);

			expect(refresh).toHaveBeenCalledTimes(1);
		});

		it("gives a panel opened from the folder the folder's source", () => {
			setup(
				undefined,
				sources(),
				<>
					<Folder />
					<MountReader />
				</>,
			);

			expect(mounts.at(-1)).toEqual({
				id: "m1",
				name: "notes",
				source: SOURCE,
			});
		});
	});
});
