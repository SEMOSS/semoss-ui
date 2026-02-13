import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

export interface PaginationButtonsProps {
	/**
	 * Total number of pages
	 */
	numberOfPages: number;

	/**
	 * Current active page (1-indexed)
	 */
	currentPage: number;

	/**
	 * Number of rows displayed per page
	 */
	rowsPerPage: number;

	/**
	 * Callback to update the current page
	 */
	setCurrentPage: (page: number) => void;

	/**
	 * Callback to update rows per page
	 */
	setRowsPerPage: (rows: number) => void;

	/**
	 * Show rows per page selector
	 * @default true
	 */
	showRowsPerPage?: boolean;

	/**
	 * Available options for rows per page
	 * @default [10, 25, 50, 100]
	 */
	rowsPerPageOptions?: number[];
}

/**
 * Pagination controls component that works with the usePagination hook.
 * Displays page navigation buttons and optionally a rows per page selector.
 *
 * @example
 * ```tsx
 * const pagination = usePagination(totalRows);
 * return <PaginationButtons {...pagination} />;
 * ```
 */
export const PaginationButtons = ({
	numberOfPages,
	currentPage,
	rowsPerPage,
	setCurrentPage,
	setRowsPerPage,
	showRowsPerPage = true,
	rowsPerPageOptions = [10, 25, 50, 100],
}: PaginationButtonsProps) => {
	/**
	 * Generate array of page numbers to display.
	 * Adapts based on current page position:
	 * - Near start: 1, 2, 3, 4, 5, ..., end
	 * - In middle: 1, ..., n-1, n, n+1, ..., end
	 * - Near end: 1, ..., end-4, end-3, end-2, end-1, end
	 */
	const getPageNumbers = (): (number | "ellipsis")[] => {
		if (numberOfPages < 7) {
			// Show all pages if we have fewer than 7
			return Array.from({ length: numberOfPages }, (_, i) => i + 1);
		}

		// Current page is near the start (pages 1-4)
		if (currentPage <= 4) {
			return [1, 2, 3, 4, 5, "ellipsis", numberOfPages];
		}

		// Current page is near the end (last 4 pages)
		if (currentPage >= numberOfPages - 3) {
			return [
				1,
				"ellipsis",
				numberOfPages - 4,
				numberOfPages - 3,
				numberOfPages - 2,
				numberOfPages - 1,
				numberOfPages,
			];
		}

		// Current page is in the middle
		return [
			1,
			"ellipsis",
			currentPage - 1,
			currentPage,
			currentPage + 1,
			"ellipsis",
			numberOfPages,
		];
	};

	const handlePrevious = () => {
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1);
		}
	};

	const handleNext = () => {
		if (currentPage < numberOfPages) {
			setCurrentPage(currentPage + 1);
		}
	};

	return (
		<div className="flex items-center justify-between gap-2">
			{showRowsPerPage && (
				<div className="flex items-center gap-2 text-sm">
					<span className="whitespace-nowrap text-muted-foreground">
						Rows per page:
					</span>
					<Select
						value={String(rowsPerPage)}
						onValueChange={(value) => setRowsPerPage(Number(value))}
					>
						<SelectTrigger size="sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{rowsPerPageOptions.map((option) => (
								<SelectItem key={option} value={String(option)}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}

			<Pagination>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							onClick={handlePrevious}
							aria-disabled={currentPage === 1}
							size="default"
							className={
								currentPage === 1
									? "pointer-events-none opacity-50"
									: "cursor-pointer"
							}
						/>
					</PaginationItem>

					{getPageNumbers().map((page, index) => {
						const key =
							page === "ellipsis"
								? `ellipsis-${index}`
								: `page-${page}`;
						return (
							<PaginationItem key={key}>
								{page === "ellipsis" ? (
									<PaginationEllipsis />
								) : (
									<PaginationLink
										onClick={() => setCurrentPage(page)}
										isActive={currentPage === page}
										size="icon"
										className="cursor-pointer"
									>
										{page}
									</PaginationLink>
								)}
							</PaginationItem>
						);
					})}

					<PaginationItem>
						<PaginationNext
							onClick={handleNext}
							aria-disabled={currentPage === numberOfPages}
							size="default"
							className={
								currentPage === numberOfPages
									? "pointer-events-none opacity-50"
									: "cursor-pointer"
							}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
};
