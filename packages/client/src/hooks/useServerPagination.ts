import { useCallback, useEffect, useState } from "react";

export interface UseServerPaginationOptions {
	totalCount: number;
	initialRowsPerPage?: number;
	initialPage?: number;
	pageIndexBase?: 0 | 1;
	isReady?: boolean;
}

export interface UseServerPaginationResult {
	page: number;
	rowsPerPage: number;
	setPage: (nextPage: number) => void;
	setRowsPerPage: (nextRowsPerPage: number) => void;
	resetPage: () => void;
	offset: number;
	limit: number;
	totalPages: number;
	startRow: number;
	endRow: number;
}

export const useServerPagination = (
	options: UseServerPaginationOptions,
): UseServerPaginationResult => {
	const {
		totalCount,
		initialRowsPerPage = 5,
		initialPage,
		pageIndexBase = 0,
		isReady = true,
	} = options;

	const normalizedTotalCount = Number.isFinite(totalCount)
		? Math.max(0, totalCount)
		: 0;

	const [page, setPage] = useState<number>(initialPage ?? pageIndexBase);
	const [rowsPerPage, setRowsPerPageState] =
		useState<number>(initialRowsPerPage);

	const totalPages = Math.max(
		1,
		Math.ceil(normalizedTotalCount / rowsPerPage),
	);
	const maxPage = pageIndexBase === 0 ? totalPages - 1 : totalPages;

	const resetPage = useCallback(() => {
		setPage(pageIndexBase);
	}, [pageIndexBase]);

	const setRowsPerPage = useCallback(
		(nextRowsPerPage: number) => {
			setRowsPerPageState(nextRowsPerPage);
			setPage(pageIndexBase);
		},
		[pageIndexBase],
	);

	useEffect(() => {
		if (!isReady) {
			return;
		}
		if (page < pageIndexBase) {
			setPage(pageIndexBase);
			return;
		}
		if (page > maxPage) {
			setPage(maxPage);
		}
	}, [isReady, maxPage, page, pageIndexBase]);

	const offset =
		pageIndexBase === 0 ? page * rowsPerPage : (page - 1) * rowsPerPage;
	const startRow = normalizedTotalCount === 0 ? 0 : offset + 1;
	const endRow = Math.min(offset + rowsPerPage, normalizedTotalCount);

	return {
		page,
		rowsPerPage,
		setPage,
		setRowsPerPage,
		resetPage,
		offset,
		limit: rowsPerPage,
		totalPages,
		startRow,
		endRow,
	};
};
