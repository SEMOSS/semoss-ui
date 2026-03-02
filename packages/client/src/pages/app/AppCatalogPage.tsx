import { FilterList } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { debounced } from "@semoss/sdk/react";
import {
	Button,
	Chip,
	Popover,
	Stack,
	styled,
	TextField,
	ToggleTabsGroup,
	Typography,
	useNotification,
} from "@semoss/ui";
import { setProjectFavorite } from "@/api";
import { type AppMetadata, AppTileCard } from "@/components/app";
import { Help } from "@/components/help";
import { Filterbox } from "@/components/ui";
import { usePixel, useRootStore } from "@/hooks";
import { removeUnderscores, toTitleCase } from "@/utility";
import { NavbarHeader, NavbarLeft } from "../../components/shared";

const StyledSection = styled("div")(({ theme }) => ({
	display: "grid",
	gridTemplateColumns: "repeat(3, minmax(240px, 1fr))",
	gap: theme.spacing(3),
	justifyContent: "start",
	alignItems: "stretch",
	[theme.breakpoints.down("lg")]: {
		gridTemplateColumns: "repeat(2, minmax(240px, 1fr))",
	},
	[theme.breakpoints.down("md")]: {
		gridTemplateColumns: "repeat(1, minmax(240px, 1fr))",
	},
}));

const StyledContentContainer = styled("div")(({ theme }) => ({
	width: "100%",
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(3),
}));

const StyledSectionLabel = styled(Typography)(() => ({
	size: "16px",
	fontWeight: "500",
}));

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
	border: "1px",
	minHeight: "42px",
	color: theme.palette.secondary.light,
	borderRadius: theme.shape.borderRadius,
	alignItems: "center",
	padding: "0px 3px",
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
	height: "38px",
	padding: "8px 11px",
	"&.MuiTab-root": {
		borderRadius: theme.shape.borderRadius,
	},
	"&.Mui-selected": {
		boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.05)",
	},
}));

const StyledTopBar = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
	padding: theme.spacing(2),
	borderRadius: theme.shape.borderRadius,
	border: `1px solid ${theme.palette.divider}`,
	background: theme.palette.background.paper,
	boxShadow: "0px 8px 18px rgba(0, 0, 0, 0.08)",
}));

const StyledControlsRow = styled("div")(({ theme }) => ({
	display: "flex",
	flexWrap: "wrap",
	gap: theme.spacing(2),
	alignItems: "center",
	justifyContent: "flex-start",
}));

const StyledSearchRow = styled("div")(({ theme }) => ({
	display: "flex",
	flex: "1 1 100%",
	gap: theme.spacing(1.5),
	alignItems: "center",
	justifyContent: "flex-start",
}));

const StyledSearchField = styled(TextField)(({ theme }) => ({
	flex: "1 1 auto",
	maxWidth: "100%",
	background: theme.palette.background.paper,
}));

const StyledFilterChipsRow = styled("div")(({ theme }) => ({
	display: "flex",
	flexWrap: "wrap",
	gap: theme.spacing(1),
	alignItems: "center",
}));

const StyledFilterChip = styled(Chip)(({ theme }) => ({
	borderRadius: "999px",
	background: theme.palette.background.default,
}));

const StyledFilterPopover = styled(Popover)(({ theme }) => ({
	".MuiPopover-paper": {
		marginTop: theme.spacing(1),
		borderRadius: theme.shape.borderRadius,
		boxShadow: "0px 14px 34px rgba(0, 0, 0, 0.16)",
		maxHeight: "calc(100vh - 180px)",
		overflowY: "auto",
	},
}));

const StyledAppsSectionHeader = styled("div")(({ theme }) => ({
	display: "flex",
	flexWrap: "wrap",
	gap: theme.spacing(2),
	alignItems: "center",
	justifyContent: "space-between",
}));

