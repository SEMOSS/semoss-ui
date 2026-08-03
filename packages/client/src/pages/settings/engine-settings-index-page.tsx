import { useEffect, useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import {
	Muted,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { CatalogGrid, CatalogSearchBar } from "@/components/catalog";
import { EngineGridItem } from "@/components/engine";
import { DeleteEntityDialog } from "@/components/shared/delete-entity-dialog";
import { useRootStore, useSettings } from "@/hooks";
import { getEngineLabel, isOwnerPermission } from "@/utility/catalog";

/**
 * Show detailed settings for an engine
 */
interface EngineSettingsIndexPageProps {
	/** Type of the page to render */
	type: Engine["engine_type"];
}

export const EngineSettingsIndexPage = (
	props: EngineSettingsIndexPageProps,
) => {
	const { type } = props;

	const { adminMode } = useSettings();
	const { configStore } = useRootStore();

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const [sort, setSort] = useState<string>("ENGINENAME");
	const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
	const [isDeletingEngine, setIsDeletingEngine] = useState(false);
	const [engineToDelete, setEngineToDelete] = useState<Engine | null>(null);

	// get metakeys to the ones we want
	const metaKeys = configStore.store.config.databaseMetaKeys
		.filter((k) => {
			return (
				k.display_options === "single-checklist" ||
				k.display_options === "multi-checklist" ||
				k.display_options === "single-select" ||
				k.display_options === "multi-select" ||
				k.display_options === "single-typeahead" ||
				k.display_options === "multi-typeahead" ||
				k.display_options === "textarea"
			);
		})
		.map((k) => {
			return k.metakey;
		});

	const enginePixelPrefix = adminMode ? "AdminMyEngines" : "MyEngines";

	/**
	 * Get all of the engines with lazy loading
	 */
	const getEngines = useIteratorPixel<Engine[], Engine>(
		(limit, offset) =>
			`${enginePixelPrefix}(metaKeys = ${JSON.stringify(metaKeys)}, filterWord=["${debouncedSearch}"], sort=[{"${sort}" : "${sortOrder}"}], engineTypes=["${type}"], limit=[${limit}], offset=[${offset}]);`,
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
		[adminMode, type, debouncedSearch, sort, sortOrder],
	);

	/**
	 * Setup infinite scroll for the engine list
	 */
	const { setScroll, resetScroll } = useInfiniteScroll({
		disabled: getEngines.isLoading || !getEngines.hasMore || !type,
		onNext: () => {
			getEngines.next();
		},
	});

	/**
	 * @desc infinite scroll setup
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
	 * Delete the engine
	 * @returns
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

	return (
		<>
			<div className="flex w-full flex-col items-start gap-4">
				<CatalogSearchBar
					search={search}
					onSearchChange={setSearch}
					placeholder="Search"
					sortValue={sort}
					sortOrder={sortOrder}
					sortOptions={[
						{ value: "ENGINENAME", label: "Name" },
						{ value: "DATECREATED", label: "Date Created" },
					]}
					onSortChange={(value, order) => {
						setSort(value);
						setSortOrder(order);
					}}
					showGridStyle={false}
					gridStyle="LIST"
					onGridStyleChange={() => {}}
				/>

				{/* Empty State */}
				{!getEngines.isLoading && getEngines.data.length === 0 && (
					<div className="w-full px-2 py-4 text-center">
						<Muted>No results found</Muted>
					</div>
				)}

				{/* Engine list */}
				{getEngines.data.length > 0 && (
					<CatalogGrid
						variant="LIST"
						isLoading={getEngines.isLoading}
						showLoadingMore={getEngines.data.length > 0}
					>
						{getEngines.data.map((engine) => (
							<EngineGridItem
								variant="LIST"
								key={engine.engine_id}
								path={`/settings/${type.toLowerCase()}/${engine.engine_id}`}
								engine={engine}
								isFavorited={false}
								showFavorite={false}
								showGlobal={false}
								showDelete={
									adminMode ||
									isOwnerPermission(
										engine.engine_user_permission,
									)
								}
								onFavorite={() => null}
								onGlobalToggle={() => null}
								onDelete={(engine) => setEngineToDelete(engine)}
							/>
						))}
					</CatalogGrid>
				)}
			</div>
			<DeleteEntityDialog
				open={Boolean(engineToDelete)}
				onOpenChange={(open) => {
					if (!open) {
						setEngineToDelete(null);
					}
				}}
				entityLabel={getEngineLabel(engineToDelete?.engine_type)}
				entityName={
					engineToDelete?.engine_display_name ||
					engineToDelete?.engine_name ||
					"Engine"
				}
				entityId={engineToDelete?.engine_id || ""}
				onConfirm={deleteEngine}
				isLoading={isDeletingEngine}
			/>
		</>
	);
};
