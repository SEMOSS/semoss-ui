import { SearchIcon } from "lucide-react";
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
					)} ], filterWord=["${search}"], onlyFavorites=[true], ${
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
				`${enginePrefix}(${debouncedSearch ? `filterWord=["${debouncedSearch}"], ` : ""} ${route ? `engineTypes=['${route.type}'], ` : ""} ${metaFilters ? `metaFilters=[${JSON.stringify(metaFilters)}],` : ""} userT = [true], limit=[${limit}], offset=[${offset}]);`,
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
		 * @desc Reset search and scroll when route type changes (navigating between catalogs)
		 */
		useEffect(() => {
			setSearch("");
			resetScroll();
		}, [route.type, resetScroll]);

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
			return <P>ERROR</P>;
		}

		// filter out the bookmarked models for All Models section, it is used not to show StyledSectionLabel for All Models section when there is no (nonBookmarked) model to show
		const nonBookmarked = getEngines.data.filter(
			(db) =>
				!getFavoritedEngines.data.some(
					(fav) => fav.database_id === db.database_id,
				),
		);

		return (
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					<div className="flex flex-row items-center justify-between gap-8">
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

					<InputGroup className="flex-1 border-b-2 border-none">
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
				</div>

				<div className="flex h-full gap-6 pt-2 pb-2">
					<Filterbox
						type={route.type}
						onChange={(filters: Record<string, unknown>) => {
							setMetaFilters(filters);
						}}
						filteredCatalogIds={[]}
					/>
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

						{Object.entries(metaFilters).length === 0 &&
							!isDiscoverable &&
							getFavoritedEngines.data.length > 0 && (
								<p className="font-medium text-sm">
									Bookmarked
								</p>
							)}

						{!isDiscoverable &&
						getFavoritedEngines.data.length &&
						Object.entries(metaFilters).length === 0 ? (
							<div className="grid grid-cols-1 gap-6">
								{getFavoritedEngines.data.map((db) => {
									return (
										<div key={db.database_id}>
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
										</div>
									);
								})}
							</div>
						) : null}

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
													fav.database_id ===
													db.database_id,
											),
									)
									.map((db) => {
										return (
											<div key={db.database_id}>
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
			</div>
		);
	},
);
