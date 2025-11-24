import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { runPixel, useIteratorPixel, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Grid,
	Stack,
	styled,
	TextField,
	ToggleTabsGroup,
	Typography,
} from "@semoss/ui";
import {
	Spinner,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { setEngineFavorite, setEngineGlobal } from "@/api";
import { EngineLandscapeCard } from "@/components/engine";
import { Help } from "@/components/help";
import { Filterbox } from "@/components/ui";
import { useRootStore } from "@/hooks";
import { formatToDataTestId } from "@/utility";
import type { ENGINE_ROUTES } from "./engine.constants";

// TODO: Use type from @semoss/shared
interface Engine {
	app_id: string;
	app_name: string;
	app_type: "MODEL" | "STORAGE" | "DATABASE" | "FUNCTION" | "VECTOR";
	description?: string;

	app_cost: string;
	app_favorite: number;
	database_cost: string;
	database_id: string;
	database_name: string;
	database_type: string;
	low_database_name: string;
	database_global: true;
	database_favorite?: number;
	permission?: number;
	user_permission?: number;
	database_date_created: string;
	app_subtype: string;
	domain: string;
	database_discoverable: boolean;
	tag: string[];
	database_created_by: string;
	database_subtype: string;
	database_created_by_type: string;
	upvotes: string;
	views: string;
	trending: string;
	hasUpvoted: boolean;
}

const StyledContainer = styled("div")(({ theme }) => ({
	display: "flex",
	height: "100%",
	gap: theme.spacing(3),
	paddingTop: theme.spacing(1),
	paddingBottom: theme.spacing(1),
}));

const StyledContent = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	flex: "1",
	width: "100%",
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

type MODE = "Mine" | "Discoverable";

interface EngineIndexPageProps {
	/** Route to render */
	route: (typeof ENGINE_ROUTES)[number];
}

/**
 * Catalog landing Page
 * Landing page to view the available engines
 */
export const EngineIndexPage: React.FC<EngineIndexPageProps> = observer(
	({ route }): JSX.Element => {
		const { configStore } = useRootStore();
		const navigate = useNavigate();

		// get a list of the keys
		const databaseMetaKeys =
			configStore.store.config.databaseMetaKeys.filter((k) => {
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
		const metaKeys = databaseMetaKeys.map((k) => {
			return k.metakey;
		});

		const [search, setSearch] = useState("");
		const debouncedSearch = useDebouncedValue(search);

		// which view we are on
		const [mode, setMode] = useState<MODE>("Mine");
		const [metaFilters, setMetaFilters] = useState<Record<string, unknown>>(
			{},
		);

		const enginePrefix: string =
			mode === "Mine" ? `MyEngines` : "MyDiscoverableEngines";

		const isDiscoverable = mode !== "Mine";

		const metaKeysDescription = [...metaKeys, "description"];

		const getFavoritedEngines = usePixel<Engine[]>(
			!isDiscoverable
				? `MyEngines(metaKeys = ${JSON.stringify(
						metaKeysDescription,
					)}, metaFilters = [ ${JSON.stringify(
						metaFilters,
					)} ] , filterWord=["${search}"], onlyFavorites=[true], ${
						route ? `engineTypes=['${route.type}']` : ""
					});`
				: "",
			{
				data: [],
			},
		);

		/**
		 * Get all of the engines with lazy loading
		 */
		const getEngines = useIteratorPixel<Engine[], Engine>(
			(limit, offset) =>
				`${enginePrefix}(${debouncedSearch ? `filterWord=["<encode>${debouncedSearch}</encode>"], ` : ""} ${route ? `engineTypes=['${route.type}'], ` : ""} ${metaFilters ? `metaFilters=[${JSON.stringify(metaFilters)}],` : ""} userT = [true], limit=[${limit}], offset=[${offset}]);`,
			(response) => {
				// if its less than the limit, we know its the end
				if (response.length < 15) {
					return -1;
				}

				return Infinity;
			},
			(response) => {
				return response;
			},
			{
				limit: 15,
			},
			[
				route.type,
				debouncedSearch,
				JSON.stringify(route.type),
				JSON.stringify(metaFilters),
			],
		);

		/**
		 * Setup infinite scroll for the command list
		 */
		const { setScroll, resetScroll } = useInfiniteScroll({
			disabled:
				getEngines.isLoading || !getEngines.hasMore || !route.type,
			onNext: () => {
				getEngines.next();
			},
		});

		const getCatalogFilters = usePixel<
			{
				METAKEY: string;
				METAVALUE: string;
				count: number;
			}[]
		>(
			metaKeys.length > 0
				? `GetEngineMetaValues( ${
						route ? `engineTypes=['${route.type}'], ` : ""
					} metaKeys = ${JSON.stringify(metaKeys)} ) ;`
				: "",
		);

		/**
		 * @name setGlobal
		 * @param engine
		 */
		const setGlobal = async (engine: Engine) => {
			try {
				await setEngineGlobal(
					false,
					engine.database_id,
					!engine.database_global,
				);

				// reset it
				getEngines.reset();
			} catch (error) {
				toast.error("Error updating global status", error);
			}
		};

		/**
		 * @name favoriteDb
		 * @param db
		 */
		const favoriteDb = async (engine: Engine) => {
			// check if is favorited
			const updatedFavorite = !isFavorited(engine.database_id);

			try {
				await setEngineFavorite(engine.database_id, updatedFavorite);

				// reset and refresh it
				resetScroll();
				getFavoritedEngines.refresh();
				getEngines.reset();
			} catch (error) {
				toast.error("Error updating favorite status", error);
			}
		};

		/**
		 * @name isFavorited
		 * @param id
		 * @desc determines if card is favorited
		 */
		const isFavorited = (engineId: string) => {
			return getFavoritedEngines.data.some(
				(el) => el.database_id === engineId,
			);
		};

		/**
		 * @name upvoteDb
		 * @param engine
		 */
		const upvoteDb = async (engine: Engine) => {
			try {
				let pixel = "";

				if (!engine.hasUpvoted) {
					pixel += `VoteEngine(engine="${engine.database_id}", vote=1)`;
				} else {
					pixel += `UnvoteEngine(engine="${engine.database_id}")`;
				}

				await runPixel(pixel);

				// reset and refresh it
				resetScroll();
				getEngines.reset();
			} catch (error) {
				toast.error("Error updating upvoting", error);
			}
		};

		/**
		 * @desc infinite scroll
		 */
		useEffect(() => {
			const scrollEle = document.querySelector(
				"#home__content",
			) as HTMLDivElement;

			setScroll(scrollEle);

			return () => {
				setScroll(null);
			};
		}, [setScroll]);

		// if there is an error show this
		if (getEngines.isError || getCatalogFilters.status === "ERROR") {
			return <Typography variant="body1">ERROR</Typography>;
		}

		// filter out the bookmarked models for All Models section, it is used not to show StyledSectionLabel for All Models section when there is no (nonBookmarked) model to show
		const nonBookmarked = getEngines.data.filter(
			(db) =>
				!getFavoritedEngines.data.some(
					(fav) => fav.database_id === db.database_id,
				),
		);

		return (
			<Stack direction="column" gap={2}>
				<Stack>
					<Stack
						direction="row"
						alignItems={"center"}
						justifyContent={"space-between"}
						spacing={4}
					>
						<Typography variant={"h4"}>
							{route ? route.name : ""} Catalog
						</Typography>

						{configStore.isEngineOperationAvailable(
							route.type,
							"add",
						) && (
							<Stack
								direction="row"
								alignItems={"center"}
								spacing={3}
							>
								<Button
									size={"large"}
									variant={"contained"}
									onClick={() => {
										navigate(
											`/engine/${route.type.toLowerCase()}/new`,
										);
									}}
									aria-label={`Navigate to import ${
										route ? route.name : "Engine"
									}`}
									data-testid={formatToDataTestId(
										`engineIndex-add-${route ? route.name : "Engine"}-btn`,
									)}
								>
									Add {route ? route.name : "Engine"}
								</Button>
							</Stack>
						)}
					</Stack>
					<Stack
						direction="row"
						alignItems={"center"}
						justifyContent={"space-between"}
						spacing={4}
						sx={{ paddingTop: "10px" }}
					>
						<Typography variant={"subtitle1"}>
							{route ? route.description : ""}
						</Typography>
					</Stack>
				</Stack>
				<TextField
					size="small"
					label="Search"
					value={search}
					data-testid={`engineIndexPage-searchBar-${route.name}`}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<StyledContainer>
					<Filterbox
						type={route.type}
						onChange={(filters: Record<string, unknown>) => {
							setMetaFilters(filters);
						}}
						filteredCatalogIds={[]}
					/>
					<StyledContent>
						<Stack
							direction="row"
							alignItems={"center"}
							justifyContent={"space-between"}
						>
							<StyledToggleTabsGroup
								value={mode}
								onChange={(_e, val) => {
									setMode(val as MODE);
								}}
							>
								<StyledToggleTabsGroupItem
									value="Mine"
									data-testid={formatToDataTestId(
										`engineIndexPage-${route ? `${route.name}s` : "Engines"}-my-switch`,
									)}
									label={`My ${
										route ? `${route.name}s` : "Engines"
									}`}
								/>
								<StyledToggleTabsGroupItem
									value="Discoverable"
									data-testid={formatToDataTestId(
										`engineIndexPage-${route ? `${route.name}s` : "Engines"}-discoverable-switch`,
									)}
									label={`Discoverable ${
										route ? `${route.name}s` : "Engines"
									}`}
								/>
							</StyledToggleTabsGroup>
						</Stack>

						{Object.entries(metaFilters).length === 0 &&
							!isDiscoverable &&
							getFavoritedEngines.data.length > 0 && (
								<StyledSectionLabel variant="subtitle1">
									Bookmarked
								</StyledSectionLabel>
							)}

						{!isDiscoverable &&
						getFavoritedEngines.data.length &&
						Object.entries(metaFilters).length === 0 ? (
							<Grid container spacing={3}>
								{getFavoritedEngines.data.map((db) => {
									return (
										<Grid item key={db.database_id} sm={12}>
											<EngineLandscapeCard
												name={db.database_name}
												type={db.database_type}
												id={db.database_id}
												tag={db.tag}
												owner={db.database_created_by}
												date={db.database_date_created}
												description={db.description}
												votes={db.upvotes}
												views={db.views}
												sub_type={db.database_subtype}
												trending={db.trending}
												isGlobal={db.database_global}
												isUpvoted={db.hasUpvoted}
												isFavorite={
													isDiscoverable
														? false
														: isFavorited(
																db.database_id,
															)
												}
												isDiscoverable={isDiscoverable}
												onClick={() => {
													navigate(
														`${db.database_id}`,
													);
												}}
												favorite={() => {
													favoriteDb(db);
												}}
												upvote={() => {
													upvoteDb(db);
												}}
												global={
													db.user_permission === 1
														? () => {
																setGlobal(db);
															}
														: null
												}
											/>
										</Grid>
									);
								})}
							</Grid>
						) : null}

						{Object.entries(metaFilters).length === 0 &&
							getEngines.data.length > 0 &&
							nonBookmarked.length > 0 && (
								<StyledSectionLabel variant="subtitle1">
									All {route.name}s
								</StyledSectionLabel>
							)}

						{getEngines.data.length ? (
							<Grid container spacing={3}>
								{getEngines.data
									.filter(
										(db) =>
											!getFavoritedEngines.data.some(
												(fav) =>
													fav.database_id ===
													db.database_id,
											),
									)
									.map((db) => {
										return (
											<Grid
												item
												key={db.database_id}
												sm={12}
											>
												<EngineLandscapeCard
													name={db.database_name}
													type={db.database_type}
													id={db.database_id}
													tag={db.tag}
													date={
														db.database_date_created
													}
													owner={
														db.database_created_by
													}
													description={db.description}
													votes={db.upvotes}
													views={db.views}
													sub_type={
														db.database_subtype
													}
													trending={db.trending}
													isGlobal={
														db.database_global
													}
													isUpvoted={db.hasUpvoted}
													isFavorite={
														isDiscoverable
															? false
															: isFavorited(
																	db.database_id,
																)
													}
													isDiscoverable={
														isDiscoverable
													}
													onClick={() => {
														navigate(
															`${db.database_id}`,
														);
													}}
													favorite={() => {
														favoriteDb(db);
													}}
													upvote={() => {
														upvoteDb(db);
													}}
													global={
														db.user_permission === 1
															? () => {
																	setGlobal(
																		db,
																	);
																}
															: null
													}
												/>
											</Grid>
										);
									})}

								{getEngines.isLoading &&
									getEngines.data.length > 0 && (
										<Grid item sm={12}>
											<div className="flex items-center justify-center py-2">
												<Spinner className="size-4" />
											</div>
										</Grid>
									)}
							</Grid>
						) : null}
					</StyledContent>
				</StyledContainer>
				<Help />
			</Stack>
		);
	},
);
