import { useEffect, useRef } from "react";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	ScrollArea,
	ScrollBar,
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
	const currentPageRef = useRef<HTMLAnchorElement>(null);
	const viewportRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to center the current page button
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only run when currentPage changes
	useEffect(() => {
		// Wait for React to update refs after page change
		const frameId = requestAnimationFrame(() => {
			if (!currentPageRef.current || !viewportRef.current) {
				return;
			}

			const button = currentPageRef.current;
			const viewport = viewportRef.current;

			// Calculate position to center the button
			const buttonLeft = button.offsetLeft;
			const buttonWidth = button.offsetWidth;
			const viewportWidth = viewport.offsetWidth;

			const scrollPosition =
				buttonLeft - viewportWidth / 2 + buttonWidth / 2;

			viewport.scrollTo({
				left: scrollPosition,
				behavior: "smooth",
			});
		});

		return () => cancelAnimationFrame(frameId);
	}, [currentPage]);

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

					{/* Divider */}
					<div className="h-6 w-px bg-border" />

					{/* Scrollable page numbers - shows ~3 at a time */}
					<ScrollArea
						className="-mb-3 h-12 w-[120px]"
						type="always"
						viewportRef={(ele) => {
							viewportRef.current = ele;
						}}
					>
						<div className="flex gap-1 px-1">
							{Array.from(
								{ length: numberOfPages },
								(_, i) => i + 1,
							).map((page) => (
								<PaginationItem key={`page-${page}`}>
									<PaginationLink
										ref={
											page === currentPage
												? currentPageRef
												: undefined
										}
										onClick={() => setCurrentPage(page)}
										isActive={currentPage === page}
										size="icon"
										className="cursor-pointer"
									>
										{page}
									</PaginationLink>
								</PaginationItem>
							))}
						</div>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>

					{/* Divider */}
					<div className="h-6 w-px bg-border" />

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
