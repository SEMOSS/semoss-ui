import {
	ArrowDown,
	ArrowUp,
	LayoutGrid,
	List,
	Plus,
	Search,
	X,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useReducer,
	useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { debounced, useIteratorPixel } from "@semoss/sdk/react";
import {
	Button,
	H3,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
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
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { NavbarHeader, NavbarLeft } from "../../components/shared";

type TabMode = "Bookmarked" | "Mine" | "Discoverable" | "System";
type ViewMode = "grid" | "list";
type CloneRefreshState = {
	mode: TabMode;
	source: "apps" | "favoritedApps";
	targetCount: number;
	scrollTop: number;
	hasResetStarted: boolean;
};

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
		user_permission: undefined,
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
		user_permission: undefined,
		group_permission: "",
		tag: [],
		description: "Execute commands and see a response",
	},
	INSIGHT: {
		project_id: "insight-system-app",
		project_name: "Insight",
		project_type: "",
		project_cost: "",
		project_global: "",
		project_catalog_name: "",
		project_created_by: "SYSTEM",
		project_created_by_type: "",
		project_date_created: "",
		project_date_last_edited: "",
		project_has_portal: false,
		project_portal_name: "",
		project_portal_published_date: "",
		project_published_user: "",
		project_published_user_type: "",
		project_reactors_compiled_date: "",
		project_reactors_compiled_user: "",
		project_reactors_compiled_user_type: "",
		project_favorite: "",
		user_permission: undefined,
		group_permission: "",
		tag: [],
		description:
			"Create queries, dashboards, and visualizations to get the most out of your data.",
	},
};

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
	const createdByMeId = useId();

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
	const [view, setView] = useState<ViewMode>("list");
	const cardVariant = view === "list" ? "row" : "catalog";
	const containerClass =
		view === "list"
			? "flex flex-col gap-2"
			: "grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3";
	const [inputValue, setInputValue] = useState("");
	const [search, setSearch] = useState("");
	const [sortKey, setSortKey] = useState<
		"PROJECTNAME" | "DATECREATED" | "DATELASTEDITED"
	>("PROJECTNAME");
	const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
	const [createdByMe, setCreatedByMe] = useState(false);
	const [updatedNewApps, setUpdatedNewApps] = useState<AppMetadata[]>([]);
	const [cloneRefreshState, setCloneRefreshState] =
		useState<CloneRefreshState | null>(null);

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
		(filters: unknown) => {
			applyMetaFilters(filters as Record<string, unknown>);
			syncSearchParams(filters as Record<string, unknown>);
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

	// Fetch apps with pagination
	const getApps = useIteratorPixel<AppMetadata[], AppMetadata>(
		(limit, offset) => {
			if (isSystemMode || isBookmarkedMode) return "";

			return `${pixel}(metaKeys = ${JSON.stringify(
				metaKeysWithDescription,
			)}, metaFilters=[${JSON.stringify(
				metaFilters,
			)}], filterWord=["${search}"], sort=[{"${sortKey}" : "${sortOrder}"}], onlyPortals=[true], limit=[${limit}], offset=[${offset}]);`;
		},
		(response) => (response.length < APP_PAGE_LIMIT ? -1 : Infinity),
		(response) => response,
		{ limit: APP_PAGE_LIMIT },
		[mode, search, metaFiltersKey, sortKey, sortOrder],
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
			)}], filterWord=["${search}"], sort=[{"${sortKey}" : "${sortOrder}"}], onlyFavorites=[true], limit=[${limit}], offset=[${offset}]);`;
		},
		(response) => {
			if (response.length < APP_PAGE_LIMIT) {
				return -1;
			}
			return Infinity;
		},
		(response) => response,
		{ limit: APP_PAGE_LIMIT },
		[isBookmarkedMode, search, metaFiltersKey, sortKey, sortOrder],
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
			'[data-home-content="true"]',
		) as HTMLDivElement;
		setScroll(scrollEle);
		return () => setScroll(null);
	}, [setScroll]);

	useEffect(() => {
		void mode;
		void search;
		void metaFiltersKey;
		void sortKey;
		void sortOrder;
		resetScroll();
	}, [mode, search, metaFiltersKey, sortKey, sortOrder, resetScroll]);

	const handleCloneComplete = useCallback(() => {
		if (isSystemMode) {
			return;
		}

		const scrollEle = document.querySelector(
			'[data-home-content="true"]',
		) as HTMLDivElement | null;

		const nextRefreshState: CloneRefreshState = {
			mode,
			source: isBookmarkedMode ? "favoritedApps" : "apps",
			targetCount: isBookmarkedMode ? favoritedApps.length : apps.length,
			scrollTop: scrollEle?.scrollTop ?? 0,
			hasResetStarted: false,
		};

		setCloneRefreshState(nextRefreshState);
		resetScroll();

		if (isBookmarkedMode) {
			getFavoritedApps.reset();
			return;
		}

		getApps.reset();
	}, [
		apps.length,
		favoritedApps.length,
		getApps,
		getFavoritedApps,
		isBookmarkedMode,
		isSystemMode,
		mode,
		resetScroll,
	]);

	useEffect(() => {
		if (!cloneRefreshState) return;

		if (cloneRefreshState.mode !== mode) {
			setCloneRefreshState(null);
			return;
		}

		const source =
			cloneRefreshState.source === "favoritedApps"
				? getFavoritedApps
				: getApps;
		const loadedCount = Array.isArray(source.data) ? source.data.length : 0;

		if (!cloneRefreshState.hasResetStarted) {
			if (source.isLoading || loadedCount === 0) {
				setCloneRefreshState((prev) =>
					prev ? { ...prev, hasResetStarted: true } : prev,
				);
			}
			return;
		}

		if (source.isLoading) {
			return;
		}

		if (loadedCount < cloneRefreshState.targetCount && source.hasMore) {
			source.next();
			return;
		}

		const scrollEle = document.querySelector(
			'[data-home-content="true"]',
		) as HTMLDivElement | null;

		if (scrollEle) {
			requestAnimationFrame(() => {
				scrollEle.scrollTop = cloneRefreshState.scrollTop;
			});
		}

		setCloneRefreshState(null);
	}, [cloneRefreshState, mode, getApps, getFavoritedApps]);

	// Debounced search
	const debouncedSetSearch = debounced(
		(...args: unknown[]) => setSearch(args[0] as string),
		300,
	);

	const handleInputChange = useCallback(
		(value: string) => {
			setInputValue(value);
			debouncedSetSearch(value);
		},
		[debouncedSetSearch],
	);

	const handleSortChange = useCallback(
		(value: "PROJECTNAME" | "DATECREATED" | "DATELASTEDITED") => {
			setSortKey(value);
			resetScroll();
			getApps.reset();
			getFavoritedApps.reset();
		},
		[getApps, getFavoritedApps, resetScroll],
	);

	const handleSortOrderChange = useCallback(
		(value: "ASC" | "DESC") => {
			if (sortOrder === value) {
				return;
			}

			setSortOrder(value);
			resetScroll();
			getApps.reset();
			getFavoritedApps.reset();
		},
		[getApps, getFavoritedApps, resetScroll, sortOrder],
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

	// Apps to display
	const displayedApps = useMemo(() => {
		// For Bookmarked mode, use favoritedApps
		if (isBookmarkedMode) {
			if (createdByMe) {
				const currentUserId = configStore.store.user.id;
				return favoritedApps.filter(
					(app) => app.project_created_by === currentUserId,
				);
			}
			return favoritedApps;
		}

		// Filter by created by me if toggle is on and we're in "My Apps" tab
		if (createdByMe && mode === "Mine") {
			const currentUserId = configStore.store.user.id;
			return apps.filter(
				(app) => app.project_created_by === currentUserId,
			);
		}

		return apps;
	}, [
		apps,
		favoritedApps,
		isBookmarkedMode,
		createdByMe,
		mode,
		configStore.store.user.id,
	]);

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
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

				{/* Search */}
				<div className="flex flex-col gap-3">
					<div className="flex w-full min-w-0 flex-wrap items-end gap-2 md:flex-nowrap">
						<InputGroup className="h-10 min-w-[110px] flex-[1_1_auto]">
							<InputGroupAddon>
								<Search className="size-4" />
							</InputGroupAddon>
							<InputGroupInput
								className="h-10"
								placeholder="Search apps..."
								value={inputValue}
								onChange={(e) =>
									handleInputChange(e.target.value)
								}
								aria-label="Search apps"
							/>
							{inputValue ? (
								<InputGroupAddon align="inline-end">
									<InputGroupButton
										size="icon-xs"
										variant="ghost"
										onClick={() => handleInputChange("")}
										aria-label="Clear search"
									>
										<X className="size-4" />
									</InputGroupButton>
								</InputGroupAddon>
							) : null}
						</InputGroup>
						<div className="flex w-auto shrink-0 items-center gap-1">
							<div className="w-[136px] sm:w-[148px]">
								<Select
									value={sortKey}
									onValueChange={(value) =>
										handleSortChange(
											value as
												| "PROJECTNAME"
												| "DATECREATED"
												| "DATELASTEDITED",
										)
									}
								>
									<SelectTrigger
										className="h-9 w-full"
										aria-label="Sort By"
									>
										<SelectValue placeholder="Name" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="PROJECTNAME">
											Name
										</SelectItem>
										<SelectItem value="DATECREATED">
											Date Created
										</SelectItem>
										<SelectItem value="DATELASTEDITED">
											Date Last Edited
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex shrink-0 items-center gap-1">
								<Button
									variant={
										sortOrder === "ASC"
											? "default"
											: "outline"
									}
									size="icon-sm"
									className="h-9 w-9"
									title="Ascending Order"
									aria-label="Ascending Order"
									onClick={() => handleSortOrderChange("ASC")}
								>
									<ArrowUp className="size-4" />
								</Button>
								<Button
									variant={
										sortOrder === "DESC"
											? "default"
											: "outline"
									}
									size="icon-sm"
									className="h-9 w-9"
									title="Descending Order"
									aria-label="Descending Order"
									onClick={() =>
										handleSortOrderChange("DESC")
									}
								>
									<ArrowDown className="size-4" />
								</Button>
							</div>
							<div className="flex shrink-0 items-center gap-1">
								<Button
									variant={
										view === "list"
											? "secondary"
											: "outline"
									}
									size="icon-sm"
									className="h-9 w-9"
									aria-label="List view"
									title="List view"
									onClick={() => setView("list")}
								>
									<List className="size-4" />
								</Button>
								<Button
									variant={
										view === "grid"
											? "secondary"
											: "outline"
									}
									size="icon-sm"
									className="h-9 w-9"
									aria-label="Grid view"
									title="Grid view"
									onClick={() => setView("grid")}
								>
									<LayoutGrid className="size-4" />
								</Button>
							</div>
						</div>
					</div>
					{(mode === "Mine" || mode === "Bookmarked") && (
						<div className="mt-2 flex w-full justify-end">
							<div className="flex shrink-0 items-center gap-2">
								<Label
									htmlFor={createdByMeId}
									className="cursor-pointer text-sm"
								>
									Created by me
								</Label>
								<Switch
									id={createdByMeId}
									checked={createdByMe}
									onCheckedChange={setCreatedByMe}
								/>
							</div>
						</div>
					)}
				</div>

				<div className="flex flex-col gap-6 pb-8 md:flex-row md:items-start">
					{showFilters && (
						<div className="md:sticky md:top-4 md:w-[352px] md:shrink-0 md:self-start">
							<Filterbox
								type="PROJECT"
								applyOnMount={false}
								showHeader={true}
								hideHeaderToggleFrom="md"
								colorizeValues
								colorizeSelectedOnly
								onChange={handleFilterboxChange}
								filteredCatalogIds={renderedAppIds}
								filterBoxRefresh={filterBoxRefresh}
								onfilterBoxRefreshCompleted={() => {
									setFilterBoxRefresh(false);
								}}
							/>
						</div>
					)}

					<div className="flex min-w-0 flex-1 flex-col gap-6">
						{/* Tabs and Content */}
						<div className="flex flex-col gap-6">
							<div className="border-b pb-1">
								<Tabs
									value={mode}
									onValueChange={(val) =>
										setMode(val as TabMode)
									}
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
								(displayedApps.length > 0 ? (
									<div className={containerClass}>
										{displayedApps.map((app) => (
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
												favorite={() =>
													toggleFavorite(app)
												}
												onDelete={() => removeApp(app)}
												onCloneComplete={
													handleCloneComplete
												}
												isDiscoverable={false}
												isLoading={false}
												showSkeleton={false}
											/>
										))}
									</div>
								) : (
									<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
										<P>
											{createdByMe
												? "No bookmarked apps created by you found."
												: "No bookmarked apps found."}
										</P>
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
														: app.project_name ===
																"Insight"
															? "#/app/new/insight"
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
												favorite={() =>
													toggleFavorite(app)
												}
												onDelete={() => removeApp(app)}
												onCloneComplete={
													handleCloneComplete
												}
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

							{/* Empty State - Filter active, no matches */}
							{!isSystemMode &&
								!isBookmarkedMode &&
								!getApps.isLoading &&
								displayedApps.length === 0 &&
								apps.length > 0 &&
								createdByMe && (
									<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
										<P>No apps created by you found.</P>
									</div>
								)}

							{/* Empty State */}
							{!isSystemMode &&
								!isBookmarkedMode &&
								!getApps.isLoading &&
								displayedApps.length === 0 &&
								apps.length === 0 && (
									<div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
										<P>
											{createdByMe
												? "No apps created by you found."
												: "No apps found matching your search."}
										</P>
									</div>
								)}
						</div>
					</div>
				</div>
				<Help />
			</div>
		</>
	);
});
