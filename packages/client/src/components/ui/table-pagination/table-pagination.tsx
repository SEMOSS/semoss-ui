import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import { useId } from "react";
import {
	Button,
	cn,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

/** Page sizes offered when a table does not choose its own */
const DEFAULT_ROWS_PER_PAGE_OPTIONS = [50, 100, 200];

export interface TablePaginationProps {
	/** The first row on the page, counting from 1, or 0 when there are none */
	startRow: number;
	/** The last row on the page */
	endRow: number;
	/** How many rows there are in all */
	totalCount: number;
	/** The page shown, counting from 0 */
	page: number;
	/** How many pages there are */
	totalPages: number;
	/** Rows per page */
	rowsPerPage: number;
	/** Called with the page to show, counting from 0 */
	onPageChange: (page: number) => void;
	/** Called with the new page size */
	onRowsPerPageChange: (rowsPerPage: number) => void;
	/** Page sizes to offer */
	rowsPerPageOptions?: number[];
	/** Disables the controls, such as while a page loads */
	disabled?: boolean;
	/** Classes for the footer */
	className?: string;
}

/**
 * The footer under a paged table: the page size, which rows are shown, and
 * buttons to move between pages.
 */
export const TablePagination = ({
	startRow,
	endRow,
	totalCount,
	page,
	totalPages,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
	rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
	disabled = false,
	className,
}: TablePaginationProps) => {
	const rowsPerPageId = useId();
	const isFirstPage = page <= 0;
	const isLastPage = page >= totalPages - 1;

	return (
		<div
			className={cn(
				"flex flex-wrap items-center justify-between gap-3 text-muted-foreground text-sm",
				className,
			)}
		>
			<div className="flex items-center gap-2">
				<Label
					htmlFor={rowsPerPageId}
					className="font-normal text-muted-foreground"
				>
					Rows Per Page
				</Label>
				<Select
					value={String(rowsPerPage)}
					onValueChange={(value) =>
						onRowsPerPageChange(Number(value))
					}
					disabled={disabled}
				>
					<SelectTrigger
						id={rowsPerPageId}
						size="sm"
						className="w-20"
					>
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
			<div className="flex items-center gap-3">
				<span aria-live="polite">
					{startRow}-{endRow} of {totalCount}
				</span>
				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon-sm"
						aria-label="First page"
						disabled={disabled || isFirstPage}
						onClick={() => onPageChange(0)}
					>
						<ChevronsLeft className="size-4" aria-hidden />
					</Button>
					<Button
						variant="outline"
						size="icon-sm"
						aria-label="Previous page"
						disabled={disabled || isFirstPage}
						onClick={() => onPageChange(page - 1)}
					>
						<ChevronLeft className="size-4" aria-hidden />
					</Button>
					<Button
						variant="outline"
						size="icon-sm"
						aria-label="Next page"
						disabled={disabled || isLastPage}
						onClick={() => onPageChange(page + 1)}
					>
						<ChevronRight className="size-4" aria-hidden />
					</Button>
					<Button
						variant="outline"
						size="icon-sm"
						aria-label="Last page"
						disabled={disabled || isLastPage}
						onClick={() => onPageChange(totalPages - 1)}
					>
						<ChevronsRight className="size-4" aria-hidden />
					</Button>
				</div>
			</div>
		</div>
	);
};
