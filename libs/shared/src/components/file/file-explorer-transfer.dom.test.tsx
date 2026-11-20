import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FileItem, FileMode } from "./file.types";
import { FileExplorer } from "./file-explorer";
import type { FileSource } from "./file-source";
import { useFileExplorer } from "./use-file-explorer";

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { language: "en" },
	}),
}));

// both trees are host sources, so nothing here runs a Pixel
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ insightId: "insight-1", actions: { run: vi.fn() } }),
	usePixel: () => ({ status: "SUCCESS", data: [], refresh: vi.fn() }),
}));

const MODE: FileMode = { type: "USER" } as FileMode;

/** A source over a flat map of `path → text`, folders implied by paths. */
const createSource = (files: Record<string, string>) => {
	const write = vi.fn(async (path: string, bytes: Uint8Array) => {
		files[path] = new TextDecoder().decode(bytes);
	});
	const source: FileSource = {
		capabilities: {
			search: false,
			mutate: true,
			upload: true,
			download: false,
			delete: true,
		},
		list: async (directory) => {
			const prefix = directory.endsWith("/")
				? directory
				: `${directory}/`;
			const names = new Map<string, FileItem>();
			for (const path of Object.keys(files)) {
				if (!path.startsWith(prefix)) continue;
				const [name, ...rest] = path.slice(prefix.length).split("/");
				names.set(
					name,
					rest.length > 0
						? { name, path: `${prefix}${name}/`, type: "directory" }
						: { name, path: `${prefix}${name}` },
				);
			}
			return Array.from(names.values());
		},
		read: async (path) => new TextEncoder().encode(files[path] ?? ""),
		write: write,
		move: vi.fn(),
		copy: vi.fn(),
		remove: vi.fn(),
		createFile: vi.fn(),
		createDirectory: vi.fn(async () => undefined),
	};
	return { source, write, files };
};

const Explorer = ({ source }: { source: FileSource }) => {
	const explorer = useFileExplorer({ mode: MODE, source: source });
	return (
		<FileExplorer explorer={explorer} header={null} newFileOverlay={null} />
	);
};

/** What the browser hands drag handlers, enough for the explorer's use. */
const createDataTransfer = () => {
	const data = new Map<string, string>();
	return {
		effectAllowed: "all",
		dropEffect: "none",
		files: [],
		get types() {
			return Array.from(data.keys());
		},
		setData: (type: string, value: string) => data.set(type, value),
		getData: (type: string) => data.get(type) ?? "",
		setDragImage: () => undefined,
	};
};

/** Drag a row by its name onto an element. */
const drag = (name: string, from: HTMLElement, onto: HTMLElement) => {
	const dataTransfer = createDataTransfer();
	const row = Array.from(from.querySelectorAll("[draggable=true]")).find(
		(element) => element.textContent?.includes(name),
	);
	if (!row) throw new Error(`no row for ${name}`);
	fireEvent.dragStart(row, { dataTransfer });
	fireEvent.dragOver(onto, { dataTransfer });
	fireEvent.drop(onto, { dataTransfer });
	fireEvent.dragEnd(row, { dataTransfer });
};

describe("dragging between two explorers", () => {
	afterEach(() => cleanup());

	it("copies a file into the other tree and leaves the original", async () => {
		const from = createSource({ "/a.md": "alpha" });
		const to = createSource({ "/sub/keep.txt": "kept" });
		render(
			<>
				<Explorer source={from.source} />
				<Explorer source={to.source} />
			</>,
		);
		await screen.findByText("a.md");
		await screen.findByText("sub");
		const [fromRoot, toRoot] = screen.getAllByTestId("file-explorer");

		drag("a.md", fromRoot, toRoot);

		await waitFor(() =>
			expect(to.write).toHaveBeenCalledWith("/a.md", expect.anything()),
		);
		expect(to.files["/a.md"]).toBe("alpha");
		expect(from.files["/a.md"]).toBe("alpha");
		expect(from.source.move).not.toHaveBeenCalled();
	});

	it("copies a folder with what is in it onto a folder row", async () => {
		const from = createSource({
			"/docs/a.md": "alpha",
			"/docs/img/b.png": "beta",
		});
		const to = createSource({ "/sub/keep.txt": "kept" });
		render(
			<>
				<Explorer source={from.source} />
				<Explorer source={to.source} />
			</>,
		);
		await screen.findByText("docs");
		const [fromRoot, toRoot] = screen.getAllByTestId("file-explorer");
		const target = await screen.findByTestId("file-explorer-item-root-sub");

		drag("docs", fromRoot, target);

		await waitFor(() =>
			expect(to.files["/sub/docs/img/b.png"]).toBe("beta"),
		);
		expect(to.files["/sub/docs/a.md"]).toBe("alpha");
		expect(toRoot).toBeTruthy();
	});

	it("still moves a row dropped within its own tree", async () => {
		const from = createSource({ "/a.md": "alpha", "/sub/keep.txt": "" });
		render(<Explorer source={from.source} />);
		const target = await screen.findByTestId("file-explorer-item-root-sub");
		const [root] = screen.getAllByTestId("file-explorer");

		drag("a.md", root, target);

		await waitFor(() =>
			expect(from.source.move).toHaveBeenCalledWith("/a.md", "/sub/a.md"),
		);
		expect(from.write).not.toHaveBeenCalled();
	});
});
