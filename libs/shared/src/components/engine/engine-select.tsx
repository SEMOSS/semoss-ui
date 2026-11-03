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
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import type { Engine } from "../../types";
import { EngineOption } from "./engine-option";

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/** Props for {@link EngineSelect}. */
export interface EngineSelectProps {
	/** Associates the trigger with a field label. */
	id?: string;
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

	/** Optional icon rendered before the selected name in the trigger. */
	triggerIcon?: React.ReactNode;
	/**
	 * Opens the list as a modal popover. Set it when the picker is inside a
	 * dialog: the list is rendered outside the dialog, which otherwise blocks
	 * scrolling it.
	 */
	modal?: boolean;

	/**
	 * Lists these engines instead of reading the user's engines page by page,
	 * for a picker that offers only some of them, such as one subtype. The
	 * search then matches their names and ids, and engineTypes and
	 * metaFilters do not apply.
	 */
	engines?: Engine[];

	/** Offers a choice of no engine, first in the list, with this label. */
	noneOption?: {
		/** The choice's label, such as "Use the first route". */
		label: string;
		/** Called when the choice is picked. */
		onSelect: () => void;
	};

	/**
	 * The chosen engine when the list does not offer it, such as one that no
	 * longer fits the field: it shows first in the list, disabled, with the
	 * note under its name.
	 */
	unavailable?: { engine: Engine; note: string };

	/** Focuses the trigger, as a form does for a field with a problem. */
	ref?: React.Ref<HTMLButtonElement>;

	/** The ids of the elements that describe the field. */
	"aria-describedby"?: string;

	/** Whether the field has a problem, for assistive technology. */
	"aria-invalid"?: boolean;
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
 * - Displays engine name and description, or its id with showEngineId
 * - Or lists a given set of engines (engines), searched by name and id
 */
export const EngineSelect = ({
	id,
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
	triggerIcon,
	modal = false,
	engines,
	noneOption,
	unavailable,
	ref,
	"aria-describedby": ariaDescribedBy,
	"aria-invalid": ariaInvalid,
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
	 * Only runs when popover is open to avoid unnecessary queries, and never
	 * when the caller gives the engines to list
	 */
	const getEngines = useIteratorPixel<Engine[], Engine>(
		(limit, offset) =>
			open && !engines
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
		disabled:
			!!engines || getEngines.isLoading || !getEngines.hasMore || !open,
		onNext: handleNext,
	});

	// a given list is searched here; the user's engines are searched by the pixel
	const query = search.trim().toLowerCase();
	const listedEngines = engines
		? engines.filter(
				(engine) =>
					!query ||
					[
						engine.engine_display_name,
						engine.engine_name,
						engine.engine_id,
					].some((text) => text?.toLowerCase().includes(query)),
			)
		: getEngines.data;
	const isLoadingEngines = !engines && getEngines.isLoading;

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
		<Popover open={open && !disabled} onOpenChange={setOpen} modal={modal}>
			<PopoverTrigger asChild>
				<Button
					ref={ref}
					id={id}
					type="button"
					variant="outline"
					role="combobox"
					aria-expanded={open && !disabled}
					aria-describedby={ariaDescribedBy}
					aria-invalid={ariaInvalid}
					disabled={disabled}
					className={cn(
						"w-full min-w-0 justify-start overflow-hidden border-input bg-transparent px-3 py-2",
						className,
					)}
				>
					<div className="flex w-full min-w-0 items-center gap-2 overflow-hidden">
						{triggerIcon}
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
							{isLoadingEngines && listedEngines.length === 0 ? (
								<div className="flex items-center justify-center py-4">
									<Spinner />
								</div>
							) : (
								"Not Found"
							)}
						</CommandEmpty>
						<CommandGroup>
							{noneOption && !query && (
								<CommandItem
									value="__none__"
									onSelect={() => {
										noneOption.onSelect();
										setOpen(false);
									}}
									className={cn(
										!value &&
											"bg-primary/10 data-[selected=true]:bg-primary/15",
									)}
								>
									<span className="flex-1 truncate">
										{noneOption.label}
									</span>
									{!value && (
										<CheckIcon
											aria-hidden
											strokeWidth={3}
											className="ms-2 size-4 shrink-0 text-primary"
										/>
									)}
								</CommandItem>
							)}
							{unavailable &&
								unavailable.engine.engine_id === value &&
								!query && (
									<CommandItem value={value} disabled>
										<EngineOption
											engineId={value}
											name={
												unavailable.engine
													.engine_display_name ||
												unavailable.engine.engine_name
											}
											engineType={
												unavailable.engine.engine_type
											}
											engineSubtype={
												unavailable.engine
													.engine_subtype
											}
											description={unavailable.note}
											showEngineIcon={showEngineIcon}
											isSelected
										/>
									</CommandItem>
								)}
							{listedEngines.map((engine) => {
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
										className={cn(
											value === engineId &&
												"bg-primary/10 data-[selected=true]:bg-primary/15",
										)}
									>
										<EngineOption
											engineId={engineId}
											name={displayName}
											engineType={engine.engine_type}
											engineSubtype={
												engine.engine_subtype
											}
											description={engine.description}
											showEngineId={showEngineId}
											showEngineIcon={showEngineIcon}
											isSelected={value === engineId}
										/>
									</CommandItem>
								);
							})}
							{/* Loading spinner shown at bottom while fetching next page */}
							{isLoadingEngines && listedEngines.length > 0 && (
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
