import { ChevronDown, ChevronUp, Search as SearchIcon } from "lucide-react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Input,
} from "@semoss/ui/next";
import { usePixel, useRootStore } from "@/hooks";
import { formatToDataTestId, removeUnderscores, toTitleCase } from "@/utility";

const FILTER_OPTION_COLORS = [
	"blue",
	"orange",
	"teal",
	"purple",
	"yellow",
	"pink",
	"violet",
	"olive",
];

const getFieldOptionColor = (value: string): string => {
	return FILTER_OPTION_COLORS[
		value
			.split("")
			.map((x) => x.charCodeAt(0))
			.reduce((a, b) => a + b, 0) % FILTER_OPTION_COLORS.length
	];
};

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
}

const initialState = {
	favoritedDbs: [],
	databases: [],
	filterSearch: "",
};

const reducer = (state, action) => {
	switch (action.type) {
		case "field": {
			return {
				...state,
				[action.field]: action.value,
			};
		}
	}
	return state;
};

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
	} = props;
	const { configStore } = useRootStore();
	const [searchParams, setSearchParams] = useSearchParams();

	const [state, dispatch] = useReducer(reducer, initialState);
	const { filterSearch } = state;
	const [showCollapsible, setShowCollapsible] = useState({});
	const [headerOpen, setHeaderOpen] = useState(true);
	const [isDesktopFilterLayout, setIsDesktopFilterLayout] = useState(false);

	const list =
		type === "PROJECT"
			? configStore.store.config.projectMetaKeys
			: configStore.store.config.databaseMetaKeys;

	// get a list of the keys
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

	// get filter keys to the ones we want
	const fieldKeys = fieldList.map((k) => {
		if (!k.display_values) {
			return k.metakey;
		}
		return null;
	});

	// Filter out nulls
	fieldKeys.filter((v) => v);

	// track the options
	const [filterOptions, setFilterOptions] = useState<
		Record<string, { value: string; count: number }[]>
	>({});

	// track which filters are opened their selected value, and search term
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

	//Refresh the pixel call, if any tagrefresh is needed
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

	/**
	 * @desc Catalog filters
	 */
	useEffect(() => {
		if (getCatalogFilters.status !== "SUCCESS") {
			return;
		}

		// format the catalog data into a map
		const updated = getCatalogFilters.data.reduce((prev, current) => {
			if (!prev[current.METAKEY]) {
				prev[current.METAKEY] = [];
			}
			prev[current.METAKEY].push({
				value: current.METAVALUE,
				count: current.count,
				color: getFieldOptionColor(current.METAVALUE),
			});
			return prev;
		}, {});

		// add filter keys that don't get options from projects/engines but stored in config call
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
			// Initialize filter collapsibles to be open
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

		// 1) Clean up filterVisibility: remove selected values that no longer exist
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

		// 2) Clean up searchParams: preserve order, keys, and other valid keys (tag, domain, etc.)
		if (searchParams.size > 0) {
			const keys = Array.from(new Set(searchParams.keys())); // unique keys in original order
			const newParams = new URLSearchParams();
			let hasInvalid = false;

			for (const key of keys) {
				const values = searchParams.getAll(key); // current values in original order
				const validValues = validMap[key] || [];

				// keep only values still valid (preserve order from `values`)
				const filtered = values.filter((v) => validValues.includes(v));

				// append filtered values in their original order (avoid duplicates)
				for (const v of filtered) {
					if (!newParams.getAll(key).includes(v)) {
						newParams.append(key, v);
					}
				}

				// detect if any value was removed for this key
				if (filtered.length !== values.length) {
					hasInvalid = true;
				}
			}

			// update URL only if something changed
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
	 * @name setSelectedFilters
	 * @desc sets filter value for each filter (tag, domain, etc.)
	 */
	const setSelectedFilters = (
		filterLabel: string,
		filter: { value: string; count: number },
	) => {
		const newValue = filterVisibility[filterLabel].value;
		const index = newValue.indexOf(filter.value);

		if (index === -1) {
			newValue.push(filter.value);
		} else {
			newValue.splice(index, 1);
		}
		setFilterVisibility({ ...filterVisibility });
	};

	/**
	 * @name handleFiltersSideEffects
	 * @desc handles what actions/effects are needed when the filters are changed
	 */
	const handleFiltersSideEffects = () => {
		const constructedFilters = {};

		Object.entries(filterVisibility).forEach((obj) => {
			if (obj[1].value.length) {
				constructedFilters[obj[0]] = [...obj[1].value];
			}
		});
		// Pass filters to parent
		onChange(constructedFilters);
		// Update query params in the URL
		skipParamSyncRef.current = true;
		const nextParams = new URLSearchParams();
		Object.entries(constructedFilters).forEach(([key, value]) => {
			const values = Array.isArray(value) ? value : [value];
			values.forEach((val) => {
				nextParams.append(key, String(val));
			});
		});
		setSearchParams(nextParams);
	};

	const filterBody = (
		<>
			{/* Is there any filters */}
			{Object.entries(filterOptions).length ? (
				<div className={showHeader ? "mx-2 mt-0" : "mx-2 mt-4"}>
					<div className="relative">
						<SearchIcon className="-translate-y-1/2 absolute top-1/2 left-[10px] h-[13px] w-[13px] text-[var(--color-text-tertiary)]" />
						<Input
							placeholder="Search by..."
							value={filterSearch}
							onChange={(e) => {
								dispatch({
									type: "field",
									field: "filterSearch",
									value: e.target.value,
								});
							}}
							className="w-full rounded-[8px] border-none bg-[var(--color-background-secondary)] py-[7px] pr-[10px] pl-8 text-[13px] placeholder:text-[13px] placeholder:text-[var(--color-text-tertiary)] focus-visible:ring-0 focus-visible:ring-offset-0"
							data-testid="filterbox-search"
						/>
					</div>
				</div>
			) : null}

			{type !== "BROWSETEMPLATES" &&
				Object.entries(filterOptions).map((entries, i) => {
					const totalFilters = Object.entries(filterOptions).length;
					const list = entries[1];
					let shownListItems = 0; // for show more
					return (
						<div key={entries[0]} className="px-4 py-1">
							<Collapsible
								open={showCollapsible[entries[0]]}
								onOpenChange={(open) =>
									setShowCollapsible((prev) => ({
										...prev,
										[entries[0]]: open,
									}))
								}
							>
								<CollapsibleTrigger asChild>
									<Button
										type="button"
										variant="default"
										className="flex h-auto w-full items-center justify-between bg-transparent px-2 py-[6px] text-[var(--color-text-primary)] hover:bg-transparent has-[>svg]:px-2"
									>
										<h6 className="font-medium text-[13px] text-[var(--color-text-primary)]">
											{toTitleCase(
												removeUnderscores(entries[0]),
											)}
										</h6>
										{showCollapsible[entries[0]] ? (
											<ChevronUp className="size-4" />
										) : (
											<ChevronDown className="size-4" />
										)}
									</Button>
								</CollapsibleTrigger>

								<CollapsibleContent>
									{list.map((filterOption) => {
										if (
											shownListItems > 4 &&
											!filterVisibility[entries[0]].open
										) {
											return null;
										}
										if (
											filterOption.value
												.toLowerCase()
												.includes(
													filterSearch.toLowerCase(),
												)
										) {
											shownListItems += 1;
											const isSelected =
												filterVisibility[
													entries[0]
												].value.indexOf(
													filterOption.value,
												) > -1;

											return (
												<Button
													type="button"
													variant="ghost"
													key={filterOption.value}
													className={`mb-[2px] flex h-auto w-full items-center justify-between rounded-[6px] bg-transparent px-3 py-[5px] text-[13px] hover:bg-[var(--color-background-secondary)] ${
														isSelected
															? "bg-[var(--color-background-secondary)]"
															: ""
													}`}
													onClick={() => {
														dispatch({
															type: "field",
															field: "databases",
															value: [],
														});

														setSelectedFilters(
															entries[0],
															filterOption,
														);
														handleFiltersSideEffects();
													}}
													aria-label={
														isSelected
															? `Unfilter ${filterOption.value}`
															: `Filter ${filterOption.value}`
													}
												>
													<span
														className={`text-[13px] text-[var(--color-text-secondary)] ${isSelected ? "font-medium" : "font-normal"}`}
														data-testid={formatToDataTestId(
															`filterbox-${filterOption.value}-filterBtn`,
														)}
													>
														{filterOption.value}
													</span>

													{filterOption.count && (
														<span className="text-[11px] text-[var(--color-text-tertiary)]">
															{filterOption.count}
														</span>
													)}
												</Button>
											);
										}
										return null;
									})}
									{shownListItems > 4 && (
										<Button
											type="button"
											variant="ghost"
											className="px-2 py-1 font-normal text-[#2563eb] text-[12px] no-underline hover:bg-transparent hover:text-[#2563eb]"
											onClick={() => {
												const visibleFilters = {
													...filterVisibility,
												};
												visibleFilters[entries[0]] = {
													open:
														!visibleFilters[
															entries[0]
														].open,
													value: visibleFilters[
														entries[0]
													].value,
													search: visibleFilters[
														entries[0]
													].search,
												};
												setFilterVisibility(
													visibleFilters,
												);
											}}
										>
											+ Show more
										</Button>
									)}
								</CollapsibleContent>
							</Collapsible>
							{i + 1 !== totalFilters && (
								<div className="my-2 h-[0.5px] w-full bg-[var(--color-border-tertiary)]" />
							)}
						</div>
					);
				})}
		</>
	);

	return (
		<div className="filterbox-scroll flex w-full flex-col overflow-y-auto overflow-x-hidden rounded-lg bg-card shadow-[0px_5px_22px_0px_rgba(0,0,0,0.06)] md:max-h-[calc(100vh-220px)] md:w-[352px]">
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
							className={`flex items-center px-4 pt-3 pb-1 ${
								hideHeaderToggleFrom && isDesktopFilterLayout
									? "justify-start"
									: "justify-between"
							}`}
						>
							<h6 className="flex-1 font-semibold text-lg">
								Filter By
							</h6>
							{!(
								hideHeaderToggleFrom && isDesktopFilterLayout
							) ? (
								<CollapsibleTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label={
											headerOpen
												? "Collapse filters"
												: "Expand filters"
										}
									>
										{headerOpen ? (
											<ChevronUp className="size-4" />
										) : (
											<ChevronDown className="size-4" />
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
