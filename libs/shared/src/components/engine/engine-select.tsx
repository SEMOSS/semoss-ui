import { CheckIcon, ChevronDown } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
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
	TooltipProvider,
	TooltipTrigger,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import type { Engine } from "../../types";
import { EngineSubtypeIcon } from "../engine-subtype-icon";

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

	/** Show the engine ID under the engine name instead of the description */
	showEngineId?: boolean;

	/** Show the engine subtype icon next to each option. Defaults to true. */
	showEngineIcon?: boolean;

	/**
	 * Engine IDs that should be greyed out and unselectable (e.g. monthly token quota exceeded).
	 */
	disabledEngineIds?: string[];
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
	showEngineId,
	showEngineIcon = true,
	disabledEngineIds = [],
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
							? `metaFilters=${JSON.stringify(metaFilters)},`
							: ""
					} limit=[${limit}], offset=[${offset}]);`
				: "",
		// Determine if there are more pages to load
		(response) => {
			// Keep loading until the backend returns an empty page.
			// Some engine queries can return partial pages (< limit) even when more
			// results exist, so "< limit means end" is not reliable here.
			if (response.length === 0) {
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
	 * Stable onNext so useInfiniteScroll doesn't tear down the scroll listener
	 * on every render (getEngines.next changes whenever load state changes).
	 */
	const nextRef = useRef(getEngines.next);
	useEffect(() => {
		nextRef.current = getEngines.next;
	}, [getEngines.next]);
	const handleNext = useCallback(() => {
		nextRef.current();
	}, []);

	const { setScroll } = useInfiniteScroll({
		disabled: getEngines.isLoading || !getEngines.hasMore || !open,
		onNext: handleNext,
	});

	const listRef = useCallback(
		(node: HTMLDivElement | null) => {
			setScroll(node);
		},
		[setScroll],
	);

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
						"w-full min-w-0 justify-start overflow-hidden border-input bg-transparent px-3 py-2",
						className,
					)}
				>
					<div className="flex w-full min-w-0 items-center gap-2 overflow-hidden">
						<span className="min-w-0 truncate">
							{name || "Select"}
						</span>
						<ChevronDown className="inline-block! ms-auto size-4 shrink-0 opacity-70" />
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				{...popoverContentProps}
				className={cn(
					"w-[var(--radix-popover-trigger-width)] min-w-64 max-w-[var(--radix-popover-trigger-width)] p-0",
					popoverContentProps?.className,
				)}
			>
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search"
						value={search}
						onValueChange={setSearch}
					/>
					{/* Attach infinite scroll to list container */}
					<CommandList ref={listRef}>
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
								const engineId =
									engine.app_id || engine.engine_id;

								const isExhausted =
									disabledEngineIds.includes(engineId);

								const item = (
									<CommandItem
										key={engineId}
										value={engineId}
										onSelect={() => {
											if (isExhausted) return;
											onChange(engine);
											setOpen(false);
										}}
										className={cn(
											value === engineId &&
												"bg-primary/10 data-[selected=true]:bg-primary/15",
											isExhausted &&
												"cursor-not-allowed opacity-50 aria-selected:bg-transparent",
										)}
									>
										{showEngineIcon && (
											<EngineSubtypeIcon
												engineType={engine.engine_type}
												engineSubtype={
													engine.engine_subtype
												}
												alt={`${displayName} icon`}
												className="me-2 size-6 shrink-0 object-contain"
											/>
										)}
										<div className="flex flex-1 flex-col truncate">
											<span className="truncate">
												{displayName}
											</span>
											{showEngineId ? (
												<span
													title={engineId}
													className="truncate text-muted-foreground text-xs"
												>
													id: {engineId}
												</span>
											) : (
												engine.description && (
													<span
														title={
															engine.description
														}
														className="truncate text-muted-foreground text-xs"
													>
														{engine.description}
													</span>
												)
											)}
										</div>
										{/* Right-aligned check marks the selected engine without shifting the row's left content */}
										{value === engineId && (
											<CheckIcon
												strokeWidth={3}
												className="ms-2 size-4 shrink-0 text-primary"
											/>
										)}
									</CommandItem>
								);

								if (!isExhausted) return item;

								return (
									<TooltipProvider key={engineId}>
										<Tooltip>
											<TooltipTrigger asChild>
												<div
													onClickCapture={(e) =>
														e.stopPropagation()
													}
													onPointerDownCapture={(e) =>
														e.stopPropagation()
													}
													className="cursor-not-allowed"
												>
													<div className="pointer-events-none">
														{item}
													</div>
												</div>
											</TooltipTrigger>
											<TooltipContent
												side="left"
												className="max-w-48 text-xs"
											>
												Token limit reached
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
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
