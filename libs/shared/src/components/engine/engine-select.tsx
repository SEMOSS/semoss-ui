import { CheckIcon, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import type { Engine } from "@/types";

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface EngineSelectProps {
	/** CSS classes for styling customization */
	className?: string;

	/** Whether the select is disabled */
	disabled?: boolean;

	/** Display name of the selected engine */
	name: string;

	/** ID of the selected engine */
	value: string;

	/** Callback invoked when selection changes */
	onChange: (value: Engine | null) => void;

	/** Filter engines by type (e.g., MODEL, DATABASE, STORAGE) */
	engineTypes?: Engine["engine_type"][];

	/** Additional metadata filters for engine query */
	metaFilters?: unknown[];

	/** Props forwarded to the PopoverContent component */
	popoverContentProps?: React.ComponentProps<typeof PopoverContent>;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * EngineSelect - A searchable dropdown for selecting SEMOSS engines
 *
 * Features:
 * - Lazy loading with pagination (15 items per page)
 * - Real-time search with debouncing
 * - Infinite scroll for large datasets
 * - Filter by engine type and metadata
 * - Displays engine name and description
 */
export const EngineSelect = ({
	className,
	disabled,
	name,
	value,
	onChange,
	engineTypes,
	metaFilters,
	popoverContentProps = {},
}: EngineSelectProps) => {
	// ========================================================================
	// State & Hooks
	// ========================================================================

	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	// Debounce search to avoid excessive queries while typing
	const debouncedSearch = useDebouncedValue(search);

	// ========================================================================
	// Lazy Loading Engine Data
	// ========================================================================

	/**
	 * Fetch engines with pagination and filtering
	 *
	 * Query construction:
	 * - filterWord: Text search across engine names/descriptions
	 * - engineTypes: Filter by engine type (MODEL, DATABASE, etc.)
	 * - metaFilters: Additional metadata-based filtering
	 * - limit/offset: Pagination parameters
	 *
	 * Only runs when popover is open to avoid unnecessary queries
	 */
	const getEngines = useIteratorPixel<Engine[], Engine>(
		(limit, offset) =>
			open
				? `MyEngines(${
						debouncedSearch
							? `filterWord=["<encode>${debouncedSearch}</encode>"], `
							: ""
					} ${
						engineTypes
							? `engineTypes=${JSON.stringify(engineTypes)},`
							: ""
					} ${
						metaFilters
							? `metaFilters=[${JSON.stringify(metaFilters)}],`
							: ""
					} limit=[${limit}], offset=[${offset}]);`
				: "",
		// Determine if there are more pages to load
		(response) => {
			// If response is smaller than page size, we've reached the end
			if (response.length < 15) {
				return -1;
			}

			return Infinity;
		},
		// Transform response (pass through as-is)
		(response) => {
			return response;
		},
		{
			limit: 15, // Page size for lazy loading
		},
		[
			open,
			debouncedSearch,
			JSON.stringify(engineTypes),
			JSON.stringify(metaFilters),
		],
	);

	// ========================================================================
	// Infinite Scroll Setup
	// ========================================================================

	/**
	 * Enable infinite scroll for seamless pagination
	 * Automatically loads next page when user scrolls near bottom
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getEngines.isLoading || !getEngines.hasMore || !open,
		onNext: () => {
			getEngines.next();
		},
	});

	// ========================================================================
	// Render
	// ========================================================================

	return (
		<Popover open={open && !disabled} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					disabled={disabled}
					className={cn(
						"ml-auto max-w-64 justify-between overflow-hidden hover:bg-accent",
						className,
					)}
				>
					<span className="truncate">{name || "Select"}</span>
					<ChevronDown className="inline-block! ml-2 size-4 shrink-0 opacity-70" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="p-0" {...popoverContentProps}>
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search"
						value={search}
						onValueChange={setSearch}
					/>
					{/* Attach infinite scroll to list container */}
					<CommandList ref={(ele) => setScroll(ele)}>
						<CommandEmpty>
							{/* Show spinner during initial load, otherwise "Not Found" */}
							{getEngines.isLoading &&
							getEngines.data.length === 0 ? (
								<div className="flex items-center justify-center py-4">
									<Spinner />
								</div>
							) : (
								"Not Found"
							)}
						</CommandEmpty>
						<CommandGroup>
							{getEngines.data.map((engine) => {
								// Prefer display name over internal name
								const displayName =
									engine.engine_display_name ||
									engine.engine_name;
								const engineId = engine.engine_id;

								return (
									<CommandItem
										key={engineId}
										value={engineId}
										onSelect={() => {
											onChange(engine);
											setOpen(false);
										}}
									>
										{/* Checkmark - visible only for selected item */}
										<CheckIcon
											className={`mr-2 size-4 ${
												value === engineId
													? "opacity-100"
													: "opacity-0"
											}`}
										/>
										<div className="flex flex-1 flex-col truncate">
											<span className="truncate">
												{displayName}
											</span>
											{/* Optional description shown below engine name */}
											{engine.description && (
												<span
													title={engine.description}
													className="truncate text-muted-foreground text-xs"
												>
													{engine.description}
												</span>
											)}
										</div>
									</CommandItem>
								);
							})}
							{/* Loading spinner shown at bottom while fetching next page */}
							{getEngines.isLoading &&
								getEngines.data.length > 0 && (
									<div className="flex items-center justify-center py-2">
										<Spinner className="size-4" />
									</div>
								)}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
