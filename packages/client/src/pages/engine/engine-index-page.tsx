import { ArrowDown, ArrowUp, SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { runPixel, useIteratorPixel, usePixel } from "@semoss/sdk/react";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Tabs,
	TabsList,
	TabsTrigger,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { setEngineFavorite, setEngineGlobal } from "@/api";
import { EngineLandscapeCard } from "@/components/engine";
import { Help } from "@/components/help";
import { DeleteEntityDialog } from "@/components/shared/delete-entity-dialog";
import { Filterbox } from "@/components/ui";
import { useRootStore } from "@/hooks";
import { formatToDataTestId } from "@/utility";
import type { ENGINE_ROUTES } from "./engine.constants";

// TODO: Use type from @semoss/shared
interface Engine {
	engine_id: string;
	engine_display_name?: string;
	engine_name: string;
	engine_type: string;
	description?: string;
	low_engine_name: string;
	engine_global: true;
	engine_favorite?: number;
	engine_user_permission?: number;
	engine_permission?: number | string;
	permission?: number | string;
	engine_group_permission?: number;
	engine_date_created: string;
	engine_subtype: string;
	domain: string;
	engine_discoverable: boolean;
	tag: string[];
	engine_created_by: string;
	engine_created_by_type: string;
	upvotes: string;
	views: string;
	trending: string;
	hasUpvoted: boolean;
}

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

		const [search, setSearch] = useState("");
		const debouncedSearch = useDebouncedValue(search);
		const [sort, setSort] = useState("ENGINENAME");
		const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
		const [isDeletingEngine, setIsDeletingEngine] = useState(false);
		const [engineToDelete, setEngineToDelete] = useState<{
			id: string;
			name: string;
		} | null>(null);

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
					)}, metaFilters = [ ${JSON.stringify(metaFilters)} ], ${
						debouncedSearch
							? `filterWord=["${debouncedSearch}"], `
							: ""
					} sort=[{"${sort}" : "${sortOrder}"}], onlyFavorites=[true], ${
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
				`${enginePrefix}(metaKeys = ${JSON.stringify(
					metaKeysDescription,
				)}, ${debouncedSearch ? `filterWord=["${debouncedSearch}"], ` : ""} ${route ? `engineTypes=['${route.type}'], ` : ""} ${metaFilters ? `metaFilters=[${JSON.stringify(metaFilters)}],` : ""} sort=[{"${sort}" : "${sortOrder}"}], userT = [true], limit=[${limit}], offset=[${offset}]);`,
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
				mode,
				debouncedSearch,
				sort,
				sortOrder,
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

		// Filterbox owns the GetEngineMetaValues call to avoid duplicate requests.

		/**
		 * @name setGlobal
		 * @param engine
		 */
		const setGlobal = async (engine: Engine) => {
			try {
				await setEngineGlobal(
					false,
					engine.engine_id,
					!engine.engine_global,
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
			const updatedFavorite = !isFavorited(engine.engine_id);

			try {
				await setEngineFavorite(engine.engine_id, updatedFavorite);

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
				(el) => el.engine_id === engineId,
			);
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
					toast.success(
						`Successfully deleted ${engineToDelete.name}`,
					);
					resetScroll();
					getFavoritedEngines.refresh();
					getEngines.reset();
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
		 * @param engine
		 */
		const upvoteDb = async (engine: Engine) => {
			try {
				let pixel = "";

				if (!engine.hasUpvoted) {
					pixel += `VoteEngine(engine="${engine.engine_id}", vote=1)`;
				} else {
					pixel += `UnvoteEngine(engine="${engine.engine_id}")`;
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
				'[data-home-content="true"]',
			) as HTMLDivElement;

			setScroll(scrollEle);

			return () => {
				setScroll(null);
			};
		}, [setScroll]);

		useEffect(() => {
			if (!route.type) {
				return;
			}

			setSearch("");
			resetScroll();
		}, [route.type, resetScroll]);

		const handleSortChange = (value: string) => {
			setSort(value);
			resetScroll();
			getEngines.reset();
		};

		const handleSortOrderChange = (value: "ASC" | "DESC") => {
			if (sortOrder === value) {
				return;
			}
			setSortOrder(value);
			resetScroll();
			getEngines.reset();
		};

		// if there is an error show this
		if (getEngines.isError) {
			return <P>ERROR</P>;
		}

		// filter out the bookmarked models for All Models section, it is used not to show StyledSectionLabel for All Models section when there is no (nonBookmarked) model to show
		const nonBookmarked = getEngines.data.filter(
			(db) =>
				!getFavoritedEngines.data.some(
					(fav) => fav.engine_id === db.engine_id,
				),
		);

		return (
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
						<p className="font-semibold text-3xl leading-normal">
							{route ? route.name : ""} Catalog
						</p>

						{configStore.isEngineOperationAvailable(
							route.type,
							"add",
						) && (
							<div className="flex flex-row items-center gap-6">
								<Button
									variant="default"
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
							</div>
						)}
					</div>
					<div className="flex flex-row items-center justify-between gap-8 pt-2.5">
						<p className="font-weight-normal text-md text-muted-foreground leading-normal">
							{route ? route.description : ""}
						</p>
					</div>

					<div className="flex w-full min-w-0 flex-wrap items-end gap-2 md:flex-nowrap">
						<InputGroup className="min-w-[110px] flex-[1_1_auto] border-b-2 border-none">
							<InputGroupAddon>
								<SearchIcon className="size-4 text-muted-foreground" />
							</InputGroupAddon>
							<InputGroupInput
								placeholder="Search"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								data-testid="search-bar"
							/>
						</InputGroup>
						<div className="flex w-auto shrink-0 items-center gap-1">
							<div className="w-[136px] sm:w-[148px]">
								<Select
									value={sort}
									onValueChange={handleSortChange}
								>
									<SelectTrigger
										className="h-9 w-full"
										aria-label="Sort By"
									>
										<SelectValue placeholder="Name" />
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
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-6 pt-2 pb-2 md:h-full md:flex-row">
					<div className="md:sticky md:top-4 md:self-start">
						<Filterbox
							type={route.type}
							onChange={(filters: Record<string, unknown>) => {
								setMetaFilters(filters);
							}}
							filteredCatalogIds={[]}
							hideHeaderToggleFrom="md"
						/>
					</div>
					<div className="flex h-full w-full flex-1 flex-col gap-6">
						<div className="flex flex-row items-center justify-between">
							<Tabs
								value={mode}
								onValueChange={(val) => {
									setMode(val as MODE);
								}}
							>
								<TabsList>
									<TabsTrigger
										value="Mine"
										data-testid={formatToDataTestId(
											`engineIndexPage-${route ? `${route.name}s` : "Engines"}-my-switch`,
										)}
									>
										My{" "}
										{route ? `${route.name}s` : "Engines"}
									</TabsTrigger>
									<TabsTrigger
										value="Discoverable"
										data-testid={formatToDataTestId(
											`engineIndexPage-${route ? `${route.name}s` : "Engines"}-discoverable-switch`,
										)}
									>
										Discoverable{" "}
										{route ? `${route.name}s` : "Engines"}
									</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>

						{!isDiscoverable &&
							getFavoritedEngines.data.length > 0 && (
								<p className="font-medium text-sm">
									Bookmarked
								</p>
							)}

						{!isDiscoverable && getFavoritedEngines.data.length > 0 && (
							<div className="grid grid-cols-1 gap-6">
								{getFavoritedEngines.data.map((db) => {
									return (
										<div key={db.engine_id}>
											<EngineLandscapeCard
												name={
													db.engine_display_name ||
													db.engine_name
												}
												desktopInlineMeta={true}
												type={db.engine_type}
												id={db.engine_id}
												tag={db.tag}
												owner={db.engine_created_by}
												date={db.engine_date_created}
												description={db.description}
												votes={db.upvotes}
												views={db.views}
												sub_type={db.engine_subtype}
												trending={db.trending}
												isGlobal={db.engine_global}
												isUpvoted={db.hasUpvoted}
												isFavorite={
													isDiscoverable
														? false
														: isFavorited(
																db.engine_id,
															)
												}
												isDiscoverable={isDiscoverable}
												onDelete={
													isOwnerPermission(
														db.engine_user_permission ||
															db.permission ||
															db.engine_permission,
													)
														? () => {
																setEngineToDelete(
																	{
																		id: db.engine_id,
																		name:
																			db.engine_display_name ||
																			db.engine_name,
																	},
																);
															}
														: undefined
												}
												onClick={() => {
													navigate(`${db.engine_id}`);
												}}
												favorite={() => {
													favoriteDb(db);
												}}
												upvote={() => {
													upvoteDb(db);
												}}
												global={
													db.engine_user_permission ===
													1
														? () => {
																setGlobal(db);
															}
														: null
												}
											/>
										</div>
									);
								})}
							</div>
						)}

						{Object.entries(metaFilters).length === 0 &&
							getEngines.data.length > 0 &&
							nonBookmarked.length > 0 && (
								<p className="font-medium text-sm">
									All {route.name}s
								</p>
							)}

						{getEngines.data.length ? (
							<div className="grid grid-cols-1 gap-6">
								{getEngines.data
									.filter(
										(db) =>
											!getFavoritedEngines.data.some(
												(fav) =>
													fav.engine_id ===
													db.engine_id,
											),
									)
									.map((db) => {
										return (
											<div key={db.engine_id}>
												<EngineLandscapeCard
													name={
														db.engine_display_name ||
														db.engine_name
													}
													desktopInlineMeta={true}
													type={db.engine_type}
													id={db.engine_id}
													tag={db.tag}
													date={
														db.engine_date_created
													}
													owner={db.engine_created_by}
													description={db.description}
													votes={db.upvotes}
													views={db.views}
													sub_type={db.engine_subtype}
													trending={db.trending}
													isGlobal={db.engine_global}
													isUpvoted={db.hasUpvoted}
													isFavorite={
														isDiscoverable
															? false
															: isFavorited(
																	db.engine_id,
																)
													}
													isDiscoverable={
														isDiscoverable
													}
													onDelete={
														isOwnerPermission(
															db.engine_user_permission ||
																db.permission ||
																db.engine_permission,
														)
															? () => {
																	setEngineToDelete(
																		{
																			id: db.engine_id,
																			name:
																				db.engine_display_name ||
																				db.engine_name,
																		},
																	);
																}
															: undefined
													}
													onClick={() => {
														navigate(
															`${db.engine_id}`,
														);
													}}
													favorite={() => {
														favoriteDb(db);
													}}
													upvote={() => {
														upvoteDb(db);
													}}
													global={
														db.engine_user_permission ===
														1
															? () => {
																	setGlobal(
																		db,
																	);
																}
															: null
													}
												/>
											</div>
										);
									})}

								{getEngines.isLoading &&
									getEngines.data.length > 0 && (
										<div className="flex items-center justify-center py-2">
											<Spinner className="size-4" />
										</div>
									)}
							</div>
						) : null}
					</div>
				</div>
				<Help />
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
			</div>
		);
	},
);