const StyledEmptyState = styled("div")(({ theme }) => ({
	borderRadius: theme.shape.borderRadius,
	border: `1px dashed ${theme.palette.divider}`,
	padding: theme.spacing(2),
	color: theme.palette.text.secondary,
}));

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
	const [filtersAnchorEl, setFiltersAnchorEl] = useState<HTMLElement | null>(
		null,
	);

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
	const notification = useNotification();

	const favoriteApp = (app) => {
		const favorite = !isFavorited(app.project_id);
		setProjectFavorite(app.project_id, favorite)
			.then(() => {
				notification.add({
					color: "success",
					message: `Project ${favorite ? "bookmarked" : "unbookmarked"}`,
				});

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
				notification.add({
					color: "error",
					message: "Unable to update favorite status",
				});
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
	const isFiltersOpen = Boolean(filtersAnchorEl);
	const showFilters =
		mode !== "System" &&
		!configStore.store.config.adminOnlyViewMenuBarFlag &&
		configStore.isEngineOperationAvailable("PROJECT", "add");

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<Stack direction="column" gap={2}>
				<Stack>
					<Stack
						direction="row"
						alignItems={"center"}
						justifyContent={"space-between"}
						spacing={4}
					>
						<Typography
							data-tour="app-library-title"
							variant={"h4"}
						>
							Apps
						</Typography>
						{configStore.isEngineOperationAvailable(
							"PROJECT",
							"add",
						) && (
							<Button
								size={"large"}
								variant={"contained"}
								onClick={() => {
									navigate("/app/new");
								}}
								aria-label={`Open the App Model`}
								data-testid={
									"appCatalogPage-create-new-app-btn"
								}
							>
								Create New App
							</Button>
						)}
					</Stack>
				</Stack>
				<StyledTopBar>
					<StyledControlsRow>
						<StyledSearchRow>
							<StyledSearchField
								size="small"
								label="Search"
								value={inputValue}
								onChange={(e) =>
									handleInputChange(e.target.value)
								}
							/>
							{showFilters && (
								<Button
									variant="outlined"
									startIcon={<FilterList />}
									onClick={(event) => {
										setFiltersAnchorEl(event.currentTarget);
									}}
								>
									Filters
									{activeFilterCount > 0
										? ` (${activeFilterCount})`
										: ""}
								</Button>
							)}
						</StyledSearchRow>
					</StyledControlsRow>
				</StyledTopBar>
				{showFilters && (
					<StyledFilterChipsRow>
						{activeFilterCount > 0 ? (
							activeFilters.map((filter) => (
								<StyledFilterChip
									key={`${filter.key}-${filter.value}`}
									label={filter.label}
									variant="outlined"
									size="small"
								/>
							))
						) : (
							<Typography variant="body2" color="text.secondary">
								No filters applied
							</Typography>
						)}
					</StyledFilterChipsRow>
				)}
				{showFilters && (
					<StyledFilterPopover
						open={isFiltersOpen}
						anchorEl={filtersAnchorEl}
						onClose={() => setFiltersAnchorEl(null)}
						anchorOrigin={{
							vertical: "bottom",
							horizontal: "right",
						}}
						transformOrigin={{
							vertical: "top",
							horizontal: "right",
						}}
					>
						<Filterbox
							type={"PROJECT"}
							applyOnMount={false}
							showHeader={false}
							onChange={(filters: Record<string, unknown>) => {
								applyMetaFilters(filters);
							}}
							filteredCatalogIds={renderedAppIds}
							filterBoxRefresh={
								appCatalogPageStatus.current.removalChanges
							}
							onfilterBoxRefreshCompleted={() => {
								appCatalogPageStatus.current.removalChanges = false;
							}}
						/>
					</StyledFilterPopover>
				)}
				<StyledContentContainer>
					<StyledSectionLabel variant="subtitle1">
						Bookmarked
					</StyledSectionLabel>

					{favoritedApps.length > 0 ? (
						<StyledSection>
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
										isFavorite={isFavorited(app.project_id)}
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
						</StyledSection>
					) : (
						<StyledEmptyState>
							<Typography variant="body2">
								No bookmarked apps match your search.
							</Typography>
						</StyledEmptyState>
					)}

					<StyledAppsSectionHeader>
						<StyledToggleTabsGroup
							value={mode}
							onChange={(_e: React.SyntheticEvent, val) => {
								dispatch({
									type: "field",
									field: "databases",
									value: [],
								});
								setMode(val as MODE);
							}}
						>
							<StyledToggleTabsGroupItem
								label="My Apps"
								value={"Mine"}
								data-testid={`appCatalogPage-myApps-btn`}
							/>
							<StyledToggleTabsGroupItem
								label="Discoverable"
								value={"Discoverable"}
								data-testid={`appCatalogPage-discoverable-btn`}
							/>
							<StyledToggleTabsGroupItem
								label="System Apps"
								value={"System"}
								data-testid={`appCatalogPage-systemApps-btn`}
							/>
						</StyledToggleTabsGroup>
					</StyledAppsSectionHeader>

					{mode === "System" && (
						<StyledSection>
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
						</StyledSection>
					)}

					{mode !== "System" && getApps.status !== "SUCCESS" ? (
						<StyledSection>
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
						</StyledSection>
					) : null}

					{/* do not show favorited apps in all apps view */}
					{mode !== "System" && apps.length > 0 ? (
						<StyledSection>
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
						</StyledSection>
					) : null}
				</StyledContentContainer>
				<Help />
			</Stack>
		</>
	);
});
