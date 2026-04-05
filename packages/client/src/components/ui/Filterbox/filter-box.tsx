import { Database, Earth, FileSpreadsheet, Tag, X } from "lucide-react";
import {
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
	Badge,
	Button,
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	InputGroupAddon,
} from "@semoss/ui/next";
import { usePixel, useRootStore } from "@/hooks";

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
		_showHeader = true,
		hideHeaderToggleFrom,
	} = props;
	const { configStore } = useRootStore();
	const [searchParams, setSearchParams] = useSearchParams();

	const [state, _dispatch] = useReducer(reducer, initialState);
	const { _filterSearch } = state;
	const [_showCollapsible, setShowCollapsible] = useState({});
	// const [headerOpen, setHeaderOpen] = useState(true);
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
			// setHeaderOpen(true); //OLD UI
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
			// biome-ignore lint/suspicious/noExplicitAny: <any for temporary fix>
			const keys = Array.from(new Set((searchParams as any).keys())); // unique keys in original order
			const newParams = new URLSearchParams();
			let hasInvalid = false;

			for (const key of keys) {
				const values = searchParams.getAll(key as string); // current values in original order
				const validValues = validMap[key as string] || [];

				// keep only values still valid (preserve order from `values`)
				const filtered = values.filter((v) => validValues.includes(v));

				// append filtered values in their original order (avoid duplicates)
				for (const v of filtered) {
					if (!newParams.getAll(key as string).includes(v)) {
						newParams.append(key as string, v);
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
	const handleFiltersSideEffects = useCallback(() => {
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
		console.log(nextParams, constructedFilters, "nextParams");
		Object.entries(constructedFilters).forEach(([key, value]) => {
			const values = Array.isArray(value) ? value : [value];
			values.forEach((val) => {
				nextParams.append(key, String(val));
			});
		});
		setSearchParams(nextParams);
	}, [filterVisibility, onChange, setSearchParams]);

	const selectedTagItems = useMemo(() => {
		return filterVisibility?.tag?.value || [];
	}, [filterVisibility?.tag?.value]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: useMemo dependencies
	const onFieldsValueChanged = useCallback(
		(item: { value: string; count: number }, filterLabel: string) => {
			setSelectedFilters(filterLabel, item);
			handleFiltersSideEffects();
		},
		[handleFiltersSideEffects],
	);
	// biome-ignore lint/correctness/useExhaustiveDependencies: useCallback dependencies are correct as is
	const clearFields = useCallback(
		(keyToUpdate = "") => {
			const constructedFilters = {};

			const resettedFilterOptions = fieldList.reduce((prev, current) => {
				if (keyToUpdate !== "") {
					if (current.metakey === keyToUpdate) {
						prev[current.metakey] = {
							open: false,
							value: [],
							search: "",
						};
					} else {
						prev[current.metakey] =
							filterVisibility[current.metakey];
					}
				} else {
					prev[current.metakey] = {
						open: false,
						value: [],
						search: "",
					};
				}

				return prev;
			}, {});
			console.log(resettedFilterOptions, "resettedFilterOptions");
			setFilterVisibility(resettedFilterOptions);
			Object.entries(
				resettedFilterOptions as typeof filterVisibility,
			).forEach((obj) => {
				if (obj[1].value.length) {
					constructedFilters[obj[0]] = [...obj[1].value];
				}
			});
			const nextParams = new URLSearchParams();
			Object.entries(constructedFilters).forEach(([key, value]) => {
				const values = Array.isArray(value) ? value : [value];
				values.forEach((val) => {
					nextParams.append(key, String(val));
				});
			});
			setSearchParams(nextParams);
		},
		[filterVisibility, fieldList, setSearchParams, setFilterVisibility],
	);

	const showClearAll = useMemo(() => {
		return Object.entries(filterVisibility).some(([_key, value]) => {
			return value.value.length > 0;
		});
	}, [filterVisibility]);

	return (
		<div className="filterbox-scroll flex gap-2 overflow-x-hidden overflow-y-hidden rounded-lg bg-none">
			<Combobox
				items={filterOptions?.tag}
				value={selectedTagItems}
				multiple
			>
				<div className={"flex flex-row bg-secondary-background"}>
					<ComboboxInput
						style={{
							position: "absolute",
							opacity: 0,
							pointerEvents: "none",
						}}
					>
						<InputGroupAddon>
							<div className="flex items-center gap-2">
								<Tag className="size-4 text-(--base-foreground,#0A0A0A)" />
								<span className="overflow-hidden text-ellipsis font-[Inter] font-medium text-(--base-foreground,#0A0A0A) text-sm not-italic leading-5">
									Tags
								</span>
								{selectedTagItems?.length > 0 ? (
									<Badge className="ml-1 rounded-full bg-[#F5F5F5] text-(--base-foreground,#0A0A0A) text-xs">
										{selectedTagItems.length}
									</Badge>
								) : null}
							</div>
						</InputGroupAddon>
					</ComboboxInput>
				</div>
				<ComboboxContent
					className={"filter-box-item-container w-[200px]"}
					align="end"
					alignOffset={-10}
					sideOffset={10}
				>
					{/* <ComboboxEmpty>No items found.</ComboboxEmpty> */}
					<div className="flex items-center justify-between border-gray-200 border-b bg-white py-2 pr-6 pl-3 font-semibold text-(--base-foreground,#0A0A0A) text-xs tracking-wider">
						<span className="flex">Tags</span>
						<span className="flex">
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => clearFields("tag")}
								className="text-primary"
							>
								Clear All
							</Button>
						</span>
					</div>
					<ComboboxGroup>
						<ComboboxList>
							{(item) => (
								<ComboboxItem
									key={`${item.value}-${item.count}`}
									value={item.value}
									className={
										filterVisibility?.tag?.value?.indexOf(
											item.value,
										) > -1
											? "bg-[#F5F5F5]"
											: ""
									}
									onClick={() => {
										onFieldsValueChanged(item, "tag");
									}}
								>
									<div className="flex w-full flex-row justify-between">
										<div className="flex">{item.value}</div>
										<div className="flex">{item.count}</div>
									</div>
								</ComboboxItem>
							)}
						</ComboboxList>
					</ComboboxGroup>
				</ComboboxContent>
			</Combobox>

			<Combobox
				items={filterOptions?.domain}
				value={filterVisibility?.domain?.value}
				multiple
			>
				<div className={"flex w-auto flex-row bg-secondary-background"}>
					<ComboboxInput
						style={{
							position: "absolute",
							opacity: 0,
							pointerEvents: "none",
						}}
					>
						<InputGroupAddon>
							<div className="flex items-center gap-2">
								<Earth className="size-4" />
								<span className="text-(--base-foreground,#0A0A0A) text-xs">
									Domain
								</span>
								{filterVisibility?.domain?.value?.length > 0 ? (
									<Badge className="ml-1 rounded-full bg-[#F5F5F5] text-(--base-foreground,#0A0A0A) text-xs">
										{filterVisibility?.domain?.value.length}
									</Badge>
								) : null}
							</div>
						</InputGroupAddon>
					</ComboboxInput>
				</div>
				<ComboboxContent
					className={"w-[200px]"}
					align="end"
					alignOffset={-10}
					sideOffset={10}
				>
					<div className="flex items-center justify-between border-gray-200 border-b bg-white py-2 pr-6 pl-3 font-semibold text-(--base-foreground,#0A0A0A) text-xs tracking-wider">
						<span className="flex">Domain</span>
						<span className="flex">
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => clearFields("domain")}
								className="text-primary"
							>
								Clear All
							</Button>
						</span>
					</div>
					<ComboboxEmpty>No items found.</ComboboxEmpty>
					<ComboboxList>
						{(item) => (
							<ComboboxItem
								key={`${item.value}-${item.count}`}
								value={item.value}
								className={
									filterVisibility?.domain?.value?.indexOf(
										item.value,
									) > -1
										? "bg-(--color-background-primary)"
										: ""
								}
								onClick={() => {
									onFieldsValueChanged(item, "domain");
								}}
							>
								<div className="flex w-full flex-row justify-between">
									<div className="flex">{item.value}</div>
									<div className="flex">{item.count}</div>
								</div>
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>

			<Combobox
				items={filterOptions["data classification"]}
				value={filterVisibility["data classification"].value}
				multiple
			>
				<div className={"flex w-auto flex-row bg-secondary-background"}>
					<ComboboxInput
						style={{
							position: "absolute",
							opacity: 0,
							pointerEvents: "none",
						}}
					>
						<InputGroupAddon>
							<div className="flex items-center gap-2">
								<FileSpreadsheet className="size-4" />
								<span className="text-(--base-foreground,#0A0A0A) text-xs">
									Data Classification
								</span>
								{filterVisibility["data classification"]?.value
									?.length > 0 ? (
									<Badge className="ml-1 rounded-full bg-[#F5F5F5] text-(--base-foreground,#0A0A0A) text-xs">
										{
											filterVisibility[
												"data classification"
											].value.length
										}
									</Badge>
								) : null}
							</div>
						</InputGroupAddon>
					</ComboboxInput>
				</div>
				<ComboboxContent
					className={"w-[200px]"}
					align="end"
					alignOffset={-10}
					sideOffset={10}
				>
					<ComboboxEmpty>No items found.</ComboboxEmpty>
					<ComboboxList>
						{(item) => (
							<ComboboxItem
								key={`${item.value}-${item.count}`}
								value={item.value}
								className={
									filterVisibility?.[
										"data classification"
									]?.value?.indexOf(item.value) > -1
										? "bg-(--color-background-primary)"
										: ""
								}
								onClick={() => {
									onFieldsValueChanged(
										item,
										"data classification",
									);
								}}
							>
								<div className="flex w-full flex-row justify-between">
									<div className="flex">{item.value}</div>
									<div className="flex">{item.count}</div>
								</div>
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>

			<Combobox
				items={filterOptions["data restrictions"]}
				value={filterVisibility["data restrictions"]?.value}
				multiple
			>
				<div className={"flex w-auto flex-row bg-secondary-background"}>
					<ComboboxInput
						style={{
							position: "absolute",
							opacity: 0,
							pointerEvents: "none",
						}}
					>
						<InputGroupAddon>
							<div className="flex items-center gap-2">
								<Database className="size-4" />
								<span className="text-(--base-foreground,#0A0A0A) text-xs">
									Data Restriction
								</span>
								{filterVisibility["data restrictions"]?.value
									?.length > 0 ? (
									<Badge className="ml-1 rounded-full bg-[#F5F5F5] text-(--base-foreground,#0A0A0A) text-xs">
										{
											filterVisibility[
												"data restrictions"
											]?.value.length
										}
									</Badge>
								) : null}
							</div>
						</InputGroupAddon>
					</ComboboxInput>
				</div>
				<ComboboxContent
					className={"w-[200px]"}
					align="end"
					alignOffset={-10}
					sideOffset={10}
				>
					<ComboboxEmpty>No items found.</ComboboxEmpty>
					<ComboboxList>
						{(item) => (
							<ComboboxItem
								key={`${item.value}-${item.count}`}
								value={item.value}
								className={
									filterVisibility?.[
										"data restrictions"
									]?.value?.indexOf(item.value) > -1
										? "bg-(--color-background-primary)"
										: ""
								}
								onClick={() => {
									onFieldsValueChanged(
										item,
										"data restrictions",
									);
								}}
							>
								<div className="flex w-full flex-row justify-between">
									<div className="flex">{item.value}</div>
									<div className="flex">{item.count}</div>
								</div>
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>

			<Button
				variant="secondary"
				className={"flex flex-row justify-around"}
				style={{ display: showClearAll ? "flex" : "none" }}
				onClick={() => {
					clearFields();
				}}
			>
				Clear All <X />
			</Button>
		</div>
	);
};
