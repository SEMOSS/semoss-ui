import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { setEngineFavorite, setEngineGlobal } from "@/api";
import { EngineLandscapeCard } from "@/components/engine";
import { DeleteEntityDialog } from "@/components/shared/delete-entity-dialog";
import { usePixel, useRootStore, useSettings } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
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

const ENGINE_SORT_FIELDS = ["ENGINENAME", "DATECREATED"] as const;
type EngineSortField = (typeof ENGINE_SORT_FIELDS)[number];

const isValidEngineSortField = (
	value: string | null,
): value is EngineSortField => {
	return ENGINE_SORT_FIELDS.includes(value as EngineSortField);
};

const parseSortOrder = (value: string | null): "ASC" | "DESC" => {
	return value === "DESC" ? "DESC" : "ASC";
};

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
	const { search: locationSearch } = useLocation();

	const urlSearchParams = new URLSearchParams(locationSearch);
	const urlSort = urlSearchParams.get("sort");
	const initialSearch = urlSearchParams.get("q") || "";
	const initialSort = isValidEngineSortField(urlSort)
		? urlSort
		: "ENGINENAME";
	const initialSortOrder = parseSortOrder(urlSearchParams.get("order"));

	const [state, dispatch] = useReducer(reducer, initialState);
	const { databases } = state;

	const [search, setSearch] = useState(initialSearch);
	const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
	const [sort, setSort] = useState<EngineSortField>(initialSort);
	const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">(
		initialSortOrder,
	);
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
	const searchbarRef = useRef<HTMLInputElement | null>(null);

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

	useEffect(() => {
		const params = new URLSearchParams();

		if (search) {
			params.set("q", search);
		}

		if (sort !== "ENGINENAME") {
			params.set("sort", sort);
		}

		if (sortOrder !== "ASC") {
			params.set("order", sortOrder);
		}

		const nextSearch = params.toString();
		const currentSearch = locationSearch.startsWith("?")
			? locationSearch.slice(1)
			: locationSearch;

		if (nextSearch === currentSearch) {
			return;
		}

		navigate(
			{
				search: nextSearch ? `?${nextSearch}` : "",
			},
			{ replace: true },
		);
	}, [search, sort, sortOrder, locationSearch, navigate]);

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
			const operationType = response.pixelReturn[0].operationType;

			if (operationType.indexOf("ERROR") === -1) {
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
			'[data-home-content="true"]',
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

	const entityLabel =
		type === "DATABASE"
			? "Databases"
			: type === "MODEL"
				? "Models"
				: type === "VECTOR"
					? "Vectors"
					: "Engines";

	return (
		<>
			{(getEngines.status === "LOADING" || isSearching) && (
				<div className="fixed inset-0 z-[1501] flex items-center justify-center bg-background/50">
					<div className="flex flex-col items-center gap-1">
						<Spinner />
						<p className="text-sm">
							{isSearching ? "Searching" : "Loading"}
						</p>
						<p className="text-muted-foreground text-xs">
							{entityLabel}
						</p>
					</div>
				</div>
			)}
			<div className="flex w-full flex-col items-start gap-6 pb-8">
				<div className="flex w-full min-w-0 flex-wrap items-end gap-2 sm:flex-nowrap">
					<InputGroup className="h-10 min-w-[140px] flex-[1_1_auto]">
						<InputGroupAddon>
							<Search className="size-4" />
						</InputGroupAddon>
						<InputGroupInput
							ref={searchbarRef}
							className="h-10"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
							}}
							placeholder="Search"
						/>
						{search ? (
							<InputGroupAddon align="inline-end">
								<InputGroupButton
									size="icon-xs"
									variant="ghost"
									onClick={() => setSearch("")}
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
								value={sort}
								onValueChange={(value) => {
									if (isValidEngineSortField(value)) {
										setSort(value);
									}
								}}
							>
								<SelectTrigger
									className="h-9 w-full"
									aria-label="Sort By"
								>
									<SelectValue placeholder="Sort By" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ENGINENAME">
										Name
									</SelectItem>
									<SelectItem value="DATECREATED">
										Date Created
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex shrink-0 items-center gap-1">
							<Button
								variant={
									sortOrder === "ASC" ? "default" : "outline"
								}
								size="icon-sm"
								className="h-9 w-9"
								title="Ascending Order"
								aria-label="Ascending Order"
								onClick={() => setSortOrder("ASC")}
							>
								<ArrowUp className="size-4" />
							</Button>
							<Button
								variant={
									sortOrder === "DESC" ? "default" : "outline"
								}
								size="icon-sm"
								className="h-9 w-9"
								title="Descending Order"
								aria-label="Descending Order"
								onClick={() => setSortOrder("DESC")}
							>
								<ArrowDown className="size-4" />
							</Button>
						</div>
					</div>
				</div>

				<div className="flex w-full flex-col gap-2">
					{databases.length === 0 &&
					getEngines.status === "SUCCESS" &&
					debouncedSearch ? (
						<div className="py-4 text-center text-muted-foreground text-sm">
							No{" "}
							{type === "DATABASE"
								? "databases"
								: type === "MODEL"
									? "models"
									: type === "VECTOR"
										? "vectors"
										: "engines"}{" "}
							found matching "{debouncedSearch}"
						</div>
					) : null}

					{databases.length
						? databases.map((db) => {
								const engineName =
									db.engine_display_name || db.engine_name;
								const rowType = db.engine_type || type;
								const rowSubtype = db.engine_subtype;
								const detailHref = `#/settings/${type.toLowerCase()}/${db.engine_id}${locationSearch}`;

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
											href={detailHref}
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
											favorite={() => {
												favoriteDb(db);
											}}
											onClick={() => {
												navigate(
													{
														pathname: db.engine_id,
														search: locationSearch,
													},
													{
														state: {
															name: engineName,
															global: db.engine_global,
															permission:
																db.engine_user_permission,
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
									</div>
								);
							})
						: getEngines.status === "SUCCESS" &&
							!debouncedSearch && (
								<div className="py-4 text-muted-foreground text-sm">
									No engines to show
								</div>
							)}
				</div>
			</div>
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
