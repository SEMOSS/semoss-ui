import { Spinner } from "@semoss/ui/next";

export interface CatalogGridProps {
	/** Grid style - LIST for single column, CARD for multi-column grid */
	variant?: "LIST" | "CARD";
	/** Child elements to render in the grid */
	children?: React.ReactNode;
	/** Whether data is currently loading */
	isLoading?: boolean;
	/** Whether to show loading spinner (when there are already items) */
	showLoadingMore?: boolean;
	/** Number of columns for the grid layout (for CARD style) */
	columns?: 1 | 2 | 3;
	/** Gap size between items */
	gap?: 2 | 3 | 4 | 6;
}

const COLUMN_CLASSES = {
	1: "grid-cols-1",
	2: "grid-cols-1 lg:grid-cols-2",
	3: "grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3",
};

const GAP_CLASSES = {
	2: "gap-2",
	3: "gap-3",
	4: "gap-4",
	6: "gap-6",
};

/**
 * Catalog Grid Component
 * Provides a responsive grid layout for catalog cards
 */
export const CatalogGrid = ({
	variant = "LIST",
	children,
	isLoading = false,
	showLoadingMore = false,
	columns = 3,
	gap = 3,
}: CatalogGridProps) => {
	const containerClass =
		variant === "LIST"
			? `flex flex-col w-full ${GAP_CLASSES[gap]}`
			: `grid ${COLUMN_CLASSES[columns]} ${GAP_CLASSES[gap]}`;

	return (
		<>
			<div className={containerClass}>{children}</div>
			{showLoadingMore && isLoading && (
				<div className="flex items-center justify-center py-2">
					<Spinner className="size-4" />
				</div>
			)}
		</>
	);
};
