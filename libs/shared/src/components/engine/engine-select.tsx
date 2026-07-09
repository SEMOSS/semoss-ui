import { CheckIcon, ChevronDown } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { runPixel, useIteratorPixel } from "@semoss/sdk/react";
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

	/** Current token usage for context window indicator */
	tokensUsed?: number;

	/** Maximum token capacity for context window */
	tokensMax?: number;

	/** Optional tooltip content to show when hovering context percentage */
	contextTooltipContent?: React.ReactNode;

	/** Show the engine ID under the engine name instead of the description */
	showEngineId?: boolean;

	/** Show the engine subtype icon next to each option. Defaults to true. */
	showEngineIcon?: boolean;

	/**
	 * Total tokens used in the current conversation. When provided, engines
	 * whose context window is smaller than this value are greyed out.
	 */
	conversationTokensUsed?: number;

	/**
	 * Engine IDs that should be greyed out and unselectable regardless of
	 * context window (e.g. monthly token quota exceeded).
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
 * - Greys out engines that exceed monthly quota or conversation context window
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
	showEngineId,
	showEngineIcon = true,
	conversationTokensUsed,
	disabledEngineIds = [],
}: EngineSelectProps) => {
	// ========================================================================
	// State & Hooks
	// ========================================================================

	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [contextOpen, setContextOpen] = useState(false);
	const contextCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const isHoveringContext = useRef(false);

	/** engineId -> context window size (fetched lazily when dropdown opens) */
	const [contextWindows, setContextWindows] = useState<
		Record<string, number>
	>({});

	const openContext = () => {
		isHoveringContext.current = true;
		if (contextCloseTimer.current) clearTimeout(contextCloseTimer.current);
		setContextOpen(true);
	};

	const scheduleContextClose = () => {
		isHoveringContext.current = false;
		contextCloseTimer.current = setTimeout(
			() => setContextOpen(false),
			150,
		);
	};

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
	// Context Window Fetching (per engine, lazy — only when dropdown is open
	// and conversationTokensUsed is provided)
	// ========================================================================

	useEffect(() => {
		if (!open || conversationTokensUsed === undefined) return;

		// Only fetch for engines we haven't fetched yet
		const unfetched = getEngines.data
			.map((e) => e.engine_id)
			.filter((id) => !(id in contextWindows));

		if (unfetched.length === 0) return;

		unfetched.forEach((engineId) => {
			runPixel<[number | undefined]>(
				`META | GetContextWindow(${JSON.stringify(engineId)});`,
			)
				.then(({ pixelReturn }) => {
					const cw = pixelReturn[0].output;
					if (cw !== undefined && cw !== null) {
						setContextWindows((prev) => ({
							...prev,
							[engineId]: cw,
						}));
					}
				})
				.catch(() => {
					// ignore — engine simply won't be greyed out if fetch fails
				});
		});
	}, [open, getEngines.data, conversationTokensUsed, contextWindows]);

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
	// Context Window Calculation
	// ========================================================================

	const contextUsedPercent =
		tokensMax && tokensUsed !== undefined
			? (tokensUsed / tokensMax) * 100
			: undefined;

	// Always show the indicator slot when the caller passes tokensUsed/tokensMax
	// props, even before the context window has loaded. This keeps the button
	// width stable so neighbouring icons (e.g. the bar chart) never shift.
	const showContextIndicator =
		tokensUsed !== undefined || tokensMax !== undefined;

	// Calculate pie chart geometry
	const roundedPercent =
		contextUsedPercent !== undefined && contextUsedPercent > 0
			? Math.max(12.5, Math.round(contextUsedPercent / 12.5) * 12.5)
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
						"ms-auto max-w-64 justify-start overflow-hidden hover:bg-accent",
						className,
					)}
				>
					<div className="flex w-full min-w-0 items-center gap-2 overflow-hidden">
						{showContextIndicator && (
							<Popover
								open={contextOpen}
								onOpenChange={(o) => {
									if (!o && isHoveringContext.current) return;
									setContextOpen(o);
								}}
							>
								<PopoverTrigger asChild>
									<button
										type="button"
										className="flex shrink-0 cursor-pointer items-center"
										onClick={(e) => e.stopPropagation()}
										onMouseEnter={openContext}
										onMouseLeave={scheduleContextClose}
									>
										{/** biome-ignore lint/a11y/noSvgWithoutTitle: click interaction is provided by the parent button */}
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
									</button>
								</PopoverTrigger>
								{contextTooltipContent && (
									<PopoverContent
										side="top"
										align="start"
										className="w-[24rem] text-wrap text-sm"
										onMouseEnter={openContext}
										onMouseLeave={scheduleContextClose}
										onClick={(e) => e.stopPropagation()}
									>
										{contextTooltipContent}
									</PopoverContent>
								)}
							</Popover>
						)}
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
								// MyEngines returns app_id as the canonical ID in
								// some contexts; fall back to engine_id if absent.
								const engineId =
									engine.app_id || engine.engine_id;

								// Greyed out if explicitly disabled (monthly quota)
								const isQuotaExhausted =
									disabledEngineIds.includes(engineId);

								// Greyed out if conversation exceeds context window
								const engineContextWindow =
									contextWindows[engineId];
								const isContextExhausted =
									conversationTokensUsed !== undefined &&
									engineContextWindow !== undefined &&
									conversationTokensUsed >=
										engineContextWindow;

								const isExhausted =
									isQuotaExhausted || isContextExhausted;

								const tooltipText = isQuotaExhausted
									? "Monthly token limit reached"
									: isContextExhausted
										? `Conversation exceeds this model's context window (${engineContextWindow?.toLocaleString()} tokens)`
										: null;

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

								// Wrap exhausted items in a tooltip.
								// The outer div is pointer-interactive for the tooltip,
								// the inner div blocks all pointer events to prevent selection.
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
												{tooltipText}
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
