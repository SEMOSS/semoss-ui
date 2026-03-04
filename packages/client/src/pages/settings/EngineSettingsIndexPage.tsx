import {
	ArrowDownward,
	ArrowUpward,
	FormatListBulletedOutlined,
	SpaceDashboardOutlined,
} from "@mui/icons-material";
import { useEffect, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Backdrop,
	CircularProgress,
	Grid,
	Menu,
	Search,
	Select,
	Stack,
	styled,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
} from "@semoss/ui";
import { setEngineFavorite, setEngineGlobal } from "@/api";
import { EngineLandscapeCard, EngineTileCard } from "@/components/engine";
import { useAPI, usePixel, useRootStore, useSettings } from "@/hooks";
import type { ENGINE_TYPES } from "@/types";

export interface DBMember {
	ID: string;
	NAME: string;
	PERMISSION: string;
	EMAIL: string;
	SELECTED: boolean;
}

export interface Database {
	app_cost: string;
	app_favorite: number;
	app_id: string;
	app_name: string;
	app_type: string;
	database_cost: string;
	database_id: string;
	database_name: string;
	database_type: string;
	low_database_name: string;
	database_global: true;
	database_favorite?: number;
	permission?: number;
	user_permission?: number;
}

const StyledContainer = styled("div")({
	display: "flex",
	width: "auto",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: "24px",
});

const StyledSearchbarContainer = styled("div")({
	display: "flex",
	width: "100%",
	alignItems: "flex-start",
	gap: "24px",
});

const StyledSearchbar = styled(Search)({
	width: "80%",
});

const StyledSort = styled(Select)({
	width: "20%",
});

