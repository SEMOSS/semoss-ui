import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type UsePagedListOptions, usePagedList } from "./use-paged-list";

interface Row {
	id: string;
}

type LoadPage = UsePagedListOptions<Row>["loadPage"];
type CountRows = UsePagedListOptions<Row>["countRows"];

const ROWS: Row[] = [{ id: "sales" }, { id: "support" }];

/** A promise the test settles by hand */
function defer<T>() {
	let resolve: (value: T) => void = () => {};
	let reject: (reason: unknown) => void = () => {};
	const promise = new Promise<T>((onResolve, onReject) => {
		resolve = onResolve;
		reject = onReject;
	});
	return { promise, resolve, reject };
}

/** Render the hook with options a test can replace through rerender */
const renderList = (options: UsePagedListOptions<Row>) =>
	renderHook((props: UsePagedListOptions<Row>) => usePagedList(props), {
		initialProps: options,
	});

describe("usePagedList", () => {
	it("is loading until the first page arrives, then shows the rows and count", async () => {
		const page = defer<Row[]>();
		const loadPage = vi.fn<LoadPage>(() => page.promise);
		const countRows = vi.fn<CountRows>().mockResolvedValue(2);
		const { result } = renderList({ loadPage, countRows });

		expect(result.current.isLoading).toBe(true);
		expect(result.current.rows).toEqual([]);
		expect(result.current.error).toBeNull();

		await act(async () => page.resolve(ROWS));

		await waitFor(() => expect(result.current.totalCount).toBe(2));
		expect(result.current.rows).toEqual(ROWS);
		expect(result.current.isLoading).toBe(false);
		expect(loadPage).toHaveBeenCalledExactlyOnceWith(50, 0);
		expect(countRows).toHaveBeenCalledTimes(1);
	});

	it("reads the page at the size and offset of the pagination", async () => {
		const loadPage = vi.fn<LoadPage>().mockResolvedValue(ROWS);
		const countRows = vi.fn<CountRows>().mockResolvedValue(120);
		const { result } = renderList({
			loadPage,
			countRows,
			initialRowsPerPage: 25,
		});
		await waitFor(() => expect(result.current.totalCount).toBe(120));

		act(() => result.current.pagination.setPage(2));

		await waitFor(() => expect(loadPage).toHaveBeenLastCalledWith(25, 50));
		expect(loadPage).toHaveBeenNthCalledWith(1, 25, 0);
	});

	it("keeps the last count and reports the error when a count fails", async () => {
		const loadPage = vi.fn<LoadPage>().mockResolvedValue(ROWS);
		const countRows = vi
			.fn<CountRows>()
			.mockResolvedValueOnce(2)
			.mockRejectedValueOnce(new Error("Count failed"));
		const { result } = renderList({ loadPage, countRows });
		await waitFor(() => expect(result.current.totalCount).toBe(2));
		await waitFor(() => expect(result.current.isLoading).toBe(false));

		act(() => result.current.refresh());

		await waitFor(() => expect(result.current.error).toBe("Count failed"));
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.totalCount).toBe(2);
		expect(result.current.rows).toEqual(ROWS);
		expect(result.current.error).toBe("Count failed");
	});

	it("empties the rows and reports the error when a page fails", async () => {
		const loadPage = vi
			.fn<LoadPage>()
			.mockResolvedValueOnce(ROWS)
			.mockRejectedValueOnce(new Error("Page failed"));
		const countRows = vi.fn<CountRows>().mockResolvedValue(2);
		const { result } = renderList({ loadPage, countRows });
		await waitFor(() => expect(result.current.rows).toEqual(ROWS));

		act(() => result.current.refresh());

		await waitFor(() => expect(result.current.error).toBe("Page failed"));
		expect(result.current.rows).toEqual([]);
		expect(result.current.isLoading).toBe(false);
	});

	it("says errorMessage when a read fails without a message", async () => {
		const loadPage = vi.fn<LoadPage>().mockRejectedValue("offline");
		const countRows = vi.fn<CountRows>().mockResolvedValue(0);
		const { result } = renderList({
			loadPage,
			countRows,
			errorMessage: "Could not load the teams",
		});

		await waitFor(() =>
			expect(result.current.error).toBe("Could not load the teams"),
		);
	});

	it("reads the page and the count again on refresh and on a new refreshKey", async () => {
		const loadPage = vi.fn<LoadPage>().mockResolvedValue(ROWS);
		const countRows = vi.fn<CountRows>().mockResolvedValue(2);
		const { result, rerender } = renderList({
			loadPage,
			countRows,
			refreshKey: 0,
		});
		await waitFor(() => expect(result.current.isLoading).toBe(false));

		rerender({ loadPage, countRows, refreshKey: 0 });
		expect(loadPage).toHaveBeenCalledTimes(1);

		rerender({ loadPage, countRows, refreshKey: 1 });
		await waitFor(() => expect(loadPage).toHaveBeenCalledTimes(2));
		expect(countRows).toHaveBeenCalledTimes(2);

		act(() => result.current.refresh());
		await waitFor(() => expect(loadPage).toHaveBeenCalledTimes(3));
		expect(countRows).toHaveBeenCalledTimes(3);
		await waitFor(() => expect(result.current.isLoading).toBe(false));
	});

	it("drops a page and a count that a newer query replaced", async () => {
		const stalePage = defer<Row[]>();
		const staleCount = defer<number>();
		const firstLoad = vi.fn<LoadPage>(() => stalePage.promise);
		const firstCount = vi.fn<CountRows>(() => staleCount.promise);
		const secondLoad = vi.fn<LoadPage>().mockResolvedValue([{ id: "new" }]);
		const secondCount = vi.fn<CountRows>().mockResolvedValue(1);
		const { result, rerender } = renderList({
			loadPage: firstLoad,
			countRows: firstCount,
		});

		rerender({ loadPage: secondLoad, countRows: secondCount });
		await waitFor(() =>
			expect(result.current.rows).toEqual([{ id: "new" }]),
		);
		await waitFor(() => expect(result.current.totalCount).toBe(1));

		await act(async () => {
			stalePage.resolve([{ id: "old" }]);
			staleCount.resolve(99);
		});

		expect(result.current.rows).toEqual([{ id: "new" }]);
		expect(result.current.totalCount).toBe(1);
		expect(result.current.isLoading).toBe(false);
	});
});
