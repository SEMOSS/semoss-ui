import { ChevronDown, ChevronUp, Search as SearchIcon } from "lucide-react";
import { useEffect, useReducer, useState } from "react";
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

export interface FilterboxProps {
	/** Determined to get metakeys for Engines/App */
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
	} = props;
	const { configStore } = useRootStore();
	const [searchParams, setSearchParams] = useSearchParams();

	const [state, dispatch] = useReducer(reducer, initialState);
	const { filterSearch } = state;
	const [showCollapsible, setShowCollapsible] = useState({});

	const tagColors = [
		"blue",
		"orange",
		"teal",
		"purple",
		"yellow",
		"pink",
		"violet",
		"olive",
	];

	const list =
		type === "PROJECT"
			? configStore.store.config.projectMetaKeys
			: configStore.store.config.databaseMetaKeys;

	// get a list of the keys
	const metaKeyList = list.filter((k) => {
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

	// get metakeys to the ones we want
	const metaKeys = metaKeyList.map((k) => {
		if (!k.display_values) {
			return k.metakey;
		}
		return null;
	});

	// Filter out nulls
	metaKeys.filter((v) => v);

	// track the options
	const [filterOptions, setFilterOptions] = useState<
		Record<string, { value: string; count: number }[]>
	>({});

	// track which filters are opened their selected value, and search term
	const [filterVisibility, setFilterVisibility] = useState<
		Record<string, { open: boolean; value: string[]; search: string }>
	>(() => {
		return metaKeyList.reduce((prev, current) => {
			prev[current.metakey] = {
				open: false,
				value: [],
				search: "",
			};

			return prev;
		}, {});
	});
	const [filterByVisibility, setFilterByVisibility] = useState(true);

	const getCatalogFilters = usePixel<
		{
			METAKEY: string;
			METAVALUE: string;
			count: number;
		}[]
	>(
		metaKeys.length > 0
			? type === "PROJECT"
				? `GetProjectMetaValues(metaKeys=${JSON.stringify(
						metaKeys.filter((mk) => mk),
					)}${
						filteredCatalogIds.length > 0
							? `, projectIdList = ${JSON.stringify(filteredCatalogIds)}`
							: ""
					}) ;`
				: `GetEngineMetaValues( engineTypes=["${type}"], metaKeys = ${JSON.stringify(
						metaKeys.filter((mk) => mk),
					)}${
						filteredCatalogIds.length > 0
							? `, engineIdList = ${JSON.stringify(filteredCatalogIds)}`
							: ""
					}) ;`
			: "",
	);
	//Refresh the pixel call, if any tagrefresh is needed
	useEffect(() => {
		if (filterBoxRefresh && filteredCatalogIds.length === 0) {
			getCatalogFilters.refresh();
		}
		onfilterBoxRefreshCompleted();
	}, [filterBoxRefresh]);

	// Apply the URL's query params to the filters' state on component mount.
	useEffect(() => {
		if (searchParams.size > 0) {
			searchParams.forEach((value, key) => {
				setSelectedFilters(key, { value, count: 0 });
			});
		}
		handleFiltersSideEffects();
	}, []);

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
				color: setFieldOptionColor(current.METAVALUE),
			});
			return prev;
		}, {});

		// add metakeys that don't get options from projects/engines but stored in config call
		const metaKeysWithOpts = list.filter((k) => {
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

		metaKeysWithOpts.forEach((filter) => {
			if (filter.display_values) {
				const split = filter.display_values.split(",");
				const formatted = split.map((val) => ({ value: val }));
				updated[filter.metakey] = formatted;
			}
			// Initialize filter metakey collapsibles to be open
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
			Object.entries(prevVisibility).forEach(([metaKey, metaVal]) => {
				const validValues = validMap[metaKey] || [];
				const filteredValues = metaVal.value.filter((val) =>
					validValues.includes(val),
				);

				if (filteredValues.length !== metaVal.value.length) {
					newVisibility[metaKey] = {
						...metaVal,
						value: filteredValues,
					};
				}
			});
			return newVisibility;
		});

		// 2) Clean up searchParams: preserve order, keys, and other valid keys (tag, domain, etc.)
		if (searchParams.size > 0) {
			const keys = [...new Set([...searchParams.keys()])]; // unique keys in original order
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
	}, [getCatalogFilters.status, getCatalogFilters.data, filteredCatalogIds]);
	/**
	 *
	 * @param opt - option for the field color
	 * @returns color
	 */
	const setFieldOptionColor = (opt: string): string => {
		return tagColors[
			opt
				.split("")
				.map((x) => x.charCodeAt(0))
				.reduce((a, b) => a + b, 0) % 8
		];
	};

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
				constructedFilters[obj[0]] = obj[1].value;
			}
		});
		// Pass filters to parent
		onChange(constructedFilters);
		// Update query params in the URL
		setSearchParams(constructedFilters);
	};

	return (
		<div className="flex h-fit w-[352px] flex-col bg-card shadow-[0px_5px_22px_0px_rgba(0,0,0,0.06)]">
			<div className="w-full">
				<Collapsible
					open={filterByVisibility}
					onOpenChange={setFilterByVisibility}
				>
					<div className="flex items-center justify-between p-4">
						<h6 className="flex-1 font-semibold text-lg">
							Filter By
						</h6>
						<CollapsibleTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() =>
									setFilterByVisibility(!filterByVisibility)
								}
							>
								{filterByVisibility ? (
									<ChevronUp className="size-4" />
								) : (
									<ChevronDown className="size-4" />
								)}
							</Button>
						</CollapsibleTrigger>
					</div>

					<CollapsibleContent>
						{/* Is there any filters */}
						{Object.entries(filterOptions).length ? (
							<div className="mx-2 mt-2">
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
								const totalFilters =
									Object.entries(filterOptions).length;
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
															removeUnderscores(
																entries[0],
															),
														)}
													</h6>
												</Button>
											</CollapsibleTrigger>

											<CollapsibleContent>
												{list.map((filterOption) => {
													if (
														shownListItems > 4 &&
														!filterVisibility[
															entries[0]
														].open
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
																key={
																	filterOption.value
																}
																className={`mb-2 flex w-full items-center justify-between bg-transparent px-4 py-2 hover:bg-(--accent) ${
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
																	className="text-sm"
																	data-testid={formatToDataTestId(
																		`filterbox-${filterOption.value}-filterBtn`,
																	)}
																>
																	{
																		filterOption.value
																	}
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
														className="w-full px-4 py-2 text-left text-primary text-sm hover:text-primary/90"
														onClick={() => {
															const visibleFilters =
																{
																	...filterVisibility,
																};
															visibleFilters[
																entries[0]
															] = {
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
														{filterVisibility[
															entries[0]
														].open
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
					</CollapsibleContent>
				</Collapsible>
			</div>
		</div>
	);
};
