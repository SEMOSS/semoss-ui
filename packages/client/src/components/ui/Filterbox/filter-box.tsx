import {
	ChevronDown,
	ChevronUp,
	Search as SearchIcon,
	SlidersHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Input,
} from "@semoss/ui/next";
import { usePixel, useRootStore } from "@/hooks";
import {
	formatToDataTestId,
	getTagColorPalette,
	removeUnderscores,
	toTitleCase,
} from "@/utility";

export interface FilterboxProps {
	/** Determined to get filter keys for Engines/App */
	type:
		| "PROJECT"
		| "MODEL"
		| "FUNCTION"
		| "VECTOR"
		| "STORAGE"
		| "DATABASE"
		| "BROWSETEMPLATES";
	/** Filters to hold in state at parent */
	onChange: (filters: unknown) => void;
	filteredCatalogIds?: string[];
	filterBoxRefresh?: boolean;
	onfilterBoxRefreshCompleted?: () => void;
	applyOnMount?: boolean;
	showHeader?: boolean;
	hideHeaderToggleFrom?: "md" | "lg";
	colorizeValues?: boolean;
	colorizeSelectedOnly?: boolean;
}

const COLLAPSED_ITEM_LIMIT = 8;

export const Filterbox = (props: FilterboxProps) => {
	const {
		type,
		onChange,
		filteredCatalogIds = [],
		filterBoxRefresh = false,
		onfilterBoxRefreshCompleted = () => {},
		applyOnMount = true,
		showHeader = true,
		hideHeaderToggleFrom,
		colorizeValues = false,
		colorizeSelectedOnly = false,
	} = props;
	const { configStore } = useRootStore();
	const [searchParams, setSearchParams] = useSearchParams();

	const [filterSearch, setFilterSearch] = useState("");
	const [showCollapsible, setShowCollapsible] = useState<
		Record<string, boolean>
	>({});
	const [expandedSections, setExpandedSections] = useState<
		Record<string, boolean>
	>({});
	const [headerOpen, setHeaderOpen] = useState(true);
	const [isDesktopFilterLayout, setIsDesktopFilterLayout] = useState(false);

	const list =
		type === "PROJECT"
			? configStore.store.config.projectMetaKeys
			: configStore.store.config.databaseMetaKeys;

	const fieldList = list.filter((k) => {
		return (
			k.display_options === "single-checklist" ||
			k.display_options === "multi-checklist" ||
			k.display_options === "single-select" ||
			k.display_options === "multi-select" ||
			k.display_options === "single-typeahead" ||
			k.display_options === "multi-typeahead" ||
			k.display_options === "select-box"
		);
	});

	const fieldKeys = fieldList.map((k) => {
		if (!k.display_values) {
			return k.metakey;
		}
		return null;
	});

	fieldKeys.filter((v) => v);

	const [filterOptions, setFilterOptions] = useState<
		Record<string, { value: string; count: number }[]>
	>({});

	const [filterVisibility, setFilterVisibility] = useState<
		Record<string, { open: boolean; value: string[]; search: string }>
	>(() => {
		return fieldList.reduce((prev, current) => {
			prev[current.metakey] = {
				open: false,
				value: [],
				search: "",
			};

			return prev;
		}, {});
	});

	const appliedParamsRef = useRef<string | null>(null);
	const skipParamSyncRef = useRef(false);
	const refreshHandledRef = useRef(false);
	const allowedKeys = useMemo(() => {
		return new Set(fieldList.map((field) => field.metakey));
	}, [fieldList]);

	// Count total active filters
	const totalActiveFilters = useMemo(() => {
		return Object.values(filterVisibility).reduce(
			(sum, fv) => sum + fv.value.length,
			0,
		);
	}, [filterVisibility]);

	const getCatalogFilters = usePixel<
		{
			METAKEY: string;
			METAVALUE: string;
			count: number;
		}[]
	>(
		fieldKeys.length > 0
			? type === "PROJECT"
				? `GetProjectMetaValues(metaKeys=${JSON.stringify(
						fieldKeys.filter((mk) => mk),
					)}${
						filteredCatalogIds.length > 0
							? `, projectIdList = ${JSON.stringify(filteredCatalogIds)}`
							: ""
					}) ;`
				: `GetEngineMetaValues( engineTypes=["${type}"], metaKeys = ${JSON.stringify(
						fieldKeys.filter((mk) => mk),
					)}${
						filteredCatalogIds.length > 0
							? `, engineIdList = ${JSON.stringify(filteredCatalogIds)}`
							: ""
					}) ;`
			: "",
	);

	useEffect(() => {
		if (!hideHeaderToggleFrom || typeof window === "undefined") {
			setIsDesktopFilterLayout(false);
			return;
		}

		const query =
			hideHeaderToggleFrom === "md"
				? "(min-width: 768px)"
				: "(min-width: 1024px)";
		const mediaQuery = window.matchMedia(query);
		const updateMatch = (event: MediaQueryListEvent | MediaQueryList) => {
			setIsDesktopFilterLayout(event.matches);
		};

		updateMatch(mediaQuery);

		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener("change", updateMatch);
		} else {
			mediaQuery.addListener(updateMatch);
		}

		return () => {
			if (mediaQuery.removeEventListener) {
				mediaQuery.removeEventListener("change", updateMatch);
			} else {
				mediaQuery.removeListener(updateMatch);
			}
		};
	}, [hideHeaderToggleFrom]);

	useEffect(() => {
		if (isDesktopFilterLayout) {
			setHeaderOpen(true);
		}
	}, [isDesktopFilterLayout]);

	useEffect(() => {
		if (!filterBoxRefresh) {
			refreshHandledRef.current = false;
			return;
		}

		if (refreshHandledRef.current) {
			return;
		}

		refreshHandledRef.current = true;

		if (filteredCatalogIds.length === 0) {
			getCatalogFilters.refresh();
		}

		onfilterBoxRefreshCompleted();
	}, [
		filterBoxRefresh,
		filteredCatalogIds.length,
		getCatalogFilters.refresh,
		onfilterBoxRefreshCompleted,
	]);

	// Apply the URL's query params to the filters' state on component mount.
	useEffect(() => {
		if (skipParamSyncRef.current) {
			skipParamSyncRef.current = false;
			return;
		}

		const paramsString = searchParams.toString();

		if (paramsString.length === 0) {
			if (applyOnMount && appliedParamsRef.current !== "") {
				onChange({});
				appliedParamsRef.current = "";
			}
			return;
		}

		const constructedFilters: Record<string, string[]> = {};
		searchParams.forEach((value, key) => {
			if (!allowedKeys.has(key)) {
				return;
			}
			if (!constructedFilters[key]) {
				constructedFilters[key] = [];
			}
			if (!constructedFilters[key].includes(value)) {
				constructedFilters[key].push(value);
			}
		});

		if (Object.keys(constructedFilters).length === 0) {
			return;
		}

		setFilterVisibility((prevVisibility) => {
			let changed = false;
			const nextVisibility = { ...prevVisibility };
			Object.entries(constructedFilters).forEach(([key, values]) => {
				const existing = prevVisibility[key];
				if (!existing) {
					return;
				}
				const same =
					existing.value.length === values.length &&
					values.every((value) => existing.value.includes(value));
				if (!same) {
					changed = true;
					nextVisibility[key] = {
						...existing,
						value: values,
					};
				}
			});

			return changed ? nextVisibility : prevVisibility;
		});

		if (applyOnMount && appliedParamsRef.current !== paramsString) {
			onChange(constructedFilters);
			appliedParamsRef.current = paramsString;
		}
	}, [searchParams, allowedKeys, applyOnMount, onChange]);

	useEffect(() => {
		if (getCatalogFilters.status !== "SUCCESS") {
			return;
		}

		const updated = getCatalogFilters.data.reduce((prev, current) => {
			if (!prev[current.METAKEY]) {
				prev[current.METAKEY] = [];
			}
			prev[current.METAKEY].push({
				value: current.METAVALUE,
				count: current.count,
			});
			return prev;
		}, {});

		const fieldKeysWithOptions = list.filter((k) => {
			return (
				k.display_options === "single-checklist" ||
				k.display_options === "multi-checklist" ||
				k.display_options === "single-select" ||
				k.display_options === "multi-select" ||
				k.display_options === "single-typeahead" ||
				k.display_options === "multi-typeahead" ||
				k.display_options === "select-box"
			);
		});

		fieldKeysWithOptions.forEach((filter) => {
			if (filter.display_values) {
				const split = filter.display_values.split(",");
				const formatted = split.map((val) => ({ value: val }));
				updated[filter.metakey] = formatted;
			}
			setShowCollapsible((set) => ({
				...set,
				[filter.metakey]: true,
			}));
		});

		const validMap: Record<string, string[]> = Object.entries(
			updated,
		).reduce(
			(acc, [k, v]) => {
				acc[k] = (v as { value: string }[]).map((o) => o.value);
				return acc;
			},
			{} as Record<string, string[]>,
		);

		setFilterVisibility((prevVisibility) => {
			const newVisibility = { ...prevVisibility };
			Object.entries(prevVisibility).forEach(([fieldKey, fieldValue]) => {
				const validValues = validMap[fieldKey] || [];
				const filteredValues = fieldValue.value.filter((val) =>
					validValues.includes(val),
				);

				if (filteredValues.length !== fieldValue.value.length) {
					newVisibility[fieldKey] = {
						...fieldValue,
						value: filteredValues,
					};
				}
			});
			return newVisibility;
		});

		if (searchParams.size > 0) {
			const keys = Array.from(new Set(searchParams.keys()));
			const newParams = new URLSearchParams();
			let hasInvalid = false;

			for (const key of keys) {
				const values = searchParams.getAll(key);
				const validValues = validMap[key] || [];
				const filtered = values.filter((v) => validValues.includes(v));
				for (const v of filtered) {
					if (!newParams.getAll(key).includes(v)) {
						newParams.append(key, v);
					}
				}
				if (filtered.length !== values.length) {
					hasInvalid = true;
				}
			}

			if (hasInvalid) {
				setSearchParams(newParams, { replace: true });
			}
		}

		setFilterOptions(updated);
	}, [
		getCatalogFilters.status,
		getCatalogFilters.data,
		list,
		searchParams,
		setSearchParams,
	]);

	/**
	 * Immutable filter toggle: builds next state, then applies all side effects.
	 */
	const toggleFilter = useCallback(
		(filterLabel: string, filterValue: string) => {
			setFilterVisibility((prev) => {
				const current = prev[filterLabel];
				if (!current) return prev;

				const index = current.value.indexOf(filterValue);
				const nextValue =
					index === -1
						? [...current.value, filterValue]
						: current.value.filter((v) => v !== filterValue);

				const nextVisibility = {
					...prev,
					[filterLabel]: { ...current, value: nextValue },
				};

				// Build constructed filters and apply side effects
				const constructedFilters: Record<string, string[]> = {};
				Object.entries(nextVisibility).forEach(([key, fv]) => {
					if (fv.value.length) {
						constructedFilters[key] = [...fv.value];
					}
				});

				onChange(constructedFilters);

				skipParamSyncRef.current = true;
				const nextParams = new URLSearchParams();
				Object.entries(constructedFilters).forEach(([key, values]) => {
					values.forEach((val) => {
						nextParams.append(key, String(val));
					});
				});
				setSearchParams(nextParams);

				return nextVisibility;
			});
		},
		[onChange, setSearchParams],
	);

	/**
	 * Clear all active filters
	 */
	const clearAllFilters = useCallback(() => {
		setFilterVisibility((prev) => {
			const nextVisibility = { ...prev };
			Object.keys(nextVisibility).forEach((key) => {
				nextVisibility[key] = { ...nextVisibility[key], value: [] };
			});
			return nextVisibility;
		});

		onChange({});

		skipParamSyncRef.current = true;
		setSearchParams(new URLSearchParams());
	}, [onChange, setSearchParams]);

	const getValuePillStyle = useCallback(
		(value: string, isSelected: boolean) => {
			if (!colorizeValues) {
				return undefined;
			}

			const palette = getTagColorPalette(value);

			if (isSelected) {
				return {
					backgroundColor: palette.backgroundColor,
					color: palette.color,
					borderColor: palette.borderColor,
				};
			}

			if (colorizeSelectedOnly) {
				return undefined;
			}

			return {
				color: palette.color,
				borderColor: palette.borderColor,
			};
		},
		[colorizeSelectedOnly, colorizeValues],
	);

	const filterBody = (
		<div className="flex flex-col gap-1 pb-3">
			{/* Search input */}
			{Object.entries(filterOptions).length ? (
				<div className={showHeader ? "mx-3 mt-1" : "mx-3 mt-4"}>
					<div className="relative">
						<SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-3.5 text-muted-foreground" />
						<Input
							placeholder="Search filters..."
							value={filterSearch}
							onChange={(e) => setFilterSearch(e.target.value)}
							className="h-8 w-full rounded-lg border-none bg-muted/50 pr-3 pl-9 text-xs placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-ring"
							data-testid="filterbox-search"
						/>
					</div>
				</div>
			) : null}

			{/* Filter sections */}
			{type !== "BROWSETEMPLATES" &&
				Object.entries(filterOptions).map(([key, options], i) => {
					const totalSections = Object.entries(filterOptions).length;
					const activeCount =
						filterVisibility[key]?.value.length || 0;
					const isExpanded = expandedSections[key] || false;

					// Sort: selected items first, then by search match
					const filteredOptions = options.filter((opt) =>
						opt.value
							.toLowerCase()
							.includes(filterSearch.toLowerCase()),
					);

					const selectedOptions = filteredOptions.filter((opt) =>
						filterVisibility[key]?.value.includes(opt.value),
					);
					const unselectedOptions = filteredOptions.filter(
						(opt) =>
							!filterVisibility[key]?.value.includes(opt.value),
					);

					// Always show selected first, then unselected up to limit
					const visibleUnselected = isExpanded
						? unselectedOptions
						: unselectedOptions.slice(
								0,
								Math.max(
									0,
									COLLAPSED_ITEM_LIMIT -
										selectedOptions.length,
								),
							);

					const hasMore =
						unselectedOptions.length > visibleUnselected.length;

					return (
						<div key={key} className="px-3 pt-1">
							<Collapsible
								open={showCollapsible[key]}
								onOpenChange={(open) =>
									setShowCollapsible((prev) => ({
										...prev,
										[key]: open,
									}))
								}
							>
								<CollapsibleTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										className="flex h-8 w-full items-center justify-between rounded-md px-2 py-1 hover:bg-accent/50 has-[>svg]:px-2"
									>
										<span className="flex items-center gap-2">
											<span className="font-medium text-[13px] text-foreground">
												{toTitleCase(
													removeUnderscores(key),
												)}
											</span>
											{activeCount > 0 && (
												<Badge
													variant="secondary"
													className="h-5 min-w-5 rounded-full px-1.5 font-medium text-[10px] leading-none [font-variant-numeric:tabular-nums]"
												>
													{activeCount}
												</Badge>
											)}
										</span>
										{showCollapsible[key] ? (
											<ChevronUp className="size-3.5 text-muted-foreground" />
										) : (
											<ChevronDown className="size-3.5 text-muted-foreground" />
										)}
									</Button>
								</CollapsibleTrigger>

								<CollapsibleContent>
									<div className="flex flex-wrap gap-1.5 px-1 pt-2 pb-1">
										{/* Selected pills always shown */}
										{selectedOptions.map((opt) => (
											<button
												type="button"
												key={opt.value}
												onClick={() =>
													toggleFilter(key, opt.value)
												}
												aria-pressed={true}
												aria-label={`Remove ${opt.value} filter`}
												className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-medium text-primary text-xs transition-all duration-200 hover:bg-primary/20 active:scale-95"
												style={getValuePillStyle(
													opt.value,
													true,
												)}
												data-testid={formatToDataTestId(
													`filterbox-${opt.value}-filterBtn`,
												)}
											>
												<span>{opt.value}</span>
												{opt.count != null && (
													<span className="text-[10px] text-primary/60">
														{opt.count}
													</span>
												)}
											</button>
										))}

										{/* Unselected pills */}
										{visibleUnselected.map((opt) => (
											<button
												type="button"
												key={opt.value}
												onClick={() =>
													toggleFilter(key, opt.value)
												}
												aria-pressed={false}
												aria-label={`Filter by ${opt.value}`}
												className="inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-2.5 py-1 text-foreground text-xs transition-all duration-200 hover:border-foreground/30 hover:bg-accent active:scale-95"
												style={getValuePillStyle(
													opt.value,
													false,
												)}
												data-testid={formatToDataTestId(
													`filterbox-${opt.value}-filterBtn`,
												)}
											>
												<span>{opt.value}</span>
												{opt.count != null && (
													<span className="text-[10px] opacity-70">
														{opt.count}
													</span>
												)}
											</button>
										))}
									</div>

									{/* Show more / Show less */}
									{(hasMore || isExpanded) && (
										<Button
											type="button"
											variant="ghost"
											className="mt-0.5 h-auto px-2 py-1 font-normal text-primary text-xs hover:bg-transparent hover:text-primary/80"
											onClick={() => {
												setExpandedSections((prev) => ({
													...prev,
													[key]: !prev[key],
												}));
											}}
										>
											{isExpanded
												? "Show less"
												: `+${unselectedOptions.length - visibleUnselected.length} more`}
										</Button>
									)}
								</CollapsibleContent>
							</Collapsible>

							{i + 1 !== totalSections && (
								<div className="mx-1 mt-2 h-px bg-border/50" />
							)}
						</div>
					);
				})}
		</div>
	);

	return (
		<div className="filterbox-scroll flex w-full flex-col overflow-y-auto overflow-x-hidden rounded-xl border border-border/50 bg-card shadow-sm md:max-h-[calc(100vh-220px)] md:w-[352px]">
			<div className="w-full">
				{showHeader ? (
					<Collapsible
						open={
							hideHeaderToggleFrom && isDesktopFilterLayout
								? true
								: headerOpen
						}
						onOpenChange={
							hideHeaderToggleFrom && isDesktopFilterLayout
								? undefined
								: setHeaderOpen
						}
					>
						<div
							className={`flex items-center px-4 pt-4 pb-2 ${
								hideHeaderToggleFrom && isDesktopFilterLayout
									? "justify-start"
									: "justify-between"
							}`}
						>
							<div className="flex items-center gap-2">
								<SlidersHorizontal className="size-4 text-muted-foreground" />
								<h6 className="font-semibold text-foreground text-sm">
									Filters
								</h6>
								{totalActiveFilters > 0 && (
									<Badge
										variant="default"
										className="h-5 min-w-5 rounded-full px-1.5 text-[10px] leading-none [font-variant-numeric:tabular-nums]"
									>
										{totalActiveFilters}
									</Badge>
								)}
								{totalActiveFilters > 0 && (
									<Button
										type="button"
										variant="ghost"
										className="h-auto px-2 py-1 font-medium text-primary text-xs hover:text-primary/80"
										onClick={clearAllFilters}
										data-testid="filterbox-clear-all"
									>
										Clear all
									</Button>
								)}
							</div>
							{!(
								hideHeaderToggleFrom && isDesktopFilterLayout
							) ? (
								<CollapsibleTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										className="size-7 rounded-md"
										aria-label={
											headerOpen
												? "Collapse filters"
												: "Expand filters"
										}
									>
										{headerOpen ? (
											<ChevronUp className="size-3.5" />
										) : (
											<ChevronDown className="size-3.5" />
										)}
									</Button>
								</CollapsibleTrigger>
							) : null}
						</div>
						<CollapsibleContent>{filterBody}</CollapsibleContent>
					</Collapsible>
				) : (
					filterBody
				)}
			</div>
		</div>
	);
};
