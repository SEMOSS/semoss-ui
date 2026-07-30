import { Plus } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useIteratorPixel, usePixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Button,
	Muted,
	Spinner,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { setProjectFavorite, setProjectGlobal } from "@/api";
import { SystemAppGridItem } from "@/components/app";
import { AddAppCloneModal } from "@/components/app/save-app/add-app-clone-modal";
import {
	CatalogGrid,
	CatalogLayout,
	CatalogSearchBar,
	CatalogTabs,
} from "@/components/catalog";
import { CatalogFilterBox } from "@/components/catalog/catalog-filter-box";
import { Help } from "@/components/help";
import { DeleteEntityDialog } from "@/components/shared/delete-entity-dialog";
import { useAdminMode, useRootStore } from "@/hooks";
import { getProjectLabel, isOwnerPermission } from "@/utility/catalog";
import { NavbarHeader, NavbarLeft } from "../shared";
import { ProjectGridItem } from "./project-grid-item";

const CATALOG_CONFIG = {
	CODE: {
		name: "App",
		description:
			"Build, organize, and share apps in one place. Create new experiences, manage existing apps, and discover what your team has published.",
		createPath: "/app/new",
		basePath: "/app",
		itemSubPath: "view",
		pixelFilter: 'projectType=["CODE", "BLOCKS"]',
		showSystemTab: true,
	},
	SKILL: {
		name: "Skill",
		description:
			"Create reusable capabilities for your agents. Skills package tools, integrations, and workflows so you can automate tasks, connect external systems, and scale proven patterns across teams.",
		createPath: "/skill/new",
		basePath: "/skill",
		itemSubPath: "view",
		pixelFilter: 'projectType=["SKILL"]',
		showSystemTab: false,
	},
	WORKSPACE: {
		name: "Agent",
		description:
			"Agents are autonomous AI assistants configured with specific skills, knowledge bases, and behavioral guidelines to accomplish complex tasks. Create agents tailored to your workflows, from customer support and data analysis to content generation and research. Manage and deploy intelligent agents that can reason, plan, and execute multi-step processes.",
		createPath: "/agent/new",
		basePath: "/agent",
		itemSubPath: "edit",
		pixelFilter: 'projectType=["WORKSPACE"]',

		showSystemTab: false,
	},
} as const;

type TabMode = "Mine" | "Discoverable" | "System";

const SYSTEM_APPS: {
	id: string;
	name: string;
	description: string;
	href: string;
}[] = [
	{
		id: "playground-system-app",
		name: "Playground",
		description:
			"Experiment with AI agents, tools, and MCP integrations in an interactive workspace.",
		href: "../../playground/dist/",
	},
	{
		id: "bi-system-app",
		name: "BI",
		description: "Develop dashboards and visualizations to view data",
		href: "../../legacy/dist/",
	},
	{
		id: "terminal-system-app",
		name: "Terminal",
		description: "Execute commands and see a response",
		href: "../../terminal/dist/",
	},
	{
		id: "playwright-system-app",
		name: "Playwright Browser",
		description:
			"Drive a remote browser, record what you do, and replay it later",
		href: "../../playwright-browser-sockets/dist/",
	},
];

interface ProjectCatalogProps {
	type: Project["project_type"];
}

