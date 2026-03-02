import { ChevronDown, ChevronUp, Filter, Menu, Search } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { debounced } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	H3,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tabs,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { setProjectFavorite } from "@/api";
import { type AppMetadata, AppTileCard } from "@/components/app";
import { Help } from "@/components/help";
import { Filterbox } from "@/components/ui";
import { usePage, usePixel, useRootStore } from "@/hooks";
import { removeUnderscores, toTitleCase } from "@/utility";
import { NavbarLeft } from "../../components/shared";

type MODE = "Mine" | "Discoverable" | "System";

const initialState = {
	favoritedApps: [],
	apps: [],
};
const SKELETON_CARD_COUNT = 6;

const skeletonKeys = Array.from(
	{ length: SKELETON_CARD_COUNT },
	(_, i) => `skeleton-key-${i}`,
);

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

const BUSINESS_INTELLIGENCE_APP: AppMetadata = {
	project_id: "",
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
};

const TERMINAL_APP: AppMetadata = {
	project_id: "",
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
 * App page
 */
export const AppCatalogPage = observer((): JSX.Element => {
	const { configStore } = useRootStore();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [state, dispatch] = useReducer(reducer, initialState);
	const { favoritedApps, apps } = state;
	const [metaFilters, setMetaFilters] = useState<Record<string, unknown>>(
		() => {
			const nextFilters: Record<string, string[]> = {};

			if (searchParams.size > 0) {
				searchParams.forEach((value, key) => {
					if (!nextFilters[key]) {
						nextFilters[key] = [];
					}
					if (!nextFilters[key].includes(value)) {
						nextFilters[key].push(value);
					}
				});
			}

			return nextFilters;
		},
	);
	const [mode, setMode] = useState<MODE>("Mine");

	const [inputValue, setInputValue] = useState("");
	const [search, setSearch] = useState("");
	const appCatalogPageStatus = useRef({ removalChanges: false });
	const [isFiltersOpen, setIsFiltersOpen] = useState(false);
	const [isBookmarkedOpen, setIsBookmarkedOpen] = useState(true);

	const applyMetaFilters = useCallback(
		(nextFilters: Record<string, unknown>) => {
			setMetaFilters((prev) => {
				const prevJson = JSON.stringify(prev);
				const nextJson = JSON.stringify(nextFilters);
				if (prevJson === nextJson) {
					return prev;
				}
				return nextFilters;
			});
		},
		[],
	);

	useEffect(() => {
		const nextFilters: Record<string, string[]> = {};

		if (searchParams.size > 0) {
			searchParams.forEach((value, key) => {
				if (!nextFilters[key]) {
					nextFilters[key] = [];
				}
				if (!nextFilters[key].includes(value)) {
					nextFilters[key].push(value);
				}
			});
		}

		applyMetaFilters(nextFilters);
	}, [searchParams, applyMetaFilters]);

	// get a list of the keys
	const projectMetaKeys = configStore.store.config.projectMetaKeys.filter(
		(k) => {
			return (
				k.display_options === "single-checklist" ||
				k.display_options === "multi-checklist" ||
				k.display_options === "single-select" ||
				k.display_options === "multi-select" ||
				k.display_options === "single-typeahead" ||
				k.display_options === "multi-typeahead" ||
				k.display_options === "select-box"
			);
		},
	);

	// get metakeys to the ones we want
	const metaKeys = projectMetaKeys.map((k) => {
		return k.metakey;
	});

	let pixel = mode === "Mine" ? "MyProjects" : "MyDiscoverableProjects";

	pixel += `(metaKeys = ${JSON.stringify([
		...metaKeys,
		"description",
	])}, metaFilters=[${JSON.stringify(
		metaFilters,
	)}], filterWord=["${search}"], onlyPortals=[true]);`;

	/**
	 * @desc Get & Set Apps
	 */
	const getApps = usePixel<AppMetadata[]>(pixel);

	useEffect(() => {
		if (getApps.status !== "SUCCESS") {
			dispatch({
				type: "field",
				field: "apps",
				value: [],
			});
			return;
		}

		dispatch({
			type: "field",
			field: "apps",
			value: getApps.data,
		});
	}, [getApps.status, getApps.data]);

	/**
	 * @desc Get & Sets Favorited Apps
	 */
	let favoritePixel = "MyProjects";
	favoritePixel += `(metaKeys = ${JSON.stringify([
		...metaKeys,
		"description",
	])}, metaFilters=[${JSON.stringify(
		metaFilters,
	)}], filterWord=["${search}"], onlyFavorites=[true]);`;
	const getFavoritedApps = usePixel(favoritePixel);

	useEffect(() => {
		if (getFavoritedApps.status !== "SUCCESS") {
			dispatch({
				type: "field",
				field: "favoritedApps",
				value: [],
			});
			return;
		}

		dispatch({
			type: "field",
			field: "favoritedApps",
			value: getFavoritedApps.data,
		});
	}, [getFavoritedApps.status, getFavoritedApps.data]);

	const [updatedNewApps, setUpdatedNewApps] = useState([]);
	useEffect(() => {
		if (Object.keys(metaFilters).length === 0 && getApps.data?.length > 0) {
			setUpdatedNewApps(getApps.data);
		}
	}, [metaFilters, getApps.data]);

	const debouncedSet = debounced((newInputValue: string) => {
		setSearch(newInputValue);
	}, 300);

	const handleInputChange = (newInputValue) => {
		setInputValue(newInputValue);
		debouncedSet(newInputValue);
	};

	/**
	 * @name favoriteApp
	 * @desc action to favorite app
	 * @param app
	 */
	const notify = toast;

	const favoriteApp = (app) => {
		const favorite = !isFavorited(app.project_id);
		setProjectFavorite(app.project_id, favorite)
			.then(() => {
				notify.success(
					`Project ${favorite ? "bookmarked" : "unbookmarked"}`,
				);

				if (!favorite) {
					// Create a new array before modifying
					const newFavorites = [...favoritedApps];
					for (let i = newFavorites.length - 1; i >= 0; i--) {
						if (newFavorites[i].project_id === app.project_id) {
							newFavorites.splice(i, 1);
						}
					}
					dispatch({
						type: "field",
						field: "favoritedApps",
						value: newFavorites,
					});
				} else {
					dispatch({
						type: "field",
						field: "favoritedApps",
						value: [...favoritedApps, app],
					});
				}
			})
			.catch((err) => {
				notify.error("Unable to update favorite status");
				console.error(err);
			});
	};

	/**
	 * @name isFavorited
	 * @param id
	 * @desc determines if card is favorited
	 */
	const isFavorited = (id) => {
		const favorites = favoritedApps;

		if (!favorites) return false;
		return favorites.some((el) => el.project_id === id);
	};

	/**
	 * @desc Remove an app from the app list and the filters accordingly
	 * @param app the app to be removed
	 */
	const removeApp = (app) => {
		// Check if the app is favorited
		const favorite = isFavorited(app.project_id);
		// Filter out the app to be removed from the apps array
		const updatedApps = apps.filter((a) => a.project_id !== app.project_id);
		// Filter out the app to be removed from the newApps array
		const newApps = updatedNewApps.filter(
			(a) => a.project_id !== app.project_id,
		);
		// Filter out the app to be removed from the favoritedApps array
		setUpdatedNewApps(newApps);
		const updatedFavoritedApps = favorite
			? favoritedApps.filter((a) => a.project_id !== app.project_id)
			: favoritedApps;
		// Dispatch actions to update the state with the updated arrays
		dispatch({ type: "field", field: "apps", value: updatedApps });
		dispatch({
			type: "field",
			field: "favoritedApps",
			value: updatedFavoritedApps,
		});

		/**
		 * @desc toArr takes a value v and returns an array.
		 * If v is null, return an empty array.
		 * If v is an array, map each element to a string and trim the string.
		 * If v is not an array, return an array with a single element, which is the value of v converted to a string and trimmed.
		 * @param v
		 * @returns {Array<string>}
		 */
		const toArr = (v) =>
			v == null
				? []
				: Array.isArray(v)
					? v.map((x) => String(x).trim())
					: [String(v).trim()];
		/**
		 * @desc readTags extracts tags from an object.
		 * It uses optional chaining and nullish coalescing to handle cases where the tag or tags properties are null or undefined.
		 * @param a
		 * @returns {Array<string>}
		 */
		const readTags = (a) => toArr(a?.tag ?? a?.tags ?? []);
		/**
		 * @desc readDomains extracts domains from an object.
		 * It uses optional chaining and nullish coalescing to handle cases where the domain property is null or undefined.
		 * @param a
		 * @returns {Array<string>}
		 */
		const readDomains = (a) => toArr(a?.domain ?? []);

		// Check if metaFilters is falsy or if it has no keys
		if (!metaFilters || Object.keys(metaFilters).length === 0) {
			// Set appCatalogPageStatus.current.removalChanges to true if no filters are present
			appCatalogPageStatus.current.removalChanges = true;
			return;
		}
		// Create a new object nextFilters by spreading the properties of metaFilters into it
		const nextFilters = { ...(metaFilters || {}) };

		// Check if the tag property of metaFilters is not null
		if (metaFilters.tag != null) {
			// Convert the tag value to an array using the toArr function
			const selectedTags = toArr(metaFilters.tag);

			// Filter the newApps array to find tags that are still present
			const stillPresentTags = selectedTags.filter((tag) =>
				newApps.some((remainingApp) =>
					readTags(remainingApp).some((t) => t === tag),
				),
			);

			// If no tags are still present, delete the tag property from nextFilters
			if (stillPresentTags.length === 0) {
				delete nextFilters.tag;
			} else if (stillPresentTags.length > 0) {
				// If tags are still present, set the tag property of nextFilters to each tag
				stillPresentTags.forEach((t) => {
					nextFilters.tag = t;
				});
			}
		}

		// Check if the domain property of metaFilters is not null
		if (metaFilters.domain != null) {
			// Convert the domain value to an array using the toArr function
			const selectedDomains = toArr(metaFilters.domain);
			// Filter the newApps array to find domains that are still present
			const stillPresentDomains = selectedDomains.filter((domain) =>
				newApps.some((remainingApp) =>
					readDomains(remainingApp).some((d) => d === domain),
				),
			);
			// If no domains are still present, delete the domain property from nextFilters
			if (stillPresentDomains.length === 0) {
				delete nextFilters.domain;
			} else if (stillPresentDomains.length > 0) {
				// If domains are still present, set the domain property of nextFilters to each domain
				stillPresentDomains.forEach((t) => {
					nextFilters.domain = t;
				});
			}
		}
		// Check if the nextFilters object is different from the metaFilters object by comparing their JSON strings
		const filtersChanged =
			JSON.stringify(nextFilters) !== JSON.stringify(metaFilters);
		// If the filters have changed, update the metaFilters state with the nextFilters object
		if (filtersChanged) {
			applyMetaFilters(nextFilters);
		}

		appCatalogPageStatus.current.removalChanges = true;
	};

	// to limit the apps that are sent to filterbox for performance
	let renderedAppIds = [];
	if (inputValue) {
		renderedAppIds.push(...apps.map((app) => app.project_id));
		renderedAppIds.push(...favoritedApps.map((app) => app.project_id));
		if (renderedAppIds.length === 0) renderedAppIds = ["dummy-id"]; //dummy id to avoid empty array in query
	} else {
		renderedAppIds = [];
	}

	const activeFilters = Object.entries(metaFilters).flatMap(
		([filterKey, filterValue]) => {
			if (filterValue == null) {
				return [];
			}
			const values = Array.isArray(filterValue)
				? filterValue
				: [filterValue];
			return values.map((value) => ({
				key: filterKey,
				value: String(value),
				label: `${toTitleCase(removeUnderscores(filterKey))}: ${value}`,
			}));
		},
	);
	const activeFilterCount = activeFilters.length;
	const showFilters =
		mode !== "System" &&
		!configStore.store.config.adminOnlyViewMenuBarFlag &&
		configStore.isEngineOperationAvailable("PROJECT", "add");

	return (
		<>
			<NavbarLeft>
				<AppCatalogNavbarHeader />
			</NavbarLeft>
			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<H3 data-tour="app-library-title" className="text-2xl">
						Apps
					</H3>
					{configStore.isEngineOperationAvailable(
						"PROJECT",
						"add",
					) && (
						<Button
							variant="default"
							size="lg"
							onClick={() => {
								navigate("/app/new");
							}}
							aria-label="Open the App Model"
							data-testid="appCatalogPage-create-new-app-btn"
						>
							Create New App
						</Button>
					)}
				</div>

				<div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm">
					<div className="flex flex-wrap items-center gap-4">
						<div className="flex w-full items-center gap-3">
							<InputGroup className="flex-1">
								<InputGroupAddon>
									<Search className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									placeholder="Search"
									value={inputValue}
									onChange={(e) =>
										handleInputChange(e.target.value)
									}
								/>
							</InputGroup>
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
										className="mt-2 max-h-[calc(100vh-180px)] overflow-y-auto p-0"
									>
										<Filterbox
											type={"PROJECT"}
											applyOnMount={false}
											showHeader={false}
											onChange={(
												filters: Record<
													string,
													unknown
												>,
											) => {
												applyMetaFilters(filters);
											}}
											filteredCatalogIds={renderedAppIds}
											filterBoxRefresh={
												appCatalogPageStatus.current
													.removalChanges
											}
											onfilterBoxRefreshCompleted={() => {
												appCatalogPageStatus.current.removalChanges = false;
											}}
										/>
									</PopoverContent>
								</Popover>
							)}
						</div>
					</div>
				</div>

				{showFilters && (
					<div className="flex flex-wrap items-center gap-2">
						{activeFilterCount > 0 ? (
							activeFilters.map((filter) => (
								<Badge
									key={`${filter.key}-${filter.value}`}
									variant="outline"
								>
									{filter.label}
								</Badge>
							))
						) : (
							<P className="text-muted-foreground">
								No filters applied
							</P>
						)}
					</div>
				)}

				<div className="flex flex-col gap-6 pb-8">
					<Collapsible
						open={isBookmarkedOpen}
						onOpenChange={setIsBookmarkedOpen}
					>
						<div className="flex items-center justify-between">
							<P className="font-medium text-base">Bookmarked</P>
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() =>
										setIsBookmarkedOpen(!isBookmarkedOpen)
									}
									aria-label={
										isBookmarkedOpen
											? "Collapse bookmarked section"
											: "Expand bookmarked section"
									}
								>
									{isBookmarkedOpen ? (
										<ChevronUp className="size-4" />
									) : (
										<ChevronDown className="size-4" />
									)}
								</Button>
							</CollapsibleTrigger>
						</div>

						<CollapsibleContent className="mt-4">
							{favoritedApps.length > 0 ? (
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
									{favoritedApps.map((app) => {
										return (
											<AppTileCard
												key={app.project_id}
												app={app}
												systemApp={false}
												layout="responsive"
												href={`#/app/${app.project_id}/view`}
												onAction={() => {
													navigate(
														`/app/${app.project_id}/view`,
													);
												}}
												appType={app.project_type}
												isFavorite={isFavorited(
													app.project_id,
												)}
												favorite={() => {
													favoriteApp(app);
												}}
												onDelete={() => {
													removeApp(app);
												}}
												isDiscoverable={false}
												isLoading={false}
												showSkeleton={false}
											/>
										);
									})}
								</div>
							) : (
								<div className="rounded-lg border border-dashed p-4 text-muted-foreground">
									<P>No bookmarked apps match your search.</P>
								</div>
							)}
						</CollapsibleContent>
					</Collapsible>

					<div className="flex flex-wrap items-center justify-between gap-4">
						<Tabs
							value={mode}
							onValueChange={(val) => {
								dispatch({
									type: "field",
									field: "databases",
									value: [],
								});
								setMode(val as MODE);
							}}
						>
							<TabsList>
								<TabsTrigger
									value="Mine"
									data-testid="appCatalogPage-myApps-btn"
								>
									My Apps
								</TabsTrigger>
								<TabsTrigger
									value="Discoverable"
									data-testid="appCatalogPage-discoverable-btn"
								>
									Discoverable
								</TabsTrigger>
								<TabsTrigger
									value="System"
									data-testid="appCatalogPage-systemApps-btn"
								>
									System Apps
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{mode === "System" && (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{"bi".includes(search.toLowerCase()) && (
								<AppTileCard
									app={BUSINESS_INTELLIGENCE_APP}
									background="#BADEFF"
									href="../../../"
									systemApp={true}
									layout="responsive"
									appType={"BI"}
									isLoading={false}
									showSkeleton={false}
								/>
							)}

							{"terminal".includes(search.toLowerCase()) && (
								<AppTileCard
									// image={UPDATED_TERMINAL}
									app={TERMINAL_APP}
									background="#BADEFF"
									href="../../../#!/embed-terminal"
									systemApp={true}
									layout="responsive"
									appType={"TERMINAL"}
									isLoading={false}
									showSkeleton={false}
								/>
							)}
						</div>
					)}

					{mode !== "System" && getApps.status !== "SUCCESS" ? (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{skeletonKeys.map((key) => (
								<AppTileCard
									key={key.toString()}
									app={TERMINAL_APP}
									systemApp={false}
									layout="responsive"
									isDiscoverable={mode !== "Mine"}
									isLoading={true}
									showSkeleton={true}
								/>
							))}
						</div>
					) : null}

					{mode !== "System" && apps.length > 0 ? (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{apps
								.filter(
									(app) =>
										!favoritedApps.some(
											(filterApp) =>
												filterApp.project_id ===
												app.project_id,
										),
								)
								.map((app) => {
									return (
										<AppTileCard
											key={app.project_id}
											app={app}
											systemApp={false}
											layout="responsive"
											isDiscoverable={mode !== "Mine"}
											href={
												mode === "Discoverable"
													? `#/app/${app.project_id}`
													: `#/app/${app.project_id}/view`
											}
											onAction={() => {
												if (mode === "Discoverable") {
													navigate(
														`/app/${app.project_id}`,
													);
												} else {
													navigate(
														`/app/${app.project_id}/view`,
													);
												}
											}}
											appType={app.project_type}
											isFavorite={isFavorited(
												app.project_id,
											)}
											favorite={() => {
												favoriteApp(app);
											}}
											onDelete={() => {
												removeApp(app);
											}}
											isLoading={false}
											showSkeleton={false}
										/>
									);
								})}
						</div>
					) : null}
				</div>
				<Help />
			</div>
		</>
	);
});
