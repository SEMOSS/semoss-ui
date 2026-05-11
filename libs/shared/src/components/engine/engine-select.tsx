import { CheckIcon, ChevronDown } from "lucide-react";
import type React from "react";
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
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
	onChange: (value: Engine) => void;

	/** Filter engines by type (e.g., MODEL, DATABASE, STORAGE) */
	engineTypes?: Engine["engine_type"][];

	/** Additional metadata filters for engine query */
	metaFilters?: unknown[];

	/** Props forwarded to the PopoverContent component */
	popoverContentProps?: React.ComponentProps<typeof PopoverContent>;

	/** Current token usage for context window indicator */
	tokensUsed?: number;

	/** Maximum token capacity for context window */
	tokensMax?: number;

	/** Optional tooltip content to show when hovering context percentage */
	contextTooltipContent?: React.ReactNode;
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
	tokensUsed,
	tokensMax,
	contextTooltipContent,
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
				? `META | MyEngines(${
						debouncedSearch
							? `filterWord=${JSON.stringify(debouncedSearch)}, `
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
	// Context Window Calculation
	// ========================================================================

	const contextUsedPercent =
		tokensMax && tokensUsed !== undefined
			? (tokensUsed / tokensMax) * 100
			: undefined;

	const showContextIndicator =
		contextUsedPercent !== undefined && contextUsedPercent >= 12.5;

	// Calculate pie chart geometry
	const roundedPercent =
		contextUsedPercent !== undefined
			? Math.round(contextUsedPercent / 12.5) * 12.5
			: 0;
	const radius = 8;
	const cx = 9;
	const cy = 9;
	const angle = (roundedPercent / 100) * 360;
	const radians = (angle * Math.PI) / 180;
	const x = cx + radius * Math.cos(radians - Math.PI / 2);
	const y = cy + radius * Math.sin(radians - Math.PI / 2);
	const largeArc = angle > 180 ? 1 : 0;

	// ========================================================================
	// Render
	// ========================================================================

	return (
		<Popover open={open && !disabled} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					role="combobox"
					aria-expanded={open}
					disabled={disabled}
					className={cn(
						"ml-auto max-w-64 overflow-hidden hover:bg-accent",
						className,
					)}
				>
					<div className="flex min-w-0 items-center gap-2 overflow-hidden">
						{showContextIndicator && (
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="flex shrink-0 cursor-help items-center">
										{/** biome-ignore lint/a11y/noSvgWithoutTitle: hover status is applied to provide description for interactive svg */}
										<svg
											width={18}
											height={18}
											viewBox="0 0 18 18"
										>
											{/* Outer ring - always visible */}
											<circle
												cx={cx}
												cy={cy}
												r={radius}
												fill="none"
												className={
													roundedPercent >= 75
														? "stroke-destructive"
														: "stroke-muted-foreground"
												}
												strokeWidth={1.5}
												opacity={0.3}
											/>
											{/* Inner fill showing percentage */}
											{roundedPercent >= 100 ? (
												<circle
													cx={cx}
													cy={cy}
													r={radius - 1}
													className={
														roundedPercent >= 75
															? "fill-destructive"
															: "fill-muted-foreground"
													}
													opacity={0.6}
												/>
											) : (
												<path
													d={`M ${cx} ${cy} L ${cx} ${cy - (radius - 1)} A ${radius - 1} ${radius - 1} 0 ${largeArc} 1 ${x * 0.875 + cx * 0.125} ${y * 0.875 + cy * 0.125} Z`}
													className={
														roundedPercent >= 75
															? "fill-destructive"
															: "fill-muted-foreground"
													}
													opacity={0.6}
												/>
											)}
										</svg>
									</div>
								</TooltipTrigger>
								{contextTooltipContent && (
									<TooltipContent
										side="top"
										align="center"
										className="w-80 max-w-xs text-wrap"
									>
										{contextTooltipContent}
									</TooltipContent>
								)}
							</Tooltip>
						)}
						<span className="min-w-0 truncate">
							{name || "Select"}
						</span>
						<ChevronDown className="inline-block! ml-auto size-4 shrink-0 opacity-70" />
					</div>
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