export const ProjectCatalog = observer(
	({ type }: ProjectCatalogProps): JSX.Element => {
		const config = CATALOG_CONFIG[type as keyof typeof CATALOG_CONFIG];
		const { configStore } = useRootStore();
		const adminMode = useAdminMode();
		// Shows AUTOMATION apps in the App catalog for admins.
		// AUTOMATION has no dedicated catalog entry yet; apps open via the existing App routes.
		const pixelFilter =
			type === "CODE" && adminMode
				? 'projectType=["CODE", "BLOCKS", "AUTOMATION"]'
				: config.pixelFilter;

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
		const [gridStyle, setGridStyle] = useState<"LIST" | "CARD">("LIST");

		const [metaFilters, setMetaFilters] = useState<Record<string, unknown>>(
			{},
		);
		const [filterKey, setFilterKey] = useState<number>(0);
		const [tab, setTab] = useState<string>("Mine");

		const [isDeletingProject, setIsDeletingProject] = useState(false);
		const [projectToDelete, setProjectToDelete] = useState<Project | null>(
			null,
		);

		// Clone modal state
		const [cloneModalApp, setCloneModalApp] = useState<Project | null>(
			null,
		);

		const metaKeysDescription = [...metaKeys, "description"];

		const getFavoriteProjects = usePixel<Project[]>(
			tab === "Mine"
				? `MyProjects(metaKeys = ${JSON.stringify(
						metaKeysDescription,
					)}, metaFilters=[${JSON.stringify(
						metaFilters,
					)}], filterWord=["${debouncedSearch}"], sort=[{"${sortValue}" : "${sortOrder}"}], ${pixelFilter}, onlyFavorites=[true]);`
				: "",
			{
				data: [],
			},
		);

		/**
		 * Get all of the projects with lazy loading
		 */
		const projectPrefix =
			tab === "Mine" ? "MyProjects" : "MyDiscoverableProjects";

		const getProjects = useIteratorPixel<Project[], Project>(
			(limit, offset) => {
				if (tab === "System") {
					return "";
				}

				return `${projectPrefix}(metaKeys = ${JSON.stringify(
					metaKeysDescription,
				)}, metaFilters=[${JSON.stringify(
					metaFilters,
				)}], filterWord=["${debouncedSearch}"], sort=[{"${sortValue}" : "${sortOrder}"}], ${pixelFilter}, limit=[${limit}], offset=[${offset}]);`;
			},
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
				tab,
				debouncedSearch,
				sortValue,
				sortOrder,
				JSON.stringify(metaFilters),
			],
		);

		const { setScroll, resetScroll } = useInfiniteScroll({
			disabled:
				tab === "System" ||
				getProjects.isLoading ||
				!getProjects.hasMore,
			onNext: () => {
				getProjects.next();
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
			if (!type) {
				return;
			}

			setSearch("");
			setMetaFilters({});
			setSortValue("PROJECTNAME");
			setSortOrder("ASC");
			setGridStyle("LIST");
			resetScroll();
		}, [type, resetScroll]);

		/**
		 * @name setGlobal
		 * @param project
		 */
		const setGlobal = async (project: Project) => {
			try {
				await setProjectGlobal(
					false,
					project.project_id,
					!project.project_global,
				);

				// reset it
				getProjects.reset();
				getFavoriteProjects.refresh();
			} catch (error) {
				console.error(error);
				toast.error("Error updating global status");
			}
		};

		/**
		 * @name setFavorite
		 * @param project
		 */
		const setFavorite = async (project: Project) => {
			// check if is favorited
			const updatedFavorite = !(project.project_favorite === 1);

			try {
				await setProjectFavorite(project.project_id, updatedFavorite);

				// reset and refresh it
				resetScroll();
				getFavoriteProjects.refresh();
				getProjects.reset();
			} catch (error) {
				console.error(error);
				toast.error("Error updating favorite status");
			}
		};

		/**
		 * @name openInfo
		 * @param project
		 */
		const openInfo = async (project: Project) => {
			window.open(`#${config.basePath}/${project.project_id}`, "_blank");
		};

		/**
		 * @name deleteProject
		 * @desc confirm deleting a project
		 */
		const deleteProject = async () => {
			if (!projectToDelete) {
				return;
			}

			try {
				setIsDeletingProject(true);

				const response = await configStore.runPixel(
					`DeleteProject(project=['${projectToDelete.project_id}']);`,
				);

				const operationType =
					response.pixelReturn?.[0]?.operationType || "";
				const output = response.pixelReturn?.[0]?.output;

				if (operationType.indexOf("ERROR") === -1) {
					toast.success(
						`Successfully deleted ${projectToDelete.project_display_name || projectToDelete.project_name}`,
					);
					resetScroll();
					getFavoriteProjects.refresh();
					getProjects.reset();
					setFilterKey((prev) => prev + 1);
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

		/**
		 * Handle delete request
		 */
		const handleDeleteRequest = (project: Project) => {
			setProjectToDelete(project);
		};

		// filter out the bookmarked
		const nonBookmarked = getProjects.data.filter(
			(db) => db.project_favorite !== 1,
		);

		// filter out system mode
		const filteredSystemApps = SYSTEM_APPS.filter((app) =>
			app.name.toLowerCase().includes(search.toLowerCase()),
		);

		return (
			<>
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
				<CatalogLayout
					title={`${config.name} Catalog`}
					description={config.description}
					headerActions={
						configStore.isEngineOperationAvailable(
							"PROJECT",
							"add",
						) ? (
							<Button
								variant="default"
								aria-label={`Add ${config.name}`}
								data-testid="ProjectPage-create-new-app-btn"
								asChild
							>
								<Link to={config.createPath}>
									<Plus className="size-4" />
									Add {config.name}
								</Link>
							</Button>
						) : null
					}
					searchBar={
						<CatalogSearchBar
							search={search}
							onSearchChange={setSearch}
							placeholder="Search"
							sortValue={sortValue}
							sortOrder={sortOrder}
							sortOptions={[
								{ value: "PROJECTNAME", label: "Name" },
								{ value: "DATECREATED", label: "Date Created" },
								{
									value: "DATELASTEDITED",
									label: "Date Last Edited",
								},
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
								getProjects.reset();
							}}
							showGridStyle={true}
							gridStyle={gridStyle}
							onGridStyleChange={(v) => setGridStyle(v)}
						/>
					}
					tabs={
						<CatalogTabs
							value={tab}
							onValueChange={(val) => setTab(val as TabMode)}
							tabs={[
								{
									value: "Mine",
									label: `My ${config.name}`,
									dataTestId: "ProjectPage-myApps-tab",
								},
								{
									value: "Discoverable",
									label: `Discoverable ${config.name}s`,
									dataTestId: "ProjectPage-discoverable-tab",
								},
								...(config.showSystemTab
									? [
											{
												value: "System",
												label: `System ${config.name}s`,
												dataTestId:
													"ProjectPage-systemApps-tab",
											},
										]
									: []),
							]}
						/>
					}
					filterBox={
						!configStore.store.config.adminOnlyViewMenuBarFlag &&
						configStore.isEngineOperationAvailable(
							"PROJECT",
							"add",
						) ? (
							<CatalogFilterBox
								key={filterKey}
								type={type}
								filters={
									metaFilters as Record<string, string[]>
								}
								onChange={(filters) => {
									setMetaFilters(filters);
								}}
							/>
						) : null
					}
				>
					{tab === "Mine" ? (
						<>
							{/* Loading State */}
							{getFavoriteProjects.status === "LOADING" &&
							getProjects.isLoading ? (
								<div className="flex flex-col items-center justify-center py-6">
									<Spinner className="size-4" />
								</div>
							) : null}

							{/* Bookmarked Section */}
							{getFavoriteProjects.data.length > 0 && (
								<>
									<p className="font-medium text-sm">
										Bookmarked
									</p>
									<CatalogGrid variant={gridStyle}>
										{getFavoriteProjects.data.map(
											(project) => (
												<ProjectGridItem
													key={project.project_id}
													variant={gridStyle}
													path={`${config.basePath}/${project.project_id}/${config.itemSubPath}`}
													project={project}
													isFavorited={true}
													showFavorite={true}
													showGlobal={true}
													showInfo={true}
													showClone={true}
													showDelete={isOwnerPermission(
														project.user_permission,
													)}
													onFavorite={setFavorite}
													onInfo={openInfo}
													onGlobal={setGlobal}
													onClone={setCloneModalApp}
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
										All {config.name}s
									</p>
								)}

							{/* All Items */}
							{nonBookmarked.length > 0 && (
								<CatalogGrid
									isLoading={getProjects.isLoading}
									showLoadingMore={nonBookmarked.length > 0}
									variant={gridStyle}
								>
									{nonBookmarked.map((project) => (
										<ProjectGridItem
											key={project.project_id}
											variant={gridStyle}
											path={`${config.basePath}/${project.project_id}/${config.itemSubPath}`}
											project={project}
											isFavorited={
												project.project_favorite === 1
											} // should be false
											showFavorite={true}
											showGlobal={true}
											showInfo={true}
											showClone={true}
											showDelete={isOwnerPermission(
												project.user_permission,
											)}
											onFavorite={setFavorite}
											onInfo={openInfo}
											onGlobal={setGlobal}
											onClone={setCloneModalApp}
											onDelete={handleDeleteRequest}
										/>
									))}
								</CatalogGrid>
							)}

							{/* Empty State */}
							{!getProjects.isLoading &&
								getFavoriteProjects.status !== "LOADING" &&
								nonBookmarked.length === 0 &&
								getFavoriteProjects.data.length === 0 && (
									<div className="w-full px-2 py-4 text-center">
										<Muted>No results found</Muted>
									</div>
								)}
						</>
					) : null}
					{tab === "Discoverable" ? (
						<>
							{/* Loading State */}
							{getProjects.isLoading ? (
								<div className="flex flex-col items-center justify-center py-6">
									<Spinner className="size-4" />
								</div>
							) : null}

							{/* All Items */}
							{getProjects.data.length > 0 && (
								<CatalogGrid
									isLoading={getProjects.isLoading}
									showLoadingMore={
										getProjects.data.length > 0
									}
									variant={gridStyle}
								>
									{getProjects.data.map((project) => (
										<ProjectGridItem
											key={project.project_id}
											variant={gridStyle}
											path={`${config.basePath}/${project.project_id}`}
											project={project}
											isFavorited={
												project.project_favorite === 1
											}
											showFavorite={false}
											showGlobal={isOwnerPermission(
												project.user_permission,
											)}
											showInfo={false}
											showClone={isOwnerPermission(
												project.user_permission,
											)}
											showDelete={isOwnerPermission(
												project.user_permission,
											)}
											onFavorite={setFavorite}
											onInfo={openInfo}
											onGlobal={setGlobal}
											onClone={setCloneModalApp}
											onDelete={handleDeleteRequest}
										/>
									))}
								</CatalogGrid>
							)}

							{/* Empty State */}
							{!getProjects.isLoading &&
								getProjects.data.length === 0 && (
									<div className="w-full px-2 py-4 text-center">
										<Muted>No results found</Muted>
									</div>
								)}
						</>
					) : null}
					{tab === "System" && (
						<CatalogGrid variant={gridStyle}>
							{filteredSystemApps.length > 0 ? (
								filteredSystemApps.map((project) => (
									<SystemAppGridItem
										key={project.id}
										id={project.id}
										name={project.name}
										description={project.description}
										href={project.href}
										gridStyle={gridStyle}
									/>
								))
							) : (
								<div className="w-full px-2 py-4 text-center">
									<Muted>No results found</Muted>
								</div>
							)}
						</CatalogGrid>
					)}
					<Help />
				</CatalogLayout>

				{/* Clone Modal */}
				{cloneModalApp && (
					<AddAppCloneModal
						open={Boolean(cloneModalApp)}
						appId={cloneModalApp.project_id}
						handleClose={(appId) => {
							setCloneModalApp(null);
							if (appId) {
								setFilterKey((prev) => prev + 1);
								resetScroll();
								getProjects.reset();
								getFavoriteProjects.refresh();
							}
						}}
					/>
				)}

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
						""
					}
					entityId={projectToDelete?.project_id || ""}
					onConfirm={deleteProject}
					isLoading={isDeletingProject}
				/>
			</>
		);
	},
);
