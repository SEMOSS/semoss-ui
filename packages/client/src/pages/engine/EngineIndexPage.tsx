import { observer } from "mobx-react-lite";
import { useEffect, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatPostcssSourceMap } from "vite";
import { debounced } from "@semoss/sdk/react";
import {
	Button,
	Grid,
	Stack,
	styled,
	TextField,
	ToggleTabsGroup,
	Typography,
} from "@semoss/ui";
import { EngineLandscapeCard } from "@/components/engine";
import { Help } from "@/components/help";
import { Filterbox } from "@/components/ui";
import { usePixel, useRootStore } from "@/hooks";
import { formatToDataTestId, removeUnderscores } from "@/utility";
import type { ENGINE_ROUTES } from "./engine.constants";

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

const initialState = {
	favoritedDbs: [],
	databases: [],
	filterSearch: "",
};

type MODE = "Mine" | "Discoverable";

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
		// get the matching route
		const routeTypeRef = useRef("");

		const { configStore, monolithStore } = useRootStore();
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

		const [state, dispatch] = useReducer(reducer, initialState);
		const { favoritedDbs, databases } = state;

		const [offset, setOffset] = useState(0);
		const [canCollect, setCanCollect] = useState(true);
		const canCollectRef = useRef(true);
		canCollectRef.current = canCollect;
		const limit = 10;

		const offsetRef = useRef(0);
		offsetRef.current = offset;
		let scrollEle: HTMLElement | null,
			scrollTimeout: ReturnType<typeof setTimeout> | undefined,
			currentScroll: number | undefined,
			previousScroll: number | undefined;

		const [inputValue, setInputValue] = useState("");
		const [search, setSearch] = useState("");

		// which view we are on
		const [mode, setMode] = useState<MODE>("Mine");
		const [metaFilters, setMetaFilters] = useState<Record<string, unknown>>(
			{},
		);

		const dbPixelPrefix: string =
			mode === "Mine" ? `MyEngines` : "MyDiscoverableEngines";

		const isDiscoverable = mode !== "Mine";

		const metaKeysDescription = [...metaKeys, "description"];

		const getFavoritedDatabases = usePixel(
			!isDiscoverable &&
				`
        ${dbPixelPrefix}(metaKeys = ${JSON.stringify(
			metaKeysDescription,
		)}, metaFilters = [ ${JSON.stringify(
			metaFilters,
		)} ] , filterWord=["${search}"], onlyFavorites=[true], ${
			route ? `engineTypes=['${route.type}']` : ""
		});
    `,
		);

		const getDatabases = usePixel<
			{
				app_cost: string;
				app_id: string;
				app_name: string;
				app_type: string;
				database_cost: string;
				database_global: boolean;
				database_id: string;
				database_name: string;
				database_type: string;
				database_created_by: string;
				database_date_created: string;
				description: string;
				low_database_name: string;
				permission: number;
				tag: string;
				user_permission: number;
				upvotes: number;
			}[]
		>(
			`${dbPixelPrefix}( metaKeys = ${JSON.stringify(
				metaKeysDescription,
			)} , metaFilters = [ ${JSON.stringify(
				metaFilters,
			)} ] , filterWord=["${search}"], userT = [true], ${
				route ? `engineTypes=['${route.type}'], ` : ""
			} offset=[${offset}], limit=[${limit}]) ;`,
		);

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

		const debouncedSet = debounced((newInputValue) => {
			setSearch(newInputValue as string);
		}, 300);

		const handleInputChange = (newInputValue) => {
			setInputValue(newInputValue);
			debouncedSet(newInputValue);
		};

		/**
		 * @name setGlobal
		 * @param db
		 */
		const setGlobal = (db) => {
			monolithStore
				.setEngineGlobal(
					configStore.store.user.admin,
					db.database_id,
					!db.database_global,
				)
				.then((response) => {
					if (response.data.success) {
						const newDatabases = [];
						databases.forEach((database) => {
							if (database.database_id === db.database_id) {
								const newCopy = database;
								newCopy.database_global = !db.database_global;

								newDatabases.push(newCopy);
							} else {
								newDatabases.push(database);
							}
						});

						dispatch({
							type: "field",
							field: "database",
							value: newDatabases,
						});
					}
				})
				.catch((error) => {
					console.error(error);
				});
		};

		/**
		 * @name favoriteDb
		 * @param db
		 */
		const favoriteDb = (db) => {
			const favorite = !isFavorited(db.database_id);
			monolithStore
				.setEngineFavorite(db.database_id, favorite)
				.then(() => {
					if (!favorite) {
						const newFavorites = favoritedDbs;
						for (let i = newFavorites.length - 1; i >= 0; i--) {
							if (
								newFavorites[i].database_id === db.database_id
							) {
								newFavorites.splice(i, 1);
							}
						}

						dispatch({
							type: "field",
							field: "favoritedDbs",
							value: newFavorites,
						});
					} else {
						dispatch({
							type: "field",
							field: "favoritedDbs",
							value: [...favoritedDbs, db],
						});
					}
				})
				.catch((err) => {
					// throw error if promise doesn't fulfill
					throw Error(err);
				});
		};

		/**
		 * @name isFavorited
		 * @param id
		 * @desc determines if card is favorited
		 */
		const isFavorited = (id) => {
			const favorites = favoritedDbs;

			if (!favorites) return false;
			return favorites.some((el) => el.database_id === id);
		};

		/**
		 * @name upvoteDb
		 * @param db
		 */
		const upvoteDb = (db) => {
			let pixelString = "";

			if (!db.hasUpvoted) {
				pixelString += `VoteEngine(engine="${db.database_id}", vote=1)`;
			} else {
				pixelString += `UnvoteEngine(engine="${db.database_id}")`;
			}

			monolithStore.runQuery(pixelString).then((response) => {
				const type = response.pixelReturn[0].operationType;

				if (type.indexOf("ERROR") === -1) {
					const newDatabases = [];

					databases.forEach((database) => {
						if (database.database_id === db.database_id) {
							const newCopy = database;
							newCopy.upvotes = !db.hasUpvoted
								? newCopy.upvotes + 1
								: newCopy.upvotes - 1;
							newCopy.hasUpvoted = !db.hasUpvoted;

							newDatabases.push(newCopy);
						} else {
							newDatabases.push(database);
						}
					});

					dispatch({
						type: "field",
						field: "database",
						value: newDatabases,
					});
				} else {
					console.error("Error voting for DB");
				}
			});
		};

		const scrollAll = () => {
			currentScroll = scrollEle.scrollTop + scrollEle.offsetHeight;
			if (
				currentScroll > scrollEle.scrollHeight * 0.75 &&
				currentScroll > previousScroll
			) {
				if (scrollTimeout) {
					clearTimeout(scrollTimeout);
				}

				scrollTimeout = setTimeout(() => {
					if (!canCollectRef.current) {
						return;
					}

					setOffset(offsetRef.current + limit);
				}, 500);
			}

			previousScroll = currentScroll;
		};

		/**
		 * @desc anytime we change catalogType clean up engines
		 */
		useEffect(() => {
			// Prevent cleanup on first render.
			if (routeTypeRef.current === "") {
				routeTypeRef.current = route.type;
				return;
			}

			dispatch({
				type: "field",
				field: "databases",
				value: [],
			});
			setCanCollect(true);
			setOffset(0);
			setMetaFilters({});
			routeTypeRef.current = route.type;
		}, [route.type]);

		/**
		 * @desc Set Databases
		 */
		useEffect(() => {
			if (getDatabases.status !== "SUCCESS") {
				return;
			}

			if (getDatabases.data.length < limit) {
				setCanCollect(false);
			} else {
				if (!canCollectRef.current) {
					setCanCollect(true);
				}
			}

			const mutateListWithVotes = databases;

			getDatabases.data.forEach((db) => {
				mutateListWithVotes.push({
					...db,
					upvotes: db.upvotes ? db.upvotes : 0,
					views: "N/A",
					trending: "N/A",
				});
			});

			dispatch({
				type: "field",
				field: "databases",
				value: mutateListWithVotes,
			});
		}, [getDatabases.status, getDatabases.data]);

		/**
		 * @desc Sets Favorited Engines
		 */
		useEffect(() => {
			if (getFavoritedDatabases.status !== "SUCCESS") {
				return;
			}

			dispatch({
				type: "field",
				field: "favoritedDbs",
				value: getFavoritedDatabases.data,
			});
		}, [getFavoritedDatabases.status, getFavoritedDatabases.data]);

		/**
		 * @desc infinite scroll
		 */
		useEffect(() => {
			scrollEle = document.querySelector("#home__content");

			scrollEle.addEventListener("scroll", scrollAll);
			return () => {
				scrollEle.removeEventListener("scroll", scrollAll);
			};
		}, [scrollEle]);

		/**
		 * Reset tiles anytime search changes
		 */
		useEffect(() => {
			dispatch({
				type: "field",
				field: "databases",
				value: [],
			});
			setOffset(0);
		}, [search]);

		// finish loading the page
		if (
			getDatabases.status === "ERROR" ||
			getCatalogFilters.status === "ERROR"
		) {
			return <Typography variant="body1">ERROR</Typography>;
		}

		// to limit the catalogs that are sent to filterbox for performance
		let renderedEngineIds = [];
		if (inputValue) {
			renderedEngineIds.push(
				...databases.map((engine) => engine.database_id),
			);
			renderedEngineIds.push(
				...favoritedDbs.map((engine) => engine.database_id),
			);
			if (renderedEngineIds.length === 0)
				renderedEngineIds = ["dummy-id"]; //dummy id to avoid empty array in query
		}

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
					value={inputValue}
					data-testid={`engineIndexPage-searchBar-${route.name}`}
					onChange={(e) => handleInputChange(e.target.value)}
				/>
				<StyledContainer>
					<Filterbox
						type={route.type}
						onChange={(filters: Record<string, unknown>) => {
							dispatch({
								type: "field",
								field: "databases",
								value: [],
							});
							setMetaFilters(filters);
							setOffset(0);
						}}
						filteredCatalogIds={renderedEngineIds}
					/>
					<StyledContent>
						<Stack
							direction="row"
							alignItems={"center"}
							justifyContent={"space-between"}
						>
							<StyledToggleTabsGroup
								value={mode}
								// biome-ignore lint/correctness/noUnusedFunctionParameters: Event handler needs both parameters even if we don't use the event
								onChange={(e: React.SyntheticEvent, val) => {
									dispatch({
										type: "field",
										field: "databases",
										value: [],
									});
									setMode(val as MODE);
									setOffset(0);
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

						{"bi".includes(search.toLowerCase()) &&
							Object.entries(metaFilters).length === 0 &&
							"terminal".includes(search.toLowerCase()) &&
							!isDiscoverable &&
							favoritedDbs.length > 0 && (
								<StyledSectionLabel variant="subtitle1">
									Bookmarked
								</StyledSectionLabel>
							)}

						{!isDiscoverable &&
						favoritedDbs.length &&
						Object.entries(metaFilters).length === 0 ? (
							<Grid container spacing={3}>
								{favoritedDbs.map((db) => {
									return (
										<Grid item key={db.database_id} sm={12}>
											<EngineLandscapeCard
												name={removeUnderscores(
													db.database_name,
												)}
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

						{"bi".includes(search.toLowerCase()) &&
							Object.entries(metaFilters).length === 0 &&
							"terminal".includes(search.toLowerCase()) &&
							databases.length > 0 && (
								<StyledSectionLabel variant="subtitle1">
									All {route.name}s
								</StyledSectionLabel>
							)}

						{databases.length ? (
							<Grid container spacing={3}>
								{databases.map((db) => {
									return (
										<Grid item key={db.database_id} sm={12}>
											<EngineLandscapeCard
												name={removeUnderscores(
													db.database_name,
												)}
												type={db.database_type}
												id={db.database_id}
												tag={db.tag}
												date={db.database_date_created}
												owner={db.database_created_by}
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
					</StyledContent>
				</StyledContainer>
				<Help />
			</Stack>
		);
	},
);
