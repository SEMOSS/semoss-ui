import { ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { useEffect, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Backdrop,
	CircularProgress,
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
import { toast } from "@semoss/ui/next";
import { setEngineFavorite, setEngineGlobal } from "@/api";
import { EngineLandscapeCard } from "@/components/engine";
import { DeleteEntityDialog } from "@/components/shared/delete-entity-dialog";
import { usePixel, useRootStore, useSettings } from "@/hooks";
import type { ENGINE_TYPES } from "@/types";

export interface DBMember {
	ID: string;
	NAME: string;
	PERMISSION: string;
	EMAIL: string;
	SELECTED: boolean;
}

export interface Database {
	engine_id: string;
	engine_display_name?: string;
	engine_name: string;
	engine_type: string;
	engine_subtype?: string;
	low_engine_name: string;
	engine_global: true;
	engine_favorite?: number;
	engine_user_permission?: number;
	engine_group_permission?: number;
	engine_permission?: string;
	permission?: number | string;
	tag?: string[] | string;
	engine_created_by?: string;
	description?: string;
	upvotes?: number;
	views?: string;
	trending?: string;
	hasUpvoted?: boolean;
	engine_date_created?: string;
}

const StyledContainer = styled("div")({
	display: "flex",
	width: "100%",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: "24px",
});

const StyledSearchbarContainer = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	alignItems: "center",
	gap: theme.spacing(2),
	[theme.breakpoints.down("md")]: {
		flexDirection: "column",
		alignItems: "stretch",
	},
}));

const StyledSearchbar = styled(Search)(({ theme }) => ({
	flex: 1,
	minWidth: 0,
	width: "auto",
	[theme.breakpoints.down("md")]: {
		width: "100%",
	},
}));

const StyledSortControls = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(1.5),
	marginLeft: "auto",
	[theme.breakpoints.down("md")]: {
		width: "100%",
		marginLeft: 0,
	},
}));

const StyledSort = styled(Select)(({ theme }) => ({
	width: "220px",
	[theme.breakpoints.down("md")]: {
		flex: 1,
		width: "auto",
	},
}));

const StyledSortOrder = styled(ToggleButtonGroup)(({ theme }) => ({
	flexShrink: 0,
	[theme.breakpoints.down("md")]: {
		marginLeft: "auto",
	},
}));

