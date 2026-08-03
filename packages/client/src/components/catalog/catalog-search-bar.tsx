import {
	ArrowDown,
	ArrowUp,
	LayoutGrid,
	List,
	SearchIcon,
	X,
} from "lucide-react";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

interface SortOption {
	value: string;
	label: string;
}

export interface CatalogSearchBarProps {
	/** Current search value */
	search: string;

	/** Callback when search value changes */
	onSearchChange: (value: string) => void;

	/** Placeholder text for search input */
	placeholder?: string;

	/** Current sort value */
	sortValue: string;

	/** Current sort order */
	sortOrder: "ASC" | "DESC";

	/** Available sort options */
	sortOptions?: SortOption[];

	/** Callback when sort key changzes */
	onSortChange: (sortValue: string, sortOrder: "ASC" | "DESC") => void;

	/** Show the ability to switch grid styles */
	showGridStyle: boolean;

	/** Card style for the catalog items */
	gridStyle: "LIST" | "CARD";

	/** Callback when card style changes */
	onGridStyleChange: (gridStyle: "LIST" | "CARD") => void;
}

/**
 * Catalog Search Bar Component
 * Provides search input with sort controls following the engine-index-page style
 */
export const CatalogSearchBar = ({
	search,
	onSearchChange,
	placeholder = "Search",
	sortValue,
	sortOrder,
	sortOptions = [],
	onSortChange,
	showGridStyle = true,
	gridStyle = "LIST",
	onGridStyleChange = () => null,
}: CatalogSearchBarProps) => {
	return (
		<div className="flex w-full min-w-0 flex-wrap items-end gap-2 md:flex-nowrap">
			<InputGroup className="flex-1">
				<InputGroupAddon>
					<SearchIcon className="size-4 text-muted-foreground" />
				</InputGroupAddon>
				<InputGroupInput
					placeholder={placeholder}
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					data-testid="search-bar"
				/>
				{search && (
					<InputGroupAddon align="inline-end">
						<InputGroupButton
							size="icon-xs"
							variant="ghost"
							onClick={() => onSearchChange("")}
							aria-label="Clear search"
						>
							<X className="size-4" />
						</InputGroupButton>
					</InputGroupAddon>
				)}
			</InputGroup>
			<div className="flex w-auto shrink-0 items-center gap-1">
				<div className="w-[136px] sm:w-[148px]">
					<Select
						value={sortValue}
						onValueChange={(value) =>
							onSortChange(value, sortOrder)
						}
					>
						<SelectTrigger
							className="h-9 w-full"
							aria-label="Sort By"
						>
							<SelectValue placeholder="Name" />
						</SelectTrigger>
						<SelectContent>
							{sortOptions.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex shrink-0 items-center gap-1">
					<Button
						variant={sortOrder === "ASC" ? "default" : "outline"}
						size="icon-sm"
						className="h-9 w-9"
						title="Ascending Order"
						aria-label="Ascending Order"
						onClick={() => onSortChange(sortValue, "ASC")}
					>
						<ArrowUp className="size-4" />
					</Button>
					<Button
						variant={sortOrder === "DESC" ? "default" : "outline"}
						size="icon-sm"
						className="h-9 w-9"
						title="Descending Order"
						aria-label="Descending Order"
						onClick={() => onSortChange(sortValue, "DESC")}
					>
						<ArrowDown className="size-4" />
					</Button>
				</div>
				{showGridStyle && (
					<div className="flex shrink-0 items-center gap-1">
						<Button
							variant={
								gridStyle === "LIST" ? "secondary" : "outline"
							}
							size="icon-sm"
							className="h-9 w-9"
							aria-label="List view"
							title="List view"
							onClick={() => onGridStyleChange("LIST")}
						>
							<List className="size-4" />
						</Button>
						<Button
							variant={
								gridStyle === "CARD" ? "secondary" : "outline"
							}
							size="icon-sm"
							className="h-9 w-9"
							aria-label="Grid view"
							title="Grid view"
							onClick={() => onGridStyleChange("CARD")}
						>
							<LayoutGrid className="size-4" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};
