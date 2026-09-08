import {
	ArrowDown,
	ArrowUp,
	LayoutGrid,
	List,
	SearchIcon,
	SlidersHorizontal,
	X,
} from "lucide-react";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";

interface SortOption {
	value: string;
	label: string;
}

interface CatalogSearchBarProps {
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
		<div className="flex w-full items-center gap-2">
			<InputGroup className="h-11 w-full min-w-0 rounded-full border-border/80 px-1 shadow-none">
				<InputGroupInput
					placeholder={placeholder}
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					data-testid="search-bar"
				/>
				<InputGroupAddon align="inline-end" className="gap-1 pe-2">
					{search && (
						<InputGroupButton
							size="icon-xs"
							variant="ghost"
							onClick={() => onSearchChange("")}
							aria-label="Clear search"
						>
							<X className="size-4" />
						</InputGroupButton>
					)}
					<SearchIcon className="size-4 text-muted-foreground" />
					{(sortOptions.length > 0 || showGridStyle) && (
						<Popover>
							<PopoverTrigger asChild>
								<Button
									size="icon-sm"
									variant="ghost"
									aria-label="Open catalog options"
									title="Catalog options"
								>
									<SlidersHorizontal className="size-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent
								align="end"
								className="flex w-64 flex-col gap-3 p-3"
							>
								<p className="font-medium text-sm">
									Catalog options
								</p>
								{sortOptions.length > 0 && (
									<div className="flex flex-col gap-1.5">
										<span className="font-medium text-muted-foreground text-xs">
											Sort by
										</span>
										<Select
											value={sortValue}
											onValueChange={(value) =>
												onSortChange(value, sortOrder)
											}
										>
											<SelectTrigger
												className="h-8 w-full"
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
								)}
								<div className="flex flex-col gap-1.5">
									<span className="font-medium text-muted-foreground text-xs">
										Direction
									</span>
									<ToggleGroup
										type="single"
										value={sortOrder}
										variant="outline"
										size="sm"
										className="w-full"
										onValueChange={(value) => {
											if (value) {
												onSortChange(
													sortValue,
													value as "ASC" | "DESC",
												);
											}
										}}
									>
										<ToggleGroupItem
											value="ASC"
											aria-label="Ascending Order"
											className="flex-1"
										>
											<ArrowUp className="size-4" />
											Ascending
										</ToggleGroupItem>
										<ToggleGroupItem
											value="DESC"
											aria-label="Descending Order"
											className="flex-1"
										>
											<ArrowDown className="size-4" />
											Descending
										</ToggleGroupItem>
									</ToggleGroup>
								</div>
								{showGridStyle && (
									<div className="flex flex-col gap-1.5">
										<span className="font-medium text-muted-foreground text-xs">
											View
										</span>
										<ToggleGroup
											type="single"
											value={gridStyle}
											variant="outline"
											size="sm"
											className="w-full"
											onValueChange={(value) => {
												if (value) {
													onGridStyleChange(
														value as
															| "LIST"
															| "CARD",
													);
												}
											}}
										>
											<ToggleGroupItem
												value="LIST"
												aria-label="List view"
												className="flex-1"
											>
												<List className="size-4" />
												List
											</ToggleGroupItem>
											<ToggleGroupItem
												value="CARD"
												aria-label="Grid view"
												className="flex-1"
											>
												<LayoutGrid className="size-4" />
												Cards
											</ToggleGroupItem>
										</ToggleGroup>
									</div>
								)}
							</PopoverContent>
						</Popover>
					)}
				</InputGroupAddon>
			</InputGroup>
		</div>
	);
};
