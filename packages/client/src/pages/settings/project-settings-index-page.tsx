import { useEffect, useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Muted,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { CatalogGrid, CatalogSearchBar } from "@/components/catalog";
import { ProjectGridItem } from "@/components/project";
import { DeleteEntityDialog } from "@/components/shared/delete-entity-dialog";
import { useRootStore, useSettings } from "@/hooks";
import { getProjectLabel, isOwnerPermission } from "@/utility/catalog";

export const ProjectSettingsIndexPage = () => {
	const { adminMode } = useSettings();
	const { configStore } = useRootStore();

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const [sort, setSort] = useState<string>("PROJECTNAME");
	const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
	const [isDeletingProject, setIsDeletingProject] = useState(false);
	const [projectToDelete, setProjectToDelete] = useState<Project | null>(
		null,
	);

	// get metakeys to the ones we want
	const metaKeys = configStore.store.config.projectMetaKeys
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

	const projectPixelPrefix = adminMode ? "AdminMyProjects" : "MyProjects";

	/**
	 * Get all of the projects with lazy loading
	 */
	const getProjects = useIteratorPixel<Project[], Project>(
		(limit, offset) =>
			`${projectPixelPrefix}(metaKeys = ${JSON.stringify(metaKeys)}, filterWord=["${debouncedSearch}"], sort=[{"${sort}" : "${sortOrder}"}], limit=[${limit}], offset=[${offset}]);`,
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
		[adminMode, debouncedSearch, sort, sortOrder],
	);

	/**
	 * Setup infinite scroll for the project list
	 */
	const { setScroll, resetScroll } = useInfiniteScroll({
		disabled: getProjects.isLoading || !getProjects.hasMore,
		onNext: () => {
			getProjects.next();
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
	const deleteProject = async () => {
		if (!projectToDelete) {
			return;
		}

		try {
			setIsDeletingProject(true);

			let deletePixel = "";
			if (projectToDelete.project_type === "WORKSPACE") {
				deletePixel = `DeleteWorkspace(workspaceId=['${projectToDelete.project_id}']);`;
			} else if (projectToDelete.project_type === "SKILL") {
				deletePixel = `DeleteSkill(skillId=['${projectToDelete.project_id}']);`;
			} else {
				deletePixel = `DeleteProject(project=['${projectToDelete.project_id}']);`;
			}

			const response = await configStore.runPixel(deletePixel);

			const operationType =
				response.pixelReturn?.[0]?.operationType || "";
			const output = response.pixelReturn?.[0]?.output;

			if (operationType.indexOf("ERROR") === -1) {
				toast.success(
					`Successfully deleted ${projectToDelete.project_display_name || projectToDelete.project_name}`,
				);
				resetScroll();
				getProjects.reset();
			} else {
				toast.error(String(output || "Failed to delete"));
			}
		} catch (error) {
			toast.error(String(error));
		} finally {
			setIsDeletingProject(false);
			setProjectToDelete(null);
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
						{ value: "PROJECTNAME", label: "Name" },
						{ value: "DATECREATED", label: "Date Created" },
						{ value: "DATELASTEDITED", label: "Date Last Edited" },
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
				{!getProjects.isLoading && getProjects.data.length === 0 && (
					<div className="w-full px-2 py-4 text-center">
						<Muted>No results found</Muted>
					</div>
				)}

				{/* Project list */}
				{getProjects.data.length > 0 && (
					<CatalogGrid
						variant="LIST"
						isLoading={getProjects.isLoading}
						showLoadingMore={getProjects.data.length > 0}
					>
						{getProjects.data.map((project) => (
							<ProjectGridItem
								variant="LIST"
								key={project.project_id}
								path={`/settings/app/${project.project_id}`}
								project={project}
								isFavorited={false}
								showFavorite={false}
								showGlobal={false}
								showDelete={
									adminMode ||
									isOwnerPermission(project.user_permission)
								}
								showClone={false}
								onFavorite={() => null}
								onGlobalToggle={() => null}
								onClone={() => null}
								onDelete={(project) =>
									setProjectToDelete(project)
								}
							/>
						))}
					</CatalogGrid>
				)}
			</div>

			<DeleteEntityDialog
				open={Boolean(projectToDelete)}
				onOpenChange={(open) => {
					if (!open) {
						setProjectToDelete(null);
					}
				}}
				entityLabel={getProjectLabel(projectToDelete?.project_type)}
				entityName={
					projectToDelete?.project_display_name ||
					projectToDelete?.project_name ||
					"Project"
				}
				entityId={projectToDelete?.project_id || ""}
				onConfirm={deleteProject}
				isLoading={isDeletingProject}
			/>
		</>
	);
};
