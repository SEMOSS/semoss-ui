import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FileItem } from "./file.types";
import type { FileExplorerAdapter } from "./file-explorer.adapters";
import type { FileSource } from "./file-source";
import { uploadToFileSource } from "./file-source";
import { useFileListing } from "./use-file-listing";

const usePixel = vi.fn(
	(_pixel: string, _config?: unknown, _insightId?: string) => ({
		status: "SUCCESS",
		data: [{ name: "a.md", path: "/a.md" }],
		refresh: vi.fn(),
	}),
);

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	usePixel: (pixel: string, config?: unknown, insightId?: string) =>
		usePixel(pixel, config, insightId),
}));

const ADAPTER = {
	capabilities: { search: true },
	browse: (path: string) => `Browse(${path});`,
	search: (path: string, term: string) => `Search(${path},${term});`,
	mapEntries: (raw: unknown) => raw as FileItem[],
} as unknown as FileExplorerAdapter;

/**
 * A source whose listings resolve when the test says.
 */
const createSource = () => {
	const pending: Array<{
		path: string;
		resolve: (items: FileItem[]) => void;
		reject: (error: Error) => void;
	}> = [];
	const source = {
		capabilities: {
			search: false,
			mutate: true,
			upload: true,
			download: false,
			delete: true,
		},
		list: vi.fn(
			(path: string) =>
				new Promise<FileItem[]>((resolve, reject) => {
					pending.push({ path, resolve, reject });
				}),
		),
		write: vi.fn(async () => undefined),
	} as unknown as FileSource;
	return { source, pending };
};

describe("useFileListing", () => {
	it("keeps the Pixel listing for an asset tree", () => {
		const { result } = renderHook(() =>
			useFileListing({
				adapter: ADAPTER,
				insightId: "i1",
				path: "/docs",
				term: "a",
				isSearchAll: true,
				enabled: true,
			}),
		);

		expect(usePixel).toHaveBeenLastCalledWith(
			"Search(,a);",
			{ data: [] },
			"i1",
		);
		expect(result.current.items).toEqual([{ name: "a.md", path: "/a.md" }]);
	});

	it("sends no Pixel while waiting", () => {
		renderHook(() =>
			useFileListing({ adapter: ADAPTER, path: "/", enabled: false }),
		);

		expect(usePixel).toHaveBeenLastCalledWith("", { data: [] }, undefined);
	});

	it("lists a source without Pixels", async () => {
		const { source, pending } = createSource();
		const { result } = renderHook(() =>
			useFileListing({
				adapter: ADAPTER,
				source: source,
				path: "/docs",
				enabled: true,
			}),
		);

		expect(usePixel).toHaveBeenLastCalledWith("", { data: [] }, undefined);
		expect(result.current.status).toBe("LOADING");
		act(() => pending[0]?.resolve([{ name: "b.md", path: "/docs/b.md" }]));

		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(result.current.items).toEqual([
			{ name: "b.md", path: "/docs/b.md" },
		]);
	});

	it("drops a listing that lands after a newer one started", async () => {
		const { source, pending } = createSource();
		const { result, rerender } = renderHook(
			({ path }) =>
				useFileListing({
					adapter: ADAPTER,
					source: source,
					path: path,
					enabled: true,
				}),
			{ initialProps: { path: "/one" } },
		);

		rerender({ path: "/two" });
		act(() => pending[1]?.resolve([{ name: "two", path: "/two/x" }]));
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		act(() => pending[0]?.resolve([{ name: "one", path: "/one/x" }]));

		expect(result.current.items).toEqual([{ name: "two", path: "/two/x" }]);
	});

	it("reports a failed listing and lists again on refresh", async () => {
		const { source, pending } = createSource();
		const { result } = renderHook(() =>
			useFileListing({
				adapter: ADAPTER,
				source: source,
				path: "/",
				enabled: true,
			}),
		);

		act(() => pending[0]?.reject(new Error("Folder is gone")));
		await waitFor(() => expect(result.current.status).toBe("ERROR"));
		expect(result.current.error?.message).toBe("Folder is gone");

		act(() => result.current.refresh());
		expect(source.list).toHaveBeenCalledTimes(2);
	});
});

describe("uploadToFileSource", () => {
	it("writes each file when the source has no upload of its own", async () => {
		const { source } = createSource();
		// jsdom's File has no arrayBuffer; browsers and Electron do
		const file = Object.assign(new File(["hi"], "hi.txt"), {
			arrayBuffer: async () => new Uint8Array([104, 105]).buffer,
		});

		await uploadToFileSource(source, "/docs", [file]);

		expect(source.write).toHaveBeenCalledWith(
			"/docs/hi.txt",
			new Uint8Array([104, 105]),
		);
	});
});
