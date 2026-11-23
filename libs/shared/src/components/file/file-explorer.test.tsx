import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FileItem } from "./file.types";
import { FileExplorer, type FileExplorerProps } from "./file-explorer";
import type { FileExplorerApi } from "./file-explorer.types";
import { FileExplorerHeader } from "./file-explorer-header";
import type { FileSource } from "./file-source";
import { useSourceFileExplorer } from "./use-source-file-explorer";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en" },
	}),
}));

// every tree is a host source, so nothing here runs a Pixel
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ insightId: "insight-1", actions: { run: vi.fn() } }),
	usePixel: () => ({ status: "SUCCESS", data: [], refresh: vi.fn() }),
}));

/** A read-only source listing the files of a flat map. */
const createSource = (paths: string[]): FileSource =>
	({
		capabilities: {
			search: false,
			mutate: false,
			upload: false,
			download: false,
			delete: false,
		},
		list: async (directory: string): Promise<FileItem[]> =>
			paths
				.filter((path) => path.startsWith(directory))
				.map((path) => ({ name: path.slice(1), path: path })),
	}) as unknown as FileSource;

/** A source with nothing in it; one, so its identity holds. */
const EMPTY = createSource([]);

const SOURCES = {
	room: createSource(["/report.pdf"]),
	notes: createSource(["/todo.md"]),
};

type ExplorerProps = Omit<FileExplorerProps, "explorers" | "newFileOverlay">;

/** One tree per id, each from the source hook, as a host builds them. */
const Explorer = ({
	ids,
	...props
}: ExplorerProps & { ids: (keyof typeof SOURCES)[] }) => {
	const room = useSourceFileExplorer({
		mountId: "room",
		source: SOURCES.room,
	});
	const notes = useSourceFileExplorer({
		mountId: "notes",
		source: SOURCES.notes,
	});
	const explorers = { room: room, notes: notes };

	return (
		<FileExplorer
			{...props}
			explorers={ids.map((id) => ({
				id: id,
				name: id === "room" ? "Room Files" : "notes",
				explorer: explorers[id],
			}))}
			newFileOverlay={null}
		/>
	);
};

const header = () => <div data-testid="header" />;