const initialState = {
	favoritedDbs: [],
	databases: [],
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

/**
 * Show detailed settings for an engine
 */
interface EngineSettingsIndexPageProps {
	/** Type of the page to render */
	type: ENGINE_TYPES;
}

export const EngineSettingsIndexPage = (
	props: EngineSettingsIndexPageProps,
) => {
	const { type } = props;

	const { adminMode } = useSettings();
	const { configStore, monolithStore } = useRootStore();
	const navigate = useNavigate();

	const [state, dispatch] = useReducer(reducer, initialState);
	const { favoritedDbs, databases } = state;

	const [view, setView] = useState("tile");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sort, setSort] = useState("ENGINENAME");
	const [sortOrder, setSortOrder] = useState("ASC");
	const [canCollect, setCanCollect] = useState(true);
	const [offset, setOffset] = useState(0);
	const [isSearching, setIsSearching] = useState(false);

	//** amount of items to be loaded */
	const limit = 8;

	// To focus when getting new results
	const searchbarRef = useRef(null);

	useEffect(() => {
		setIsSearching(true);
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
			setIsSearching(false);
		}, 400);

		return () => {
			clearTimeout(timer);
		};
	}, [search]);

	// get a list of the keys
	const databaseMetaKeys = configStore.store.config.databaseMetaKeys.filter(
		(k) => {
			return (
				k.display_options === "single-checklist" ||
				k.display_options === "multi-checklist" ||
				k.display_options === "single-select" ||
				k.display_options === "multi-select" ||
				k.display_options === "single-typeahead" ||
				k.display_options === "multi-typeahead" ||
				k.display_options === "textarea"
			);
		},
	);

	// get metakeys to the ones we want
	const metaKeys = databaseMetaKeys.map((k) => {
		return k.metakey;
	});

	// Favorites ----------------------------------
	const getFavoritedDatabases = usePixel(`
    MyEngines(metaKeys = ${JSON.stringify(
		metaKeys,
	)}, filterWord=["${debouncedSearch}"], sort=[{"${sort}" : "${sortOrder}"}], onlyFavorites=[true], engineTypes=["${type}"]);
    `);

	useEffect(() => {
		if (getFavoritedDatabases.status !== "SUCCESS") {
			return;
		}

		dispatch({
			type: "field",
			field: "favoritedDbs",
			value: getFavoritedDatabases.data,
		});

		searchbarRef.current?.focus();
	}, [getFavoritedDatabases.status, getFavoritedDatabases.data]);

	// All Engines -------------------------------------
	const getEngines = useAPI([
		"getEngines",
		adminMode,
		debouncedSearch,
		type,
		offset,
		limit,
	]);

	//** reset dataMode if adminMode is toggled */
	useEffect(() => {
		setOffset(0);
		dispatch({
			type: "field",
			field: "databases",
			value: [],
		});
	}, [adminMode, debouncedSearch, sort]);

	//** append data through infinite scroll */
	useEffect(() => {
		if (getEngines.status !== "SUCCESS") {
			return;
		}

		if (getEngines.data.length < limit) {
			setCanCollect(false);
		} else {
			if (!canCollectRef.current) {
				setCanCollect(true);
			}
		}

		const mutateListWithVotes = databases;

		getEngines.data.forEach((db, _i) => {
			mutateListWithVotes.push({
				...db,
				upvotes: db.upvotes ? db.upvotes : 0,
				// hasUpvoted: false,
				views: "N/A",
				trending: "N/A",
			});
		});

		dispatch({
			type: "field",
			field: "databases",
			value: mutateListWithVotes,
		});

		searchbarRef.current?.focus();
	}, [getEngines.status, getEngines.data]);

	/**
	 * @name favoriteDb
	 * @param db
	 */
	const favoriteDb = (db) => {
		const favorite = !isFavorited(db.database_id);
		setEngineFavorite(db.database_id, favorite)
			.then((_response) => {
				if (!favorite) {
					const newFavorites = favoritedDbs;
					for (let i = newFavorites.length - 1; i >= 0; i--) {
						if (newFavorites[i].database_id === db.database_id) {
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
			const _pixelResponse = response.pixelReturn[0].output;

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

	/**
	 * @name setDbGlobal
	 * @param db
	 */
	const setDbGlobal = (db) => {
		setEngineGlobal(adminMode, db.database_id, !db.database_global)
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

	//** infinite sroll variables */
	let scrollEle: HTMLDivElement,
		scrollTimeout: ReturnType<typeof setTimeout>,
		currentScroll: number,
		previousScroll: number;
	const offsetRef = useRef(0);
	offsetRef.current = offset;
	const canCollectRef = useRef(true);
	canCollectRef.current = canCollect;

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
	 * @desc infinite scroll
	 */
	useEffect(() => {
		scrollEle = document.querySelector("#home__content");
		scrollEle.addEventListener("scroll", scrollAll);
		return () => {
			scrollEle.removeEventListener("scroll", scrollAll);
		};
	}, [scrollEle]);

	return (
		<>
			<Backdrop
				open={getEngines.status === "LOADING" || isSearching}
				sx={{
					backgroundColor: "rgba(255, 255, 255, 0.5)",
					zIndex: 1501,
				}}
			>
				<Stack
					direction={"column"}
					alignItems={"center"}
					justifyContent={"center"}
					spacing={1}
				>
					<CircularProgress />
					<Typography variant="body2">
						{isSearching ? "Searching" : "Loading"}
					</Typography>
					<Typography variant="caption">
						{type === "DATABASE"
							? "Databases"
							: type === "MODEL"
								? "Models"
								: type === "VECTOR"
									? "Vectors"
									: "Engines"}
					</Typography>
				</Stack>
			</Backdrop>
			<StyledContainer>
				<StyledSearchbarContainer>
					<StyledSearchbar
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
						}}
						size="small"
						onClear={() => setSearch("")}
						inputRef={searchbarRef}
					/>
					<StyledSort
						size={"small"}
						value={sort}
						onChange={(e) => setSort(e.target.value)}
						label={"Sort By"}
					>
						<Menu.Item value="ENGINENAME">Name</Menu.Item>
						<Menu.Item value="DATECREATED">Date Created</Menu.Item>
						{/* <Menu.Item value="Views">Views</Menu.Item>
                        <Menu.Item value="Trending">Trending</Menu.Item>
                        <Menu.Item value="Upvotes">Upvotes</Menu.Item> */}
					</StyledSort>

					<ToggleButtonGroup
						size={"small"}
						value={sortOrder}
						color="primary"
					>
						<ToggleButton
							onClick={(_e, v) => setSortOrder(v)}
							value={"DESC"}
							aria-label={"Descending Order"}
						>
							<Tooltip title={"Descending Order"}>
								<ArrowDownward />
							</Tooltip>
						</ToggleButton>
						<ToggleButton
							onClick={(_e, v) => setSortOrder(v)}
							value={"ASC"}
							aria-label={"Ascending Order"}
						>
							<Tooltip title={"Ascending Order"}>
								<ArrowUpward />
							</Tooltip>
						</ToggleButton>
					</ToggleButtonGroup>

					<ToggleButtonGroup
						size={"small"}
						value={view}
						color="primary"
					>
						<ToggleButton
							onClick={(_e, v) => setView(v)}
							value={"tile"}
						>
							<Tooltip title={"Tile View"}>
								<SpaceDashboardOutlined />
							</Tooltip>
						</ToggleButton>
						<ToggleButton
							onClick={(_e, v) => setView(v)}
							value={"list"}
						>
							<Tooltip title={"List View"}>
								<FormatListBulletedOutlined />
							</Tooltip>
						</ToggleButton>
					</ToggleButtonGroup>
				</StyledSearchbarContainer>
				<Grid container spacing={3}>
					{databases.length === 0 &&
					getEngines.status === "SUCCESS" &&
					debouncedSearch ? (
						<Grid item xs={12}>
							<Typography
								variant="body1"
								sx={{ textAlign: "center", py: 4 }}
							>
								No{" "}
								{type === "DATABASE"
									? "databases"
									: type === "MODEL"
										? "models"
										: type === "VECTOR"
											? "vectors"
											: "engines"}{" "}
								found matching &quot;{debouncedSearch}&quot;
							</Typography>
						</Grid>
					) : null}
					{databases.length
						? databases.map((db, _i) => {
								return (
									<Grid
										item
										key={`${db.database_name}`}
										sm={view === "list" ? 12 : 12}
										md={view === "list" ? 12 : 6}
										lg={view === "list" ? 12 : 4}
										xl={view === "list" ? 12 : 3}
									>
										{view === "list" ? (
											<EngineLandscapeCard
												name={db.database_name}
												id={db.database_id}
												tag={db.tag}
												owner={db.database_created_by}
												description={db.description}
												votes={db.upvotes}
												views={db.views}
												trending={db.trending}
												isGlobal={db.database_global}
												isUpvoted={db.hasUpvoted}
												isFavorite={isFavorited(
													db.database_id,
												)}
												favorite={(_val) => {
													favoriteDb(db);
												}}
												onClick={(_id) => {
													navigate(
														`${db.database_id}`,
														{
															state: {
																name: db.database_name,
																global: db.database_global,
																permission:
																	db.permission,
															},
														},
													);
												}}
												upvote={(_val) => {
													upvoteDb(db);
												}}
												global={(_val) => {
													setDbGlobal(db);
												}}
											/>
										) : (
											<EngineTileCard
												name={db.database_name}
												id={db.database_id}
												tag={db.tag}
												owner={db.database_created_by}
												description={db.description}
												votes={db.upvotes}
												views={db.views}
												trending={db.trending}
												isGlobal={db.database_global}
												isFavorite={isFavorited(
													db.database_id,
												)}
												isUpvoted={db.hasUpvoted}
												favorite={() => {
													favoriteDb(db);
												}}
												onClick={() => {
													navigate(
														`${db.database_id}`,
														{
															state: {
																name: db.database_name,
																global: db.database_global,
																permission:
																	db.permission,
															},
														},
													);
												}}
												upvote={() => {
													upvoteDb(db);
												}}
												global={() => {
													setDbGlobal(db);
												}}
											/>
										)}
									</Grid>
								);
							})
						: null}
				</Grid>
			</StyledContainer>
		</>
	);
};
