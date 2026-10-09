import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@semoss/utility/error";
import {
	type UseServerPaginationResult,
	useServerPagination,
} from "./useServerPagination";

export interface UsePagedListOptions<T> {
	/**
	 * Loads a page of rows. Make it with `useCallback` over whatever it reads,
	 * such as a search, so a new query loads again.
	 */
	loadPage: (limit: number, offset: number) => Promise<T[]>;
	/** Counts every row of the query. Make it with `useCallback` like `loadPage`. */
	countRows: () => Promise<number>;
	/** Rows per page to start with */
	initialRowsPerPage?: number;
	/** What the error says when a read fails without a message */
	errorMessage?: string;
	/** Changing it reads the page and the count again, such as after an edit elsewhere */
	refreshKey?: number;
}

export interface UsePagedListResult<T> {
	/** The rows on the current page */
	rows: T[];
	/** How many rows the query has in all */
	totalCount: number;
	/** Whether a read is in flight; it is true until the first page loads */
	isLoading: boolean;
	/** Why the last read of the page or the count failed, or null */
	error: string | null;
	/** Reads the current page and the count again */
	refresh: () => void;
	/** The page, page size and row range */
	pagination: UseServerPaginationResult;
}

/**
 * Reads a server-paged list: the rows on the current page and the total count.
 * The page reads again when the page, its size, the query or `refresh`
 * changes, and a read a newer one replaced is dropped. A failed count keeps the
 * last count and sets `error`. Callers start a new query on the first page with
 * `pagination.resetPage`.
 *
 * @param options - how to load and count the rows
 * @returns the rows, the read's state, and the pagination
 */
export const usePagedList = <T>({
	loadPage,
	countRows,
	initialRowsPerPage = 50,
	errorMessage = "Could not load this list",
	refreshKey = 0,
}: UsePagedListOptions<T>): UsePagedListResult<T> => {
	const [rows, setRows] = useState<T[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshCount, setRefreshCount] = useState(0);
	const pagination = useServerPagination({
		totalCount,
		initialRowsPerPage,
		pageIndexBase: 0,
	});
	const { limit, offset } = pagination;
	// either a caller's refreshKey or refresh() reads the list again
	const reloadToken = refreshKey + refreshCount;

	useEffect(() => {
		if (reloadToken < 0) {
			return;
		}
		let isStale = false;
		countRows()
			.then((count) => {
				if (!isStale) {
					setTotalCount(Number.isFinite(count) ? count : 0);
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
					setError(getErrorMessage(e, errorMessage));
				}
			});
		return () => {
			isStale = true;
		};
	}, [countRows, reloadToken, errorMessage]);

	useEffect(() => {
		if (reloadToken < 0) {
			return;
		}
		let isStale = false;
		setIsLoading(true);
		setError(null);
		loadPage(limit, offset)
			.then((nextRows) => {
				if (!isStale) {
					setRows(nextRows);
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
					setRows([]);
					setError(getErrorMessage(e, errorMessage));
				}
			})
			.finally(() => {
				if (!isStale) {
					setIsLoading(false);
				}
			});
		return () => {
			isStale = true;
		};
	}, [loadPage, limit, offset, reloadToken, errorMessage]);

	const refresh = useCallback(
		() => setRefreshCount((count) => count + 1),
		[],
	);

	return { rows, totalCount, isLoading, error, refresh, pagination };
};
