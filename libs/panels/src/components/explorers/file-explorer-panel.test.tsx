import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigStore, SessionStore } from "@semoss/sdk";
import { SessionProvider } from "@semoss/sdk/react";
import type {
	FileExplorerApi,
	FileExplorerOptions,
	FileMode,
} from "@semoss/shared";
import {
	createWorkbenchStore,
	type WorkbenchPanelConfigAny,
	WorkbenchProvider,
} from "@semoss/workbench";
import { FILE_PANEL_TYPES } from "../../constants/file-panel.constants";
import { FILE_EXPLORER_PANEL } from "./file-explorer-panel";

// the tree itself is not under test: what matters is what the panel hands the
// explorer, and what it does with the paths the explorer reports back
const captured = vi.hoisted(() => ({
	options: null as unknown as FileExplorerOptions,
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
		NewFileOverlay: () => null,
		useFileExplorer: (options: FileExplorerOptions) => {
			captured.options = options;
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
const setup = (rootPath?: string) => {
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
				<FileExplorerPanel id={EXPLORER_ID} />
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
});