const initialState = {
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
		case "append": {
			const nextEngines = action.value;
			const mergedDatabases = [...state.databases];
			nextEngines.forEach((db) => {
				mergedDatabases.push({
					...db,
					upvotes: db.upvotes || 0,
					views: db.views || "N/A",
					trending: db.trending || "N/A",
				});
			});

			return {
				...state,
				databases: mergedDatabases,
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
	const { databases } = state;

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sort, setSort] = useState("ENGINENAME");
	const [sortOrder, setSortOrder] = useState("ASC");
	const [canCollect, setCanCollect] = useState(true);
	const [offset, setOffset] = useState(0);
	const [isSearching, setIsSearching] = useState(false);
	const [isDeletingEngine, setIsDeletingEngine] = useState(false);
	const [engineToDelete, setEngineToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	//** amount of items to be loaded */
	const limit = 50;

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

	const enginePixelPrefix = adminMode ? "AdminMyEngines" : "MyEngines";

	// All Engines -------------------------------------
	const getEngines = usePixel<Database[]>(
		`
    ${enginePixelPrefix}(metaKeys = ${JSON.stringify(
		metaKeys,
	)}, filterWord=["${debouncedSearch}"], sort=[{"${sort}" : "${sortOrder}"}], engineTypes=["${type}"], limit=[${limit}], offset=[${offset}]);
    `,
		{
			data: [],
		},
	);

	const resetKey = `${adminMode}-${debouncedSearch}-${sort}-${sortOrder}-${type}`;

	//** reset dataMode if adminMode is toggled */
	useEffect(() => {
		void resetKey;
		setOffset(0);
		setCanCollect(true);
		dispatch({
			type: "field",
			field: "databases",
			value: [],
		});
	}, [resetKey]);

	//** append data through infinite scroll */
	useEffect(() => {
		if (getEngines.status !== "SUCCESS") {
			return;
		}

		const loadedEngines = getEngines.data || [];

		if (loadedEngines.length < limit) {
			setCanCollect(false);
		} else {
			if (!canCollectRef.current) {
				setCanCollect(true);
			}
		}

		dispatch({
			type: "append",
			value: loadedEngines,
		});

		searchbarRef.current?.focus();
	}, [getEngines.status, getEngines.data]);

	/**
	 * @name favoriteDb
	 * @param db
	 */
	const favoriteDb = (db) => {
		const favorite = !isFavorited(db);
		setEngineFavorite(db.engine_id, favorite)
			.then((_response) => {
				const updatedDatabases = databases.map((database) => {
					if (database.engine_id !== db.engine_id) {
						return database;
					}

					return {
						...database,
						engine_favorite: favorite ? 1 : 0,
					};
				});

				dispatch({
					type: "field",
					field: "databases",
					value: updatedDatabases,
				});
			})
			.catch((err) => {
				// throw error if promise doesn't fulfill
				throw Error(err);
			});
	};

	/**
	 * @name isFavorited
	 * @param db
	 */
	const isFavorited = (db: Database) => {
		return Boolean(db.engine_favorite);
	};

	const isOwnerPermission = (permission?: number | string | null) => {
		return permission === 1 || permission === "OWNER";
	};

	const escapePixelString = (value: string) => {
		return value.replaceAll("'", "\\'");
	};

	const deleteEngine = async () => {
		if (!engineToDelete) {
			return;
		}

		try {
			setIsDeletingEngine(true);

			const response = await monolithStore.runQuery(
				`DeleteEngine(engine=['${escapePixelString(engineToDelete.id)}']);`,
			);

			const operationType =
				response.pixelReturn?.[0]?.operationType || "";
			const output = response.pixelReturn?.[0]?.output;

			if (operationType.indexOf("ERROR") === -1) {
				dispatch({
					type: "field",
					field: "databases",
					value: databases.filter(
						(database) => database.engine_id !== engineToDelete.id,
					),
				});
				toast.success(`Successfully deleted ${engineToDelete.name}`);
			} else {
				toast.error(String(output || "Failed to delete engine"));
			}
		} catch (error) {
			toast.error(String(error));
		} finally {
			setIsDeletingEngine(false);
			setEngineToDelete(null);
		}
	};

	/**
	 * @name upvoteDb
	 * @param db
	 */
	const upvoteDb = (db) => {
		let pixelString = "";

		if (!db.hasUpvoted) {
			pixelString += `VoteEngine(engine="${db.engine_id}", vote=1)`;
		} else {
			pixelString += `UnvoteEngine(engine="${db.engine_id}")`;
		}

		monolithStore.runQuery(pixelString).then((response) => {
			const type = response.pixelReturn[0].operationType;
			const _pixelResponse = response.pixelReturn[0].output;

			if (type.indexOf("ERROR") === -1) {
				const newDatabases = [];

				databases.forEach((database) => {
					if (database.engine_id === db.engine_id) {
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
					field: "databases",
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
		setEngineGlobal(adminMode, db.engine_id, !db.engine_global)
			.then((response) => {
				if (response.data.success) {
					const newDatabases = [];
					databases.forEach((database) => {
						if (database.engine_id === db.engine_id) {
							const newCopy = database;
							newCopy.engine_global = !db.engine_global;

							newDatabases.push(newCopy);
						} else {
							newDatabases.push(database);
						}
					});

					dispatch({
						type: "field",
						field: "databases",
						value: newDatabases,
					});
				}
			})
			.catch((error) => {
				console.error(error);
			});
	};

	const offsetRef = useRef(0);
	offsetRef.current = offset;
	const canCollectRef = useRef(true);
	canCollectRef.current = canCollect;

	/**
	 * @desc infinite scroll
	 */
	useEffect(() => {
		const scrollElement = document.querySelector(
			"#home__content",
		) as HTMLDivElement | null;

		if (!scrollElement) {
			return;
		}

		let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
		let previousScroll = 0;

		const onScroll = () => {
			const currentScroll =
				scrollElement.scrollTop + scrollElement.offsetHeight;

			if (
				currentScroll > scrollElement.scrollHeight * 0.75 &&
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

		scrollElement.addEventListener("scroll", onScroll);
		return () => {
			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}
			scrollElement.removeEventListener("scroll", onScroll);
		};
	}, []);

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
					<StyledSortControls>
						<StyledSort
							size={"small"}
							value={sort}
							onChange={(e) => setSort(e.target.value)}
							label={"Sort By"}
						>
							<Menu.Item value="ENGINENAME">Name</Menu.Item>
							<Menu.Item value="DATECREATED">
								Date Created
							</Menu.Item>
							{/* <Menu.Item value="Views">Views</Menu.Item>
                        <Menu.Item value="Trending">Trending</Menu.Item>
                        <Menu.Item value="Upvotes">Upvotes</Menu.Item> */}
						</StyledSort>

						<StyledSortOrder
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
						</StyledSortOrder>
					</StyledSortControls>
				</StyledSearchbarContainer>
				<Stack spacing={2} sx={{ width: "100%" }}>
					{databases.length === 0 &&
					getEngines.status === "SUCCESS" &&
					debouncedSearch ? (
						<div>
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
						</div>
					) : null}
					{databases.length
						? databases.map((db, _i) => {
								const engineName =
									db.engine_display_name || db.engine_name;
								const rowType = db.engine_type || type;
								const rowSubtype = db.engine_subtype;

								return (
									<div key={`${db.engine_id}`}>
										<EngineLandscapeCard
											name={engineName}
											id={db.engine_id}
											type={rowType}
											sub_type={rowSubtype}
											desktopInlineMeta={true}
											tag={db.tag}
											date={db.engine_date_created}
											owner={db.engine_created_by}
											description={db.description}
											votes={db.upvotes}
											views={db.views}
											trending={db.trending}
											isGlobal={db.engine_global}
											isUpvoted={db.hasUpvoted}
											isFavorite={isFavorited(db)}
											hideFavorite={adminMode}
											onDelete={
												adminMode ||
												isOwnerPermission(
													db.engine_user_permission ||
														db.permission ||
														db.engine_permission,
												)
													? () => {
															setEngineToDelete({
																id: db.engine_id,
																name: engineName,
															});
														}
													: undefined
											}
											favorite={(_val) => {
												favoriteDb(db);
											}}
											onClick={(_id) => {
												navigate(`${db.engine_id}`, {
													state: {
														name: engineName,
														global: db.engine_global,
														permission:
															db.engine_user_permission,
													},
												});
											}}
											upvote={(_val) => {
												upvoteDb(db);
											}}
											global={(_val) => {
												setDbGlobal(db);
											}}
										/>
									</div>
								);
							})
						: null}
				</Stack>
			</StyledContainer>
			<DeleteEntityDialog
				open={Boolean(engineToDelete)}
				onOpenChange={(open) => {
					if (!open) {
						setEngineToDelete(null);
					}
				}}
				entityType="Engine"
				entityName={engineToDelete?.name}
				entityId={engineToDelete?.id}
				onConfirm={deleteEngine}
				isLoading={isDeletingEngine}
			/>
		</>
	);
};
