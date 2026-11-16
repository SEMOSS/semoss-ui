import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TreeView } from "@semoss/ui/next";
import type { FileItem } from "./file.types";
import type { FileExplorerApi } from "./file-explorer.types";
import { FileExplorerItem } from "./file-explorer-item";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en" },
	}),
}));

// a file row lists nothing, so the server is never asked
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ insightId: "insight-1" }),
	usePixel: () => ({ status: "SUCCESS", data: [], refresh: vi.fn() }),
}));

const FILE: FileItem = { name: "notes.md", path: "/notes.md" };

/**
 * One row in a tree, with an explorer that records menu requests. A folder
 * row can be shown open, over the children its listing holds.
 */
const renderRow = ({
	isBulkSelected = false,
	item = FILE,
	children = [] as FileItem[],
	listingNote = undefined as
		| ((items: FileItem[], path: string) => string | undefined)
		| undefined,
} = {}) => {
	const openContextMenu = vi.fn();
	const explorer = {
		instanceId: "explorer-1",
		adapter: { browse: () => "", mapEntries: () => children },
		capabilities: { mutate: true },
		commands: { move: vi.fn(), rename: vi.fn(), renameTo: vi.fn() },
		dnd: {
			enabled: false,
			canDrag: false,
			activeDropTargetPath: null,
			activeDragItems: [],
		},
		tree: {
			renamingPath: null,
			dateColWidth: 170,
			registerItem: vi.fn(),
			registerDirectoryRefresh: vi.fn(),
			isContextActive: () => false,
			isBulkSelected: () => isBulkSelected,
			openContextMenu: openContextMenu,
			toggleBulkSelection: vi.fn(),
			cancelRename: vi.fn(),
		},
	} as unknown as FileExplorerApi;

	render(
		<TreeView
			expanded={children.length > 0 ? [item.path] : []}
			onExpandChange={vi.fn()}
		>
			<FileExplorerItem
				explorer={explorer}
				item={item}
				listingNote={listingNote}
			/>
		</TreeView>,
	);
	return openContextMenu;
};

describe("FileExplorerItem", () => {
	afterEach(() => {
		cleanup();
	});

	it("opens the row's menu from its More actions button", () => {
		const openContextMenu = renderRow();

		fireEvent.click(
			screen.getByRole("button", { name: "fileExplorer.moreActionsFor" }),
		);

		expect(openContextMenu).toHaveBeenCalledWith(
			expect.anything(),
			FILE,
			"/",
			[],
		);
	});

	it("opens the row's menu with Shift+F10 and with the menu key", () => {
		const openContextMenu = renderRow();
		// the keys act on the focused row, which TreeViewItem keeps focus on
		const row = screen.getByRole("treeitem");

		fireEvent.keyDown(row, { key: "F10", shiftKey: true });
		fireEvent.keyDown(row, { key: "ContextMenu" });

		expect(openContextMenu).toHaveBeenCalledTimes(2);
		expect(openContextMenu).toHaveBeenLastCalledWith(
			expect.anything(),
			FILE,
			"/",
			[],
		);
	});

	it("leaves other keys to the tree", () => {
		const openContextMenu = renderRow();

		fireEvent.keyDown(screen.getByRole("treeitem"), { key: "F10" });

		expect(openContextMenu).not.toHaveBeenCalled();
	});

	it("highlights a selected row with its icon, not just its label", () => {
		renderRow({ isBulkSelected: true });

		// the row's first child holds its leading icon and its label together
		expect(
			screen.getByRole("treeitem").firstElementChild?.classList,
		).toContain("bg-primary/10");
	});

	it("shows the host's note under an open folder's children, and none when the host has nothing to say", () => {
		const folder: FileItem = {
			name: "Reports",
			path: "/Reports/",
			type: "directory",
		};
		const children: FileItem[] = [
			{ name: "a.md", path: "/Reports/a.md" },
			{ name: "b.md", path: "/Reports/b.md" },
		];
		const listingNote = vi.fn((items: FileItem[], path: string) =>
			path === "/Reports/"
				? `${items.length} listed in ${path}`
				: undefined,
		);

		renderRow({ item: folder, children, listingNote });

		// throws when the note is not there
		screen.getByText("2 listed in /Reports/");
		// asked about the folder's own listing only: a file row lists nothing
		expect(listingNote).toHaveBeenCalledWith(children, "/Reports/");
		expect(
			listingNote.mock.calls.every(([, path]) => path === "/Reports/"),
		).toBe(true);
	});
});
