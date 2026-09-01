import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIteratorPixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Muted,
	P,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import {
	CatalogFilterBox,
	CatalogGrid,
	CatalogLayout,
	CatalogSearchBar,
} from "@/components/catalog";
import { CloneProjectDialog } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { TemplateCard } from "@/components/templates";
import { useRootStore } from "@/hooks";

/**
 * Template Catalog Landing Page
 * Displays available templates in a card grid following standard catalog layout
 */
export const TemplatePage: React.FC = observer((): JSX.Element => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();

	// get metakeys of the ones we want
	const metaKeys = configStore.store.config.projectMetaKeys
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
	const [sortValue, setSortValue] = useState("PROJECTNAME");
	const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
	const [cloneTemplate, setCloneTemplate] = useState<Project | null>(null);

	const [metaFilters, setMetaFilters] = useState<Record<string, unknown>>({});

	const metaKeysDescription = [...metaKeys, "description"];

	/**
	 * Fetch all templates with lazy loading
	 */
	const getTemplates = useIteratorPixel<Project[], Project>(
		(limit, offset) =>
			`MyProjects(metaKeys = ${JSON.stringify(
				metaKeysDescription,
			)}, ${debouncedSearch ? `filterWord=["${debouncedSearch}"], ` : ""} ${metaFilters && Object.keys(metaFilters).length > 0 ? `metaFilters=[${JSON.stringify(metaFilters)}],` : ""} sort=[{"${sortValue}" : "${sortOrder}"}], onlyTemplates=[true], limit=[${limit}], offset=[${offset}]);`,
		(response) => {
			if (response.length < 15) {
				return -1;
			}
			return Infinity;
		},
		(response) => response,
		{
			limit: 15,
		},
		[debouncedSearch, sortValue, sortOrder, JSON.stringify(metaFilters)],
	);

	/**
	 * Infinite scroll trigger
	 */
	const { setScroll, resetScroll } = useInfiniteScroll({
		disabled: getTemplates.isLoading || !getTemplates.hasMore,
		onNext: () => {
			getTemplates.next();
		},
	});

	useEffect(() => {
		const scrollEle = document.querySelector(
			'[data-home-content="true"]',
		) as HTMLDivElement;

		if (scrollEle) {
			setScroll(scrollEle);
		}

		return () => {
			setScroll(null);
		};
	}, [setScroll]);

	if (getTemplates.isError) {
		return <P>ERROR</P>;
	}

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<CatalogLayout
				title="Templates"
				description="See Templates"
				searchBar={
					<CatalogSearchBar
						search={search}
						onSearchChange={setSearch}
						placeholder="Search templates"
						sortValue={sortValue}
						sortOrder={sortOrder}
						sortOptions={[
							{ value: "PROJECTNAME", label: "Name" },
							{ value: "DATECREATED", label: "Date Created" },
						]}
						onSortChange={(value, order) => {
							if (sortOrder === order && sortValue === value) {
								return;
							}

							setSortValue(value);
							setSortOrder(order);
							resetScroll();
							getTemplates.reset();
						}}
						showGridStyle={false}
						gridStyle="CARD"
						onGridStyleChange={() => null}
					/>
				}
				filterBox={
					<CatalogFilterBox
						type="CODE"
						filters={metaFilters as Record<string, string[]>}
						onChange={(filters) => {
							setMetaFilters(filters);
							resetScroll();
							getTemplates.reset();
						}}
					/>
				}
			>
				{/* Loading State */}
				{getTemplates.isLoading && getTemplates.data.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-6">
						<Spinner className="size-4" />
					</div>
				) : null}

				{/* Cards Grid */}
				{getTemplates.data.length > 0 && (
					<CatalogGrid
						variant="CARD"
						columns={3}
						gap={4}
						isLoading={getTemplates.isLoading}
						showLoadingMore={getTemplates.data.length > 0}
					>
						{getTemplates.data.map((template) => (
							<TemplateCard
								key={template.project_id}
								id={template.project_id}
								path={`/templates/${template.project_id}`}
								name={
									template.project_display_name ||
									template.project_name
								}
								description={template.description || ""}
								image=""
								dateLastEdited={
									template.project_date_created || ""
								}
								tags={
									Array.isArray(template.tag)
										? template.tag
										: template.tag
											? [template.tag]
											: []
								}
								onUseTemplate={() => setCloneTemplate(template)}
							/>
						))}
					</CatalogGrid>
				)}

				{/* Empty State */}
				{!getTemplates.isLoading && getTemplates.data.length === 0 && (
					<div className="w-full px-2 py-4 text-center">
						<Muted>No results found</Muted>
					</div>
				)}
			</CatalogLayout>

			{/* Use / Clone Template Dialog */}
			{cloneTemplate && (
				<CloneProjectDialog
					open={Boolean(cloneTemplate)}
					project={cloneTemplate}
					onClose={(newAppId) => {
						setCloneTemplate(null);
						if (newAppId) {
							navigate(`/s/${newAppId}`);
						}
					}}
				/>
			)}
		</>
	);
});
