import { ChevronDown, ChevronUp, Search as SearchIcon } from "lucide-react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
	Avatar,
	AvatarFallback,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Input,
	Separator,
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
	} = props;
	const { configStore } = useRootStore();
	const [searchParams, setSearchParams] = useSearchParams();

	const [state, dispatch] = useReducer(reducer, initialState);
	const { filterSearch } = state;
	const [showCollapsible, setShowCollapsible] = useState({});
	const [headerOpen, setHeaderOpen] = useState(true);

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
				<div className={showHeader ? "mx-2 mt-2" : "mx-2 mt-4"}>
					<div className="relative">
						<SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
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
							className="w-full border-none pl-9"
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
						<div key={entries[0]} className="px-6 py-2">
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
										className="flex w-full items-center justify-between bg-transparent p-2 text-(--foreground) hover:bg-accent"
									>
										<h6 className="font-semibold text-base">
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
													className={`mb-2 flex w-full items-center justify-between bg-transparent px-4 py-2 font-medium text-(--sidebar-foreground) text-sm hover:bg-(--accent) ${
														isSelected
															? "bg-(--accent) font-medium"
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
														className={`text-(--sidebar-foreground) text-sm ${isSelected ? "font-medium" : "font-normal"}`}
														data-testid={formatToDataTestId(
															`filterbox-${filterOption.value}-filterBtn`,
														)}
													>
														{filterOption.value}
													</span>

													{filterOption.count && (
														<Avatar className="size-4">
															<AvatarFallback className="bg-secondary font-medium text-foreground text-xs">
																{
																	filterOption.count
																}
															</AvatarFallback>
														</Avatar>
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
											className="text-(--primary) hover:bg-transparent hover:text-(--primary)"
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
											Show{" "}
											{filterVisibility[entries[0]].open
												? "Less"
												: "More"}
										</Button>
									)}
								</CollapsibleContent>
							</Collapsible>
							{i + 1 !== totalFilters && (
								<div className="w-full">
									<Separator />
								</div>
							)}
						</div>
					);
				})}
		</>
	);

	return (
		<div className="filterbox-scroll flex max-h-[calc(100vh-220px)] w-[352px] flex-col overflow-y-auto overflow-x-hidden bg-card shadow-[0px_5px_22px_0px_rgba(0,0,0,0.06)]">
			<div className="w-full">
				{showHeader ? (
					<Collapsible open={headerOpen} onOpenChange={setHeaderOpen}>
						<div className="flex items-center justify-between p-4">
							<h6 className="flex-1 font-semibold text-lg">
								Filter By
							</h6>
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => setHeaderOpen(!headerOpen)}
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
