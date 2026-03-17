import { Filter, LayoutGrid, List, Menu, Plus, Search, X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { debounced, useIteratorPixel, usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	H3,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	Switch,
	Tabs,
	TabsList,
	TabsTrigger,
	toast,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { setProjectFavorite } from "@/api";
import { type AppMetadata, AppTileCard } from "@/components/app";
import { Help } from "@/components/help";
import { Filterbox } from "@/components/ui";
import { usePage, useRootStore } from "@/hooks";
import { removeUnderscores, toTitleCase } from "@/utility";
import { NavbarLeft } from "../../components/shared";

type TabMode = "Bookmarked" | "Mine" | "Discoverable" | "System";
type ViewMode = "grid" | "list";
const VIEW_STORAGE_KEY = "appCatalogViewMode";

interface AppCatalogState {
	favoritedApps: AppMetadata[];
	apps: AppMetadata[];
}

const INITIAL_STATE: AppCatalogState = {
	favoritedApps: [],
	apps: [],
};

const SKELETON_CARD_COUNT = 6;
const APP_PAGE_LIMIT = 50;

const skeletonKeys = Array.from(
	{ length: SKELETON_CARD_COUNT },
	(_, i) => `skeleton-key-${i}`,
);

type ReducerAction = {
	type: "field";
	field: keyof AppCatalogState;
	value: AppCatalogState[keyof AppCatalogState];
};

const reducer = (
	state: AppCatalogState,
	action: ReducerAction,
): AppCatalogState => {
	if (action.type === "field") {
		return {
			...state,
			[action.field]: action.value,
		};
	}
	return state;
};

// System apps configuration
const SYSTEM_APPS: Record<string, AppMetadata> = {
	BI: {
		project_id: "bi-system-app",
		project_name: "BI",
		project_type: "",
		project_cost: "",
		project_global: "",
		project_catalog_name: "",
		project_created_by: "SYSTEM",
		project_created_by_type: "",
		project_date_last_edited: "",
		project_date_created: "",
		project_has_portal: false,
		project_portal_name: "",
		project_portal_published_date: "",
		project_published_user: "",
		project_published_user_type: "",
		project_reactors_compiled_date: "",
		project_reactors_compiled_user: "",
		project_reactors_compiled_user_type: "",
		project_favorite: "",
		user_permission: null,
		group_permission: "",
		tag: [],
		description: "Develop dashboards and visualizations to view data",
	},
	TERMINAL: {
		project_id: "terminal-system-app",
		project_name: "Terminal",
		project_type: "",
		project_cost: "",
		project_global: "",
		project_catalog_name: "",
		project_created_by: "SYSTEM",
		project_created_by_type: "",
		project_date_last_edited: "",
		project_date_created: "",
		project_has_portal: false,
		project_portal_name: "",
		project_portal_published_date: "",
		project_published_user: "",
		project_published_user_type: "",
		project_reactors_compiled_date: "",
		project_reactors_compiled_user: "",
		project_reactors_compiled_user_type: "",
		project_favorite: "",
		user_permission: null,
		group_permission: "",
		tag: [],
		description: "Execute commands and see a response",
	},
};

const AppCatalogNavbarHeader = observer((): JSX.Element | null => {
	const { page } = usePage();
	const { configStore } = useRootStore();

	if (page.sidebar.pinned) {
		return null;
	}

	return (
		<div className="flex items-center gap-2">
			<Button
				variant="outline"
				size="icon-sm"
				className="h-8 w-8 rounded-md border border-border"
				onMouseOver={() => page.openSidebar()}
				aria-label="Open sidebar"
			>
				<Menu className="size-4" />
			</Button>
			<Link
				to="/"
				aria-label="Go Home"
				className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-foreground no-underline hover:bg-muted/50"
			>
				{configStore.theme.logo ? (
					<img
						alt="logo"
						src={configStore.theme.logo}
						className="h-5 w-auto"
					/>
				) : null}
				<span className="truncate font-semibold text-sm">
					{configStore.theme.landingPageName ||
						configStore.theme.name}
				</span>
			</Link>
		</div>
	);
});

/**
 * Hook to manage app favoriting
 */
const useFavoriteApps = (
	apps: AppMetadata[],
	favoritedApps: AppMetadata[],
	dispatch: React.Dispatch<ReducerAction>,
) => {
	const isFavorited = useCallback(
		(app: AppMetadata) => {
			return (
				Boolean(app.project_favorite) ||
				favoritedApps.some(
					(favoriteApp) => favoriteApp.project_id === app.project_id,
				)
			);
		},
		[favoritedApps],
	);

	const toggleFavorite = useCallback(
		async (app: AppMetadata) => {
			const favorite = !isFavorited(app);

			try {
				await setProjectFavorite(app.project_id, favorite);
				toast.success(
					`App ${favorite ? "bookmarked" : "unbookmarked"}`,
				);

				if (favorite) {
					dispatch({
						type: "field",
						field: "favoritedApps",
						value: [...favoritedApps, app],
					});
				} else {
					dispatch({
						type: "field",
						field: "favoritedApps",
						value: favoritedApps.filter(
							(a) => a.project_id !== app.project_id,
						),
					});
				}

				dispatch({
					type: "field",
					field: "apps",
					value: apps.map((existingApp) =>
						existingApp.project_id === app.project_id
							? {
									...existingApp,
									project_favorite: favorite ? "true" : "",
								}
							: existingApp,
					),
				});
			} catch (err) {
				toast.error("Unable to update bookmark status");
				console.error(err);
			}
		},
		[favoritedApps, isFavorited, dispatch, apps],
	);

	return { isFavorited, toggleFavorite };
};

/**
 * Utility to convert values to array
 */
const toArray = <T,>(value: T | T[] | null | undefined): string[] => {
	if (value == null) return [];
	if (Array.isArray(value)) return value.map((x) => String(x).trim());
	return [String(value).trim()];
};

/**
 * Extract tags from app metadata
 */
const extractTags = (app: AppMetadata): string[] => {
	return toArray(app?.tag ?? []);
};

/**
 * Extract domains from app metadata
 */
const extractDomains = (app: AppMetadata): string[] => {
	const domain = (app as { domain?: unknown }).domain;
	return toArray(domain ?? []);
};

/**
 * App Catalog Page Component
 */
export const AppCatalogPage = observer((): JSX.Element => {
	const { configStore } = useRootStore();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
	const { favoritedApps, apps } = state;

	const [metaFilters, setMetaFilters] = useState<Record<string, unknown>>(
		() => {
			const nextFilters: Record<string, string[]> = {};
			searchParams.forEach((value, key) => {
				if (!nextFilters[key]) nextFilters[key] = [];
				if (!nextFilters[key].includes(value)) {
					nextFilters[key].push(value);
				}
			});
			return nextFilters;
		},
	);

	const [mode, setMode] = useState<TabMode>("Mine");
	const [view, setView] = useState<ViewMode>(() => {
		if (typeof window === "undefined") {
			return "grid";
		}
		const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
		return stored === "list" || stored === "grid" ? stored : "grid";
	});
	const cardVariant = view === "list" ? "row" : "catalog";
	const containerClass =
		view === "list"
			? "flex flex-col divide-y rounded-lg border bg-card"
			: "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
	const [inputValue, setInputValue] = useState("");
	const [search, setSearch] = useState("");
	const [isFiltersOpen, setIsFiltersOpen] = useState(false);
	const [createdByMeOnly, setCreatedByMeOnly] = useState(false);
	const [updatedNewApps, setUpdatedNewApps] = useState<AppMetadata[]>([]);

	const [filterBoxRefresh, setFilterBoxRefresh] = useState(false);

	// Memoize project meta keys
	const projectMetaKeys = useMemo(
		() =>
			configStore.store.config.projectMetaKeys.filter((k) =>
				[
					"single-checklist",
					"multi-checklist",
					"single-select",
					"multi-select",
					"single-typeahead",
					"multi-typeahead",
					"select-box",
				].includes(k.display_options),
			),
		[configStore.store.config.projectMetaKeys],
	);

	const metaKeys = useMemo(
		() => projectMetaKeys.map((k) => k.metakey),
		[projectMetaKeys],
	);

	const metaKeysWithDescription = useMemo(
		() => [...metaKeys, "description"],
		[metaKeys],
	);

	const metaFiltersKey = JSON.stringify(metaFilters);

	// Apply meta filters from URL params
	const applyMetaFilters = useCallback(
		(nextFilters: Record<string, unknown>) => {
			const normalized = Object.entries(nextFilters).reduce(
				(prev, [key, value]) => {
					if (value == null) {
						return prev;
					}
					prev[key] = Array.isArray(value) ? [...value] : value;
					return prev;
				},
				{} as Record<string, unknown>,
			);

			setMetaFilters((prev) => {
				const prevJson = JSON.stringify(prev);
				const nextJson = JSON.stringify(normalized);
				if (prevJson === nextJson) return prev;
				return normalized;
			});
		},
		[],
	);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}
		window.localStorage.setItem(VIEW_STORAGE_KEY, view);
	}, [view]);

	const syncSearchParams = useCallback(
		(filters: Record<string, unknown>) => {
			const params = new URLSearchParams();
			Object.entries(filters).forEach(([key, value]) => {
				if (value == null) {
					return;
				}
				const values = Array.isArray(value) ? value : [value];
				values.forEach((val) => {
					params.append(key, String(val));
				});
			});
			setSearchParams(params);
		},
		[setSearchParams],
	);

	const handleFilterboxChange = useCallback(
		(filters: Record<string, unknown>) => {
			applyMetaFilters(filters);
			syncSearchParams(filters);
		},
		[applyMetaFilters, syncSearchParams],
	);

	useEffect(() => {
		const nextFilters: Record<string, string[]> = {};
		searchParams.forEach((value, key) => {
			if (!nextFilters[key]) nextFilters[key] = [];
			if (!nextFilters[key].includes(value)) {
				nextFilters[key].push(value);
			}
		});
		applyMetaFilters(nextFilters);
	}, [searchParams, applyMetaFilters]);

	// Determine pixel query based on mode
	const isSystemMode = mode === "System";
	const isBookmarkedMode = mode === "Bookmarked";
	const pixel =
		mode === "Discoverable" ? "MyDiscoverableProjects" : "MyProjects";

	const getCreatedByMeApps = usePixel<{ createdProjects?: unknown }>(
		createdByMeOnly && !isSystemMode ? "CreatedByMeApps();" : "",
	);

	const createdByMeProjectIdSet = useMemo(() => {
		const createdProjects = getCreatedByMeApps.data?.createdProjects;

		if (Array.isArray(createdProjects)) {
			return new Set(createdProjects.map((id) => String(id)));
		}

		if (createdProjects != null && typeof createdProjects === "string") {
			return new Set([createdProjects]);
		}

		return new Set<string>();
	}, [getCreatedByMeApps.data]);

	// Fetch apps with pagination
	const getApps = useIteratorPixel<AppMetadata[], AppMetadata>(
		(limit, offset) => {
			if (isSystemMode || isBookmarkedMode) return "";

			return `${pixel}(metaKeys = ${JSON.stringify(
				metaKeysWithDescription,
			)}, metaFilters=[${JSON.stringify(
				metaFilters,
			)}], filterWord=["${search}"], onlyPortals=[true], limit=[${limit}], offset=[${offset}]);`;
		},
		(response) => (response.length < APP_PAGE_LIMIT ? -1 : Infinity),
		(response) => response,
		{ limit: APP_PAGE_LIMIT },
		[mode, search, metaFiltersKey],
	);

	useEffect(() => {
		const nextApps = Array.isArray(getApps.data) ? getApps.data : [];
		dispatch({
			type: "field",
			field: "apps",
			value: getApps.isError ? [] : nextApps,
		});
	}, [getApps.data, getApps.isError]);

	// Fetch favorited apps (Bookmarked tab only, with pagination)
	const getFavoritedApps = useIteratorPixel<AppMetadata[], AppMetadata>(
		(limit, offset) => {
			if (!isBookmarkedMode) {
				return "";
			}

			return `MyProjects(metaKeys = ${JSON.stringify(
				metaKeysWithDescription,
			)}, metaFilters=[${JSON.stringify(
				metaFilters,
			)}], filterWord=["${search}"], onlyFavorites=[true], limit=[${limit}], offset=[${offset}]);`;
		},
		(response) => {
			if (response.length < APP_PAGE_LIMIT) {
				return -1;
			}
			return Infinity;
		},
		(response) => response,
		{ limit: APP_PAGE_LIMIT },
		[isBookmarkedMode, search, metaFiltersKey],
	);

	useEffect(() => {
		if (!isBookmarkedMode) {
			dispatch({ type: "field", field: "favoritedApps", value: [] });
			return;
		}

		if (getFavoritedApps.isError) {
			dispatch({ type: "field", field: "favoritedApps", value: [] });
			return;
		}

		const nextFavorites = Array.isArray(getFavoritedApps.data)
			? getFavoritedApps.data
			: [];
		dispatch({
			type: "field",
			field: "favoritedApps",
			value: nextFavorites,
		});
	}, [isBookmarkedMode, getFavoritedApps.data, getFavoritedApps.isError]);

	// Track new apps for filter management
	useEffect(() => {
		if (Object.keys(metaFilters).length === 0 && getApps.data?.length > 0) {
			setUpdatedNewApps(getApps.data);
		}
	}, [metaFilters, getApps.data]);

	// Infinite scroll setup
	const scrollSource = isBookmarkedMode ? getFavoritedApps : getApps;
	const { setScroll, resetScroll } = useInfiniteScroll({
		disabled:
			isSystemMode || scrollSource.isLoading || !scrollSource.hasMore,
		triggerOnMount: false,
		onNext: () => scrollSource.next(),
	});

	useEffect(() => {
		const scrollEle = document.querySelector(
			"#home__content",
		) as HTMLDivElement;
		setScroll(scrollEle);
		return () => setScroll(null);
	}, [setScroll]);

	useEffect(() => {
		void mode;
		void search;
		void metaFiltersKey;
		resetScroll();
	}, [mode, search, metaFiltersKey, resetScroll]);

	// Debounced search
	const debouncedSetSearch = debounced(
		(value: string) => setSearch(value),
		300,
	);

	const handleInputChange = useCallback(
		(value: string) => {
			setInputValue(value);
			debouncedSetSearch(value);
		},
		[debouncedSetSearch],
	);

	// Favorite management
	const { isFavorited, toggleFavorite } = useFavoriteApps(
		apps,
		favoritedApps,
		dispatch,
	);

	// Remove app and update filters
	const removeApp = useCallback(
		(app: AppMetadata) => {
			const favorite = isFavorited(app);
			const updatedApps = apps.filter(
				(a) => a.project_id !== app.project_id,
			);
			const newApps = updatedNewApps.filter(
				(a) => a.project_id !== app.project_id,
			);

			setUpdatedNewApps(newApps);

			const updatedFavoritedApps = favorite
				? favoritedApps.filter((a) => a.project_id !== app.project_id)
				: favoritedApps;

			dispatch({ type: "field", field: "apps", value: updatedApps });
			dispatch({
				type: "field",
				field: "favoritedApps",
				value: updatedFavoritedApps,
			});

			if (!metaFilters || Object.keys(metaFilters).length === 0) {
				setFilterBoxRefresh(true);
				return;
			}

			const nextFilters = { ...metaFilters };

			// Update tag filters
			if (metaFilters.tag != null) {
				const selectedTags = toArray(metaFilters.tag);
				const stillPresentTags = selectedTags.filter((tag) =>
					newApps.some((remainingApp) =>
						extractTags(remainingApp).includes(tag),
					),
				);

				if (stillPresentTags.length === 0) {
					delete nextFilters.tag;
				} else {
					nextFilters.tag =
						stillPresentTags.length === 1
							? stillPresentTags[0]
							: stillPresentTags;
				}
			}

			// Update domain filters
			if (metaFilters.domain != null) {
				const selectedDomains = toArray(metaFilters.domain);
				const stillPresentDomains = selectedDomains.filter((domain) =>
					newApps.some((remainingApp) =>
						extractDomains(remainingApp).includes(domain),
					),
				);

				if (stillPresentDomains.length === 0) {
					delete nextFilters.domain;
				} else {
					nextFilters.domain =
						stillPresentDomains.length === 1
							? stillPresentDomains[0]
							: stillPresentDomains;
				}
			}

			const filtersChanged =
				JSON.stringify(nextFilters) !== JSON.stringify(metaFilters);

			if (filtersChanged) {
				applyMetaFilters(nextFilters);
				syncSearchParams(nextFilters);
			}

			setFilterBoxRefresh(true);
		},
		[
			apps,
			favoritedApps,
			updatedNewApps,
			isFavorited,
			metaFilters,
			applyMetaFilters,
			syncSearchParams,
		],
	);

	// Generate rendered app IDs for filterbox
	const renderedAppIds = useMemo(() => {
		if (!inputValue) return [];

		const ids = [
			...apps.map((app) => app.project_id),
			...favoritedApps.map((app) => app.project_id),
		];

		return ids.length === 0 ? ["dummy-id"] : ids;
	}, [inputValue, apps, favoritedApps]);

	// Active filters display
	const activeFilters = useMemo(
		() =>
			Object.entries(metaFilters).flatMap(([filterKey, filterValue]) => {
				if (filterValue == null) return [];
				const values = Array.isArray(filterValue)
					? filterValue
					: [filterValue];
				return values.map((value) => ({
					key: filterKey,
					value: String(value),
					label: `${toTitleCase(removeUnderscores(filterKey))}: ${value}`,
				}));
			}),
		[metaFilters],
	);

	const activeFilterCount = activeFilters.length;
	const showFilters =
		!configStore.store.config.adminOnlyViewMenuBarFlag &&
		configStore.isEngineOperationAvailable("PROJECT", "add");

	// Filtered system apps
	const filteredSystemApps = useMemo(() => {
		const searchLower = search.toLowerCase();
		return Object.values(SYSTEM_APPS).filter((app) =>
			app.project_name.toLowerCase().includes(searchLower),
		);
	}, [search]);

	const displayedFavoritedApps = useMemo(() => {
		if (!createdByMeOnly || isSystemMode) {
			return favoritedApps;
		}

		return favoritedApps.filter((app) =>
			createdByMeProjectIdSet.has(app.project_id),
		);
	}, [
		favoritedApps,
		createdByMeOnly,
		isSystemMode,
		createdByMeProjectIdSet,
	]);

	// Apps to display (excluding favorited apps in non-bookmarked modes)
	const displayedApps = useMemo(() => {
		if (isBookmarkedMode) return [];

		const nonFavoritedApps = apps.filter((app) => !isFavorited(app));

		if (!createdByMeOnly || isSystemMode) {
			return nonFavoritedApps;
		}

		return nonFavoritedApps.filter((app) =>
			createdByMeProjectIdSet.has(app.project_id),
		);
	}, [
		apps,
		isBookmarkedMode,
		isFavorited,
		createdByMeOnly,
		isSystemMode,
		createdByMeProjectIdSet,
	]);

	return (
		<>
			<NavbarLeft>
				<AppCatalogNavbarHeader />
			</NavbarLeft>
			<div className="flex flex-col gap-6">
				{/* Header */}
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<H3 data-tour="app-library-title" className="text-2xl">
							Apps
						</H3>
						<P className="text-muted-foreground">
							Manage and discover applications
						</P>
					</div>
					{configStore.isEngineOperationAvailable(
						"PROJECT",
						"add",
					) && (
						<Button
							variant="default"
							size="lg"
							onClick={() => navigate("/app/new")}
							aria-label="Create new app"
							data-testid="appCatalogPage-create-new-app-btn"
						>
							<Plus className="size-4" />
							Create New App
						</Button>
					)}
				</div>

				{/* Search and Filters */}
				<div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm">
					<div className="flex flex-col gap-3 md:flex-row md:items-center">
						<InputGroup className="flex-1">
							<InputGroupAddon>
								<Search className="size-4" />
							</InputGroupAddon>
							<InputGroupInput
								placeholder="Search apps..."
								value={inputValue}
								onChange={(e) =>
									handleInputChange(e.target.value)
								}
								aria-label="Search apps"
							/>
						</InputGroup>
						<div className="flex items-center gap-2">
							{showFilters && (
								<Popover
									open={isFiltersOpen}
									onOpenChange={setIsFiltersOpen}
								>
									<PopoverTrigger asChild>
										<Button variant="outline">
											<Filter className="size-4" />
											Filters
											{activeFilterCount > 0
												? ` (${activeFilterCount})`
												: ""}
										</Button>
									</PopoverTrigger>
									<PopoverContent
										align="end"
										className="mt-2 max-h-[calc(100vh-180px)] w-auto max-w-[70vw] overflow-y-auto p-0"
									>
										<Filterbox
											type="PROJECT"
											applyOnMount={false}
											showHeader={false}
											onChange={handleFilterboxChange}
											filteredCatalogIds={renderedAppIds}
											filterBoxRefresh={filterBoxRefresh}
											onfilterBoxRefreshCompleted={() => {
												setFilterBoxRefresh(false);
											}}
										/>
									</PopoverContent>
								</Popover>
							)}
							<div className="flex items-center gap-1">
								<Button
									variant={
										view === "grid"
											? "secondary"
											: "outline"
									}
									size="icon-sm"
									aria-label="Grid view"
									title="Grid view"
									onClick={() => setView("grid")}
								>
									<LayoutGrid className="size-4" />
								</Button>
								<Button
									variant={
										view === "list"
											? "secondary"
											: "outline"
									}
									size="icon-sm"
									aria-label="List view"
									title="List view"
									onClick={() => setView("list")}
								>
									<List className="size-4" />
								</Button>
							</div>
						</div>
					</div>
				</div>

				<div className="flex justify-end">
					<div className="flex items-center gap-2">
						<P className="text-sm">Created by me</P>
						<Switch
							checked={createdByMeOnly}
							onCheckedChange={setCreatedByMeOnly}
							disabled={isSystemMode}
							aria-label="Created by me"
						/>
					</div>
				</div>

				{/* Active Filters */}
				{showFilters && (
					<div className="-my-3 flex flex-wrap items-center gap-2">
						{isSystemMode ? (
							<P className="text-[11px] text-muted-foreground">
								{activeFilterCount > 0
									? "Filters not applied"
									: "Filters not applicable"}
							</P>
						) : activeFilterCount > 0 ? (
							<>
								{activeFilters.map((filter) => (
									<Badge
										key={`${filter.key}-${filter.value}`}
										variant="outline"
										className="gap-1"
									>
										{filter.label}
										<button
											type="button"
											onClick={() => {
												const nextFilters = {
													...metaFilters,
												};
												const currentValue =
													nextFilters[filter.key];

												if (
													Array.isArray(currentValue)
												) {
													const updated =
														currentValue.filter(
															(v) =>
																String(v) !==
																filter.value,
														);
													if (updated.length === 0) {
														delete nextFilters[
															filter.key
														];
													} else {
														nextFilters[
															filter.key
														] = updated;
													}
												} else {
													delete nextFilters[
														filter.key
													];
												}

												applyMetaFilters(nextFilters);
												syncSearchParams(nextFilters);
												setFilterBoxRefresh(true);
											}}
											className="ml-1 hover:text-destructive"
											aria-label={`Remove ${filter.label} filter`}
										>
											<X className="size-3" />
										</button>
									</Badge>
								))}
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										applyMetaFilters({});
										syncSearchParams({});
										setFilterBoxRefresh(true);
									}}
								>
									Clear all
								</Button>
							</>
						) : (
							<P className="text-[11px] text-muted-foreground">
								No filters applied
							</P>
						)}
					</div>
				)}

				{/* Tabs and Content */}
				<div className="flex flex-col gap-6 pb-8">
					<div className="border-b pb-1">
						<Tabs
							value={mode}
							onValueChange={(val) => setMode(val as TabMode)}
						>
							<TabsList className="w-full flex-nowrap justify-start gap-4 overflow-x-auto rounded-none bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
								<TabsTrigger
									value="Mine"
									data-testid="appCatalogPage-myApps-btn"
									className="!flex-none !border-0 !bg-transparent !shadow-none hover:!bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:!text-primary after:-bottom-[1px] relative whitespace-nowrap rounded-none px-1 pb-3 text-sm after:absolute after:right-0 after:left-0 after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100"
								>
									My Apps
								</TabsTrigger>
								<TabsTrigger
									value="Bookmarked"
									data-testid="appCatalogPage-bookmarked-btn"
									className="!flex-none !border-0 !bg-transparent !shadow-none hover:!bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:!text-primary after:-bottom-[1px] relative whitespace-nowrap rounded-none px-1 pb-3 text-sm after:absolute after:right-0 after:left-0 after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100"
								>
									Bookmarked Apps
								</TabsTrigger>
								<TabsTrigger
									value="Discoverable"
									data-testid="appCatalogPage-discoverable-btn"
									className="!flex-none !border-0 !bg-transparent !shadow-none hover:!bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:!text-primary after:-bottom-[1px] relative whitespace-nowrap rounded-none px-1 pb-3 text-sm after:absolute after:right-0 after:left-0 after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100"
								>
									Discoverable Apps
								</TabsTrigger>
								<TabsTrigger
									value="System"
									data-testid="appCatalogPage-systemApps-btn"
									className="!flex-none !border-0 !bg-transparent !shadow-none hover:!bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:!text-primary after:-bottom-[1px] relative whitespace-nowrap rounded-none px-1 pb-3 text-sm after:absolute after:right-0 after:left-0 after:h-0.5 after:bg-primary after:opacity-0 data-[state=active]:after:opacity-100"
								>
									System Apps
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{/* Bookmarked Apps */}
					{isBookmarkedMode &&
						(displayedFavoritedApps.length > 0 ? (
							<div className={containerClass}>
								{displayedFavoritedApps.map((app) => (
									<AppTileCard
										key={app.project_id}
										app={app}
										systemApp={false}
										layout="responsive"
										variant={cardVariant}
										href={`#/app/${app.project_id}/view`}
										onAction={() =>
											navigate(
												`/app/${app.project_id}/view`,
											)
										}
										appType={app.project_type}
										isFavorite={true}
										favorite={() => toggleFavorite(app)}
										onDelete={() => removeApp(app)}
										isDiscoverable={false}
										isLoading={false}
										showSkeleton={false}
									/>
								))}
							</div>
						) : (
							<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
								<P>No bookmarked apps found.</P>
							</div>
						))}

					{/* System Apps */}
					{isSystemMode && (
						<div className={containerClass}>
							{filteredSystemApps.length > 0 ? (
								filteredSystemApps.map((app) => (
									<AppTileCard
										key={app.project_id}
										app={app}
										background="#BADEFF"
										href={
											app.project_name === "BI"
												? "../../../"
												: "../../../#!/embed-terminal"
										}
										systemApp={true}
										layout="responsive"
										variant={cardVariant}
										appType={app.project_type}
										isLoading={false}
										showSkeleton={false}
									/>
								))
							) : (
								<div className="col-span-full rounded-lg border border-dashed p-8 text-center text-muted-foreground">
									<P>No system apps found.</P>
								</div>
							)}
						</div>
					)}

					{/* Loading Skeletons */}
					{!isSystemMode &&
						!isBookmarkedMode &&
						getApps.isLoading &&
						apps.length === 0 && (
							<div className={containerClass}>
								{skeletonKeys.map((key) => (
									<AppTileCard
										key={key}
										app={SYSTEM_APPS.TERMINAL}
										systemApp={false}
										layout="responsive"
										variant={cardVariant}
										isDiscoverable={mode !== "Mine"}
										isLoading={true}
										showSkeleton={true}
									/>
								))}
							</div>
						)}

					{/* Regular Apps */}
					{!isSystemMode &&
						!isBookmarkedMode &&
						displayedApps.length > 0 && (
							<div className={containerClass}>
								{displayedApps.map((app) => (
									<AppTileCard
										key={app.project_id}
										app={app}
										systemApp={false}
										layout="responsive"
										variant={cardVariant}
										isDiscoverable={mode !== "Mine"}
										href={
											mode === "Discoverable"
												? `#/app/${app.project_id}`
												: `#/app/${app.project_id}/view`
										}
										onAction={() => {
											navigate(
												mode === "Discoverable"
													? `/app/${app.project_id}`
													: `/app/${app.project_id}/view`,
											);
										}}
										appType={app.project_type}
										isFavorite={isFavorited(app)}
										favorite={() => toggleFavorite(app)}
										onDelete={() => removeApp(app)}
										isLoading={false}
										showSkeleton={false}
									/>
								))}
							</div>
						)}

					{/* Loading More Indicator */}
					{!isSystemMode &&
						!isBookmarkedMode &&
						getApps.isLoading &&
						apps.length > 0 && (
							<div className="flex items-center justify-center py-4">
								<Spinner className="size-5" />
							</div>
						)}

					{/* Empty State */}
					{!isSystemMode &&
						!isBookmarkedMode &&
						!getApps.isLoading &&
						displayedApps.length === 0 && (
							<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
								<P>No apps found matching your search.</P>
							</div>
						)}
				</div>
				<Help />
			</div>
		</>
	);
});