describe("FileExplorer", () => {
	afterEach(() => cleanup());

	it("draws one tree as a plain tree, with no root row", async () => {
		render(<Explorer ids={["room"]} header={header} />);

		await screen.findByText("report.pdf");
		expect(screen.queryByTestId("file-explorer-root-row")).toBeNull();
		expect(screen.getAllByTestId("header")).toHaveLength(1);
	});

	it("draws a row per root, and one header and column header for them all", async () => {
		render(<Explorer ids={["room", "notes"]} header={header} />);

		await screen.findByText("report.pdf");
		await screen.findByText("todo.md");
		const rows = screen.getAllByTestId("file-explorer-root-row");
		expect(rows.map((row) => row.textContent)).toEqual([
			"Room Files",
			"notes",
		]);
		expect(screen.getAllByTestId("header")).toHaveLength(1);
		expect(
			screen.getAllByTestId("file-explorer-date-column-resizer"),
		).toHaveLength(1);
		// they stack at their own height in one scroll, with no resize line
		expect(screen.queryByRole("separator", { name: /resize/i })).toBeNull();
	});

	it("makes the root the user works in the active one", async () => {
		const onActiveRootChange =
			vi.fn<(root: { id: string }, explorer: FileExplorerApi) => void>();
		render(
			<Explorer
				ids={["room", "notes"]}
				header={header}
				onActiveRootChange={onActiveRootChange}
			/>,
		);

		await screen.findByText("todo.md");
		expect(onActiveRootChange.mock.lastCall?.[0].id).toBe("room");

		fireEvent.pointerDown(screen.getByText("todo.md"));

		expect(onActiveRootChange.mock.lastCall?.[0].id).toBe("notes");
		expect(onActiveRootChange.mock.lastCall?.[1].mode).toEqual({
			type: "MOUNT",
			mountId: "notes",
		});
	});

	it("closes a root and moves one from the keyboard, telling the host", async () => {
		const onLayoutChange = vi.fn();
		render(
			<Explorer
				ids={["room", "notes"]}
				header={header}
				onLayoutChange={onLayoutChange}
			/>,
		);
		await screen.findByText("todo.md");
		const notes = within(
			screen.getByTestId("file-explorer-root-notes"),
		).getByRole("button", { expanded: true });

		act(() => notes.click());
		expect(onLayoutChange).toHaveBeenLastCalledWith({
			collapsed: ["notes"],
		});
		expect(notes.getAttribute("aria-expanded")).toBe("false");

		fireEvent.keyDown(notes, { key: "ArrowUp", altKey: true });
		expect(onLayoutChange).toHaveBeenLastCalledWith({
			collapsed: ["notes"],
			order: ["notes", "room"],
		});
	});

	it("gives every root the width the active root's date column has", async () => {
		render(<Explorer ids={["room", "notes"]} header={header} />);
		await screen.findByText("todo.md");

		fireEvent.keyDown(
			screen.getByTestId("file-explorer-date-column-resizer"),
			{ key: "ArrowLeft" },
		);

		const widths = screen
			.getAllByTestId("file-explorer")
			.map((tree) => tree.style.getPropertyValue("--date-col-width"));
		expect(widths).toEqual(["108px", "108px"]);
	});

	it("shows a root's own empty state when its top level holds nothing", async () => {
		const Empty = () => {
			const explorer = useSourceFileExplorer({
				mountId: "desktop",
				source: EMPTY,
			});
			return (
				<FileExplorer
					explorers={[
						{
							id: "desktop",
							name: "Desktop",
							emptyState: (
								<button type="button">Attach Folder</button>
							),
							explorer: explorer,
						},
					]}
					header={header}
					newFileOverlay={null}
				/>
			);
		};
		render(<Empty />);

		expect(
			await screen.findByRole("button", { name: "Attach Folder" }),
		).toBeTruthy();
		expect(screen.queryByText("fileExplorer.emptyFolder")).toBeNull();
	});

	describe("with roots as folders", () => {
		const realHeader: FileExplorerProps["header"] = (active, place) => (
			<FileExplorerHeader explorer={active} place={place} />
		);
		const pathLabel = () =>
			screen.getByTestId("file-explorer-path-dropdown-trigger")
				.textContent;

		it("lists the roots at a top level named Files", async () => {
			render(<Explorer ids={["room", "notes"]} header={realHeader} />);

			await screen.findByText("todo.md");
			expect(pathLabel()).toBe("fileExplorer.roots");
		});

		it("goes into a root on a double-click, and back up with Backspace", async () => {
			render(<Explorer ids={["room", "notes"]} header={realHeader} />);
			await screen.findByText("todo.md");
			const notes = within(
				screen.getByTestId("file-explorer-root-notes"),
			).getByRole("button", { expanded: true });

			act(() => {
				notes.click();
				notes.click();
			});

			// only the root it went into is left, its top named after it
			expect(screen.queryByTestId("file-explorer-root-row")).toBeNull();
			expect(screen.queryByText("report.pdf")).toBeNull();
			expect(pathLabel()).toBe("notes");

			fireEvent.keyDown(await screen.findByRole("tree"), {
				key: "Backspace",
			});

			expect(
				screen.getAllByTestId("file-explorer-root-row"),
			).toHaveLength(2);
			expect(pathLabel()).toBe("fileExplorer.roots");
		});

		it("searches every root from the top level, each its own way", async () => {
			render(<Explorer ids={["room", "notes"]} header={realHeader} />);
			await screen.findByText("todo.md");

			act(() =>
				screen.getByTestId("file-explorer-search-toggle").click(),
			);
			fireEvent.change(screen.getByTestId("file-explorer-search-input"), {
				target: { value: "todo" },
			});

			// room has nothing by that name, notes does
			expect(
				await screen.findByText("fileExplorer.noResults"),
			).toBeTruthy();
			expect(screen.queryByText("report.pdf")).toBeNull();
			expect(screen.getByText("todo.md")).toBeTruthy();
			// the top level's search has no scope to choose
			expect(
				screen.queryByTestId("file-explorer-search-all-toggle"),
			).toBeNull();
		});
	});

	it("keeps the search's filters in a menu inside the search field", async () => {
		const SEARCHABLE = {
			...createSource(["/todo.md"]),
			capabilities: {
				search: true,
				mutate: false,
				upload: false,
				download: false,
				delete: false,
			},
			search: async () => [],
		} as unknown as FileSource;
		const Searchable = () => {
			const explorer = useSourceFileExplorer({
				mountId: "s",
				source: SEARCHABLE,
			});
			return (
				<FileExplorer
					explorers={[{ id: "s", name: "", explorer: explorer }]}
					header={(active) => (
						<FileExplorerHeader explorer={active} />
					)}
					newFileOverlay={null}
				/>
			);
		};
		render(<Searchable />);
		await screen.findByText("todo.md");

		act(() => screen.getByTestId("file-explorer-search-toggle").click());

		// no row of scope buttons under the field: one menu button inside it
		expect(
			screen.queryByTestId("file-explorer-search-all-toggle"),
		).toBeNull();
		expect(
			screen.getByRole("button", { name: "fileExplorer.searchFilters" }),
		).toBeTruthy();
	});
});
