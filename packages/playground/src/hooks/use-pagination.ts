import { useCallback, useState } from "react";

/**
 * A hook for managing pagination state and calculations.
 *
 * @param totalRows - The total number of rows/items to paginate
 * @returns An object containing pagination state and controls
 * @returns numberOfPages - The total number of pages based on totalRows and rowsPerPage
 * @returns currentPage - The current active page (1-indexed)
 * @returns rowsPerPage - The number of rows to display per page (default: 10)
 * @returns offset - The calculated offset for array slicing or database queries
 * @returns setCurrentPage - Function to update the current page (validates bounds automatically)
 * @returns setRowsPerPage - Function to update rows per page (resets to page 1)
 *
 * @example
 * ```tsx
 * const { currentPage, rowsPerPage, offset, numberOfPages, setCurrentPage } = usePagination(100);
 * const paginatedData = data.slice(offset, offset + rowsPerPage);
 * ```
 */
export const usePagination = (
	totalRows: number,
): {
	numberOfPages: number;
	currentPage: number;
	rowsPerPage: number;
	offset: number;
	setCurrentPage: (page: number) => void;
	setRowsPerPage: (rows: number) => void;
} => {
	// Track the current page number (1-indexed)
	const [currentPage, setCurrentPage] = useState(1);

	// Track how many rows to display per page (default: 10)
	const [rowsPerPage, setRowsPerPage] = useState(10);

	// Calculate total number of pages
	// Guard against division by zero if rowsPerPage is 0 or negative
	const numberOfPages =
		rowsPerPage <= 0 ? 0 : Math.ceil(totalRows / rowsPerPage);

	// Calculate the starting index for array slicing or database OFFSET
	// Example: page 1 → offset 0, page 2 with 10 rows → offset 10
	const offset = (currentPage - 1) * rowsPerPage;

	/**
	 * Update the current page with automatic bounds validation.
	 * Ensures the page stays between 1 and numberOfPages.
	 */
	const handleSetCurrentPage = useCallback(
		(page: number) => {
			// Ensure we have at least 1 page
			const maxPage = numberOfPages || 1;
			// Clamp the page between 1 and maxPage
			const validPage = Math.max(1, Math.min(page, maxPage));
			setCurrentPage(validPage);
		},
		[numberOfPages],
	);

	/**
	 * Update rows per page and reset to the first page.
	 * Resetting prevents being on an invalid page after changing page size.
	 */
	const handleSetRowsPerPage = useCallback((rows: number) => {
		setRowsPerPage(rows);
		// Reset to page 1 when rows per page changes
		setCurrentPage(1);
	}, []);

	return {
		numberOfPages,
		currentPage,
		rowsPerPage,
		offset,
		setCurrentPage: handleSetCurrentPage,
		setRowsPerPage: handleSetRowsPerPage,
	};
};
