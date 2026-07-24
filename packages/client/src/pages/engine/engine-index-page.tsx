import { Plus } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useIteratorPixel, usePixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import {
	Button,
	Muted,
	P,
	Spinner,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { setEngineFavorite, setEngineGlobal } from "@/api";
import {
	CatalogFilterBox,
	CatalogGrid,
	CatalogLayout,
	CatalogSearchBar,
	CatalogTabs,
} from "@/components/catalog";
import { EngineGridItem } from "@/components/engine";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { DeleteEntityDialog } from "@/components/shared/delete-entity-dialog";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { formatToDataTestId } from "@/utility";
import { getEngineLabel, isOwnerPermission } from "@/utility/catalog";

interface EngineIndexPageProps {
	name: string;
	path: string;
	type: Engine["engine_type"];
	description: string;
}

/**
 * Catalog landing Page
 * Landing page to view the available engines
 */
export const EngineIndexPage: React.FC<EngineIndexPageProps> = observer(
	({ name, path, type, description }): JSX.Element => {
		const route = { name, path, type, description };
		const { configStore } = useRootStore();
		const navigate = useNavigate();

		// get metakeys of the ones we want
		const metaKeys = configStore.store.config.databaseMetaKeys
			.filter((k) => {
				return (
					k.display_options === "single-checklist" ||
					k.display_options === "multi-checklist" ||
					k.display_options === "single-select" ||
					k.display_options === "multi-select" ||
					k.display_options === "single-typeahead" ||
					k.display_options === "multi-typeahead" ||
					k.display_options === "select-box"
				);
			})
			.map((k) => {
				return k.metakey;
			});

		const [search, setSearch] = useState("");
		const debouncedSearch = useDebouncedValue(search);
		const [sortValue, setSortValue] = useState("ENGINENAME");
		const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
		const [gridStyle, setGridStyle] = useState<"LIST" | "CARD">("LIST");

		const [metaFilters, setMetaFilters] = useState<Record<string, unknown>>(
			{},
		);
		const [filterKey, setFilterKey] = useState<number>(0);
		const [tab, setTab] = useState<string>("Mine");

		const [isDeletingEngine, setIsDeletingEngine] = useState(false);
		const [engineToDelete, setEngineToDelete] = useState<Engine | null>(
			null,
		);

		const metaKeysDescription = [...metaKeys, "description"];

		const getFavoritedEngines = usePixel<Engine[]>(
			tab === "Mine"
				? `MyEngines(metaKeys = ${JSON.stringify(
						metaKeysDescription,
					)}, metaFilters = [ ${JSON.stringify(metaFilters)} ], ${
						debouncedSearch
							? `filterWord=["${debouncedSearch}"], `
							: ""
					} sort=[{"${sortValue}" : "${sortOrder}"}], onlyFavorites=[true], engineTypes=['${route.type}']);`
				: "",
			{
				data: [],
			},
		);

		/**
		 * Get all of the engines with lazy loading
		 */

		const enginePrefix: string =
			tab === "Mine" ? `MyEngines` : "MyDiscoverableEngines";

		const getEngines = useIteratorPixel<Engine[], Engine>(
			(limit, offset) =>
				`${enginePrefix}(metaKeys = ${JSON.stringify(
					metaKeysDescription,
				)}, ${debouncedSearch ? `filterWord=["${debouncedSearch}"], ` : ""} engineTypes=['${route.type}'], ${metaFilters ? `metaFilters=[${JSON.stringify(metaFilters)}],` : ""} sort=[{"${sortValue}" : "${sortOrder}"}], userT = [true], limit=[${limit}], offset=[${offset}]);`,
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
				tab,
				debouncedSearch,
				sortValue,
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

		/**
		 * Since this uses the same component for all engine types, we need to reset the search and scroll when the type changes
		 */
		useEffect(() => {
			if (!route.type) {
				return;
			}

			setSearch("");
			setMetaFilters({});
			setSortValue("ENGINENAME");
			setSortOrder("ASC");
			setGridStyle("LIST");
			resetScroll();
		}, [route.type, resetScroll]);

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
				getFavoritedEngines.refresh();
			} catch (error) {
				console.error(error);
				toast.error("Error updating global status");
			}
		};

		/**
		 * @name setFavorite
		 * @param engine
		 */
		const setFavorite = async (engine: Engine) => {
			// check if is favorited
			const updatedFavorite = !(engine.engine_favorite === 1);

			try {
				await setEngineFavorite(engine.engine_id, updatedFavorite);

				// reset and refresh it
				resetScroll();
				getFavoritedEngines.refresh();
				getEngines.reset();
			} catch (error) {
				console.error(error);
				toast.error("Error updating favorite status");
			}
		};

		/**
		 * @name openInfo
		 * @param engine
		 */
		const openInfo = async (engine: Engine) => {
			window.open(`#/${route.path}/${engine.engine_id}`, "_blank");
		};

		/**
		 * @name deleteEngine
		 * @desc confirm deleting an engine
		 */
		const deleteEngine = async () => {
			if (!engineToDelete) {
				return;
			}

			try {
				setIsDeletingEngine(true);

				const response = await configStore.runPixel(
					`DeleteEngine(engine=['${engineToDelete.engine_id}']);`,
				);

				const operationType =
					response.pixelReturn?.[0]?.operationType || "";
				const output = response.pixelReturn?.[0]?.output;

				if (operationType.indexOf("ERROR") === -1) {
					toast.success(
						`Successfully deleted ${engineToDelete.engine_display_name || engineToDelete.engine_name}`,
					);
					resetScroll();
					getFavoritedEngines.refresh();
					getEngines.reset();
					setFilterKey((prev) => prev + 1);
				} else {
					toast.error(String(output || "Failed to delete"));
				}
			} catch (error) {
				toast.error(String(error));
			} finally {
				setIsDeletingEngine(false);
				setEngineToDelete(null);
			}
		};

		// if there is an error show this
		if (getEngines.isError) {
			return <P>ERROR</P>;
		}

		/**
		 * Handle delete request
		 */
		const handleDeleteRequest = (engine: Engine) => {
			setEngineToDelete(engine);
		};

		// filter out the bookmarked
		const nonBookmarked = getEngines.data.filter(
			(db) =>
				!getFavoritedEngines.data.some(
					(fav) => fav.engine_id === db.engine_id,
				),
		);

		return (
			<>
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
				<CatalogLayout
					title={`${route.name} Catalog`}
					description={route.description}
					headerActions={
						<Button
							variant="default"
							onClick={() => {
								navigate(`/${route.type.toLowerCase()}/new`);
							}}
							aria-label={`Add ${route.name}`}
							data-testid={formatToDataTestId(
								`engineIndex-add-${route.name}-btn`,
							)}
						>
							<Plus className="size-4" />
							Add {route.name}
						</Button>
					}
					searchBar={
						<CatalogSearchBar
							search={search}
							onSearchChange={setSearch}
							placeholder="Search"
							sortValue={sortValue}
							sortOrder={sortOrder}
							sortOptions={[
								{ value: "ENGINENAME", label: "Name" },
								{ value: "DATECREATED", label: "Date Created" },
							]}
							onSortChange={(value, order) => {
								if (
									sortOrder === value &&
									sortValue === order
								) {
									return;
								}

								setSortValue(value);
								setSortOrder(order);
								resetScroll();
								getEngines.reset();
							}}
							showGridStyle={true}
							gridStyle={gridStyle}
							onGridStyleChange={(v) => setGridStyle(v)}
						/>
					}
					tabs={
						<CatalogTabs
							value={tab}
							onValueChange={(val) => setTab(val)}
							tabs={[
								{
									value: "Mine",
									label: `My ${route.name}s`,
									dataTestId: `engineIndexPage-${route.name}s-my-switch`,
								},
								{
									value: "Discoverable",
									label: `Discoverable ${route.name}s`,
									dataTestId: `engineIndexPage-${route.name}s-discoverable-switch`,
								},
							]}
						/>
					}
					filterBox={
						<CatalogFilterBox
							key={filterKey}
							type={route.type}
							filters={metaFilters as Record<string, string[]>}
							onChange={(filters) => setMetaFilters(filters)}
						/>
					}
				>
					{tab === "Mine" && (
						<>
							{/* Loading State */}
							{getFavoritedEngines.status === "LOADING" &&
							getEngines.isLoading ? (
								<div className="flex flex-col items-center justify-center py-6">
									<Spinner className="size-4" />
								</div>
							) : null}

							{/* Bookmarked Section */}
							{getFavoritedEngines.data.length > 0 && (
								<>
									<p className="font-medium text-sm">
										Bookmarked
									</p>
									<CatalogGrid variant={gridStyle}>
										{getFavoritedEngines.data.map(
											(engine) => (
												<EngineGridItem
													key={engine.engine_id}
													variant={gridStyle}
													path={`/${route.path}/${engine.engine_id}/workbench`}
													engine={engine}
													isFavorited={true}
													showFavorite={true}
													showGlobal={true}
													showInfo={true}
													showDelete={isOwnerPermission(
														engine.engine_user_permission,
													)}
													onFavorite={setFavorite}
													onInfo={openInfo}
													onGlobalToggle={setGlobal}
													onDelete={
														handleDeleteRequest
													}
												/>
											),
										)}
									</CatalogGrid>
								</>
							)}

							{/* All Section Label */}
							{Object.entries(metaFilters).length === 0 &&
								nonBookmarked.length > 0 && (
									<p className="font-medium text-sm">
										All {route.name}s
									</p>
								)}

							{/* All Items */}
							{nonBookmarked.length > 0 && (
								<CatalogGrid
									isLoading={getEngines.isLoading}
									showLoadingMore={nonBookmarked.length > 0}
									variant={gridStyle}
								>
									{nonBookmarked.map((engine) => (
										<EngineGridItem
											key={engine.engine_id}
											variant={gridStyle}
											path={`/${route.path}/${engine.engine_id}/workbench`}
											engine={engine}
											isFavorited={
												engine.engine_favorite === 1
											} // should be false
											showFavorite={true}
											showGlobal={true}
											showInfo={true}
											showDelete={isOwnerPermission(
												engine.engine_user_permission,
											)}
											onFavorite={setFavorite}
											onInfo={openInfo}
											onGlobalToggle={setGlobal}
											onDelete={handleDeleteRequest}
										/>
									))}
								</CatalogGrid>
							)}

							{/* Empty State */}
							{!getEngines.isLoading &&
								getFavoritedEngines.status !== "LOADING" &&
								nonBookmarked.length === 0 &&
								getFavoritedEngines.data.length === 0 && (
									<div className="w-full px-2 py-4 text-center">
										<Muted>No results found</Muted>
									</div>
								)}
						</>
					)}
					{tab === "Discoverable" && (
						<>
							{/* Loading State */}
							{getEngines.isLoading ? (
								<div className="flex flex-col items-center justify-center py-6">
									<Spinner className="size-4" />
								</div>
							) : null}

							{/* All Items */}
							{getEngines.data.length > 0 && (
								<CatalogGrid
									isLoading={getEngines.isLoading}
									showLoadingMore={getEngines.data.length > 0}
									variant={gridStyle}
								>
									{getEngines.data.map((engine) => (
										<EngineGridItem
											key={engine.engine_id}
											variant={gridStyle}
											path={`/${route.path}/${engine.engine_id}/workbench`}
											engine={engine}
											isFavorited={
												engine.engine_favorite === 1
											}
											showFavorite={isOwnerPermission(
												engine.engine_user_permission,
											)}
											showGlobal={isOwnerPermission(
												engine.engine_user_permission,
											)}
											showInfo={true}
											showDelete={isOwnerPermission(
												engine.engine_user_permission,
											)}
											onFavorite={setFavorite}
											onInfo={openInfo}
											onGlobalToggle={setGlobal}
											onDelete={handleDeleteRequest}
										/>
									))}
								</CatalogGrid>
							)}

							{/* Empty State */}
							{!getEngines.isLoading &&
								getEngines.data.length === 0 && (
									<div className="w-full px-2 py-4 text-center">
										<Muted>No results found</Muted>
									</div>
								)}
						</>
					)}

					<DeleteEntityDialog
						open={Boolean(engineToDelete)}
						onOpenChange={(open) => {
							if (!open) {
								setEngineToDelete(null);
							}
						}}
						entityLabel={getEngineLabel(
							engineToDelete?.engine_type,
						)}
						entityName={
							engineToDelete?.engine_display_name ||
							engineToDelete?.engine_name ||
							"Engine"
						}
						entityId={engineToDelete?.engine_id || ""}
						onConfirm={deleteEngine}
						isLoading={isDeletingEngine}
					/>
				</CatalogLayout>
			</>
		);
	},
);
