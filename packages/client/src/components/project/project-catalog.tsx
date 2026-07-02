import { Plus } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useIteratorPixel, usePixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Button,
	Muted,
	P,
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
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import { getProjectLabel, isOwnerPermission } from "@/utility/catalog";
import { NavbarHeader, NavbarLeft } from "../shared";
import { ProjectGridItem } from "./project-grid-item";

const CATALOG_CONFIG = {
	CODE: {
		title: "Apps",
		description: "Manage and discover applications.",
		createLabel: "Create New App",
		createPath: "/app/new",
		basePath: "/app",
		itemSubPath: "view",
		pixelFilter: "onlyPortals=[true]",
		myTab: "My Apps",
		discoverableTab: "Discoverable Apps",
		systemTab: "System Apps",
		emptySystem: "No system apps found.",
		showSystemTab: true,
	},
	SKILL: {
		title: "Skills",
		description:
			"Skills are reusable capabilities that extend agent functionality through specialized tools, integrations, and workflows. Build custom skills to connect to APIs, process data, or automate complex tasks. Browse and discover skills to enhance your agents with pre-built functionality across diverse use cases.",
		createLabel: "Create New Skill",
		createPath: "/skill/new",
		basePath: "/skill",
		itemSubPath: "edit",
		pixelFilter: 'type="SKILL"',
		myTab: "My Skills",
		discoverableTab: "Discoverable Skills",
		systemTab: "System Skills",
		emptySystem: "No system skills found.",
		showSystemTab: false,
	},
	WORKSPACE: {
		title: "Agents",
		description:
			"Agents are autonomous AI assistants configured with specific skills, knowledge bases, and behavioral guidelines to accomplish complex tasks. Create agents tailored to your workflows, from customer support and data analysis to content generation and research. Manage and deploy intelligent agents that can reason, plan, and execute multi-step processes.",
		createLabel: "Create New Agent",
		createPath: "/agent/new",
		basePath: "/agent",
		itemSubPath: "edit",
		pixelFilter: 'type="WORKSPACE"',
		myTab: "My Agents",
		discoverableTab: "Discoverable Agents",
		systemTab: "System Agents",
		emptySystem: "No system agents found.",
		showSystemTab: false,
	},
} as const;

type TabMode = "Mine" | "Discoverable" | "System";

const SYSTEM_APPS: {
	project_id: string;
	project_name: string;
	description: string;
	/** External URL of the deployed system app, opened in a new tab */
	href: string;
}[] = [
	{
		project_id: "playground-system-app",
		project_name: "Playground",
		description:
			"Experiment with AI agents, tools, and MCP integrations in an interactive workspace.",
		href: "../../playground/dist/",
	},
	{
		project_id: "bi-system-app",
		project_name: "BI",
		description: "Develop dashboards and visualizations to view data",
		href: "../../legacy/dist/",
	},
	{
		project_id: "terminal-system-app",
		project_name: "Terminal",
		description: "Execute commands and see a response",
		href: "../../terminal/dist/",
	},
];

interface ProjectCatalogProps {
	type: Project["project_type"];
}

export const ProjectCatalog = observer(
	({ type }: ProjectCatalogProps): JSX.Element => {
		const config = CATALOG_CONFIG[type as keyof typeof CATALOG_CONFIG];
		const { configStore } = useRootStore();
		const navigate = useNavigate();

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

		const isSystemMode = tab === "System";
		const metaKeysDescription = [...metaKeys, "description"];

		const getFavoriteProjects = usePixel<Project[]>(
			tab === "Mine"
				? `MyProjects(metaKeys = ${JSON.stringify(
						metaKeysDescription,
					)}, metaFilters=[${JSON.stringify(
						metaFilters,
					)}], filterWord=["${debouncedSearch}"], sort=[{"${sortValue}" : "${sortOrder}"}], ${config.pixelFilter}, onlyFavorites=[true]);`
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
				if (isSystemMode) {
					return "";
				}

				return `${projectPrefix}(metaKeys = ${JSON.stringify(
					metaKeysDescription,
				)}, metaFilters=[${JSON.stringify(
					metaFilters,
				)}], filterWord=["${debouncedSearch}"], sort=[{"${sortValue}" : "${sortOrder}"}], ${config.pixelFilter}, limit=[${limit}], offset=[${offset}]);`;
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
				isSystemMode || getProjects.isLoading || !getProjects.hasMore,
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
		 * @name isFavorited
		 * @param id
		 * @desc determines if card is favorited
		 */
		const isFavorited = (projectId: string) => {
			return getFavoriteProjects.data.some(
				(p) => p.project_id === projectId,
			);
		};

		/**
		 * @name setFavorite
		 * @param project
		 */
		const setFavorite = async (project: Project) => {
			// check if is favorited
			const updatedFavorite = !isFavorited(project.project_id);

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
			(db) =>
				!getFavoriteProjects.data.some(
					(fav) => fav.project_id === db.project_id,
				),
		);

		// filter out system mode
		const filteredSystemApps = SYSTEM_APPS.filter((app) =>
			app.project_name.toLowerCase().includes(search.toLowerCase()),
		);

		return (
			<>
				<NavbarLeft>
					<NavbarHeader />
				</NavbarLeft>
				<CatalogLayout
					title={config.title}
					description={config.description}
					headerActions={
						configStore.isEngineOperationAvailable(
							"PROJECT",
							"add",
						) ? (
							<Button
								variant="default"
								onClick={() => navigate(config.createPath)}
								aria-label={config.createLabel}
								data-testid="ProjectPage-create-new-app-btn"
							>
								<Plus className="size-4" />
								{config.createLabel}
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
									label: config.myTab,
									dataTestId: "ProjectPage-myApps-tab",
								},
								{
									value: "Discoverable",
									label: config.discoverableTab,
									dataTestId: "ProjectPage-discoverable-tab",
								},
								...(config.showSystemTab
									? [
											{
												value: "System",
												label: config.systemTab,
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
					{/* Bookmarked Section */}
					{!isSystemMode &&
						tab === "Mine" &&
						getFavoriteProjects.data.length > 0 && (
							<>
								<p className="font-medium text-sm">
									Bookmarked
								</p>
								<CatalogGrid variant={gridStyle}>
									{getFavoriteProjects.data.map((project) => (
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
											infoPath={`${config.basePath}/${project.project_id}`}
											onFavorite={setFavorite}
											onGlobalToggle={setGlobal}
											onClone={setCloneModalApp}
											onDelete={handleDeleteRequest}
										/>
									))}
								</CatalogGrid>
							</>
						)}

					{/* All Section Label */}
					{!isSystemMode &&
						Object.entries(metaFilters).length === 0 &&
						getProjects.data.length > 0 &&
						nonBookmarked.length > 0 && (
							<p className="font-medium text-sm">
								All {config.title}
							</p>
						)}

					{/* All Items */}
					{!isSystemMode && getProjects.data.length > 0 && (
						<CatalogGrid
							isLoading={getProjects.isLoading}
							showLoadingMore={getProjects.data.length > 0}
							variant={gridStyle}
						>
							{nonBookmarked.map((project) => (
								<ProjectGridItem
									key={project.project_id}
									variant={gridStyle}
									path={`${config.basePath}/${project.project_id}/${config.itemSubPath}`}
									project={project}
									isFavorited={isFavorited(
										project.project_id,
									)}
									showFavorite={true}
									showGlobal={true}
									showInfo={true}
									showClone={true}
									showDelete={isOwnerPermission(
										project.user_permission,
									)}
									infoPath={`${config.basePath}/${project.project_id}`}
									onFavorite={setFavorite}
									onGlobalToggle={setGlobal}
									onClone={setCloneModalApp}
									onDelete={handleDeleteRequest}
								/>
							))}
						</CatalogGrid>
					)}

					{/* Empty State */}
					{!isSystemMode &&
						!getProjects.isLoading &&
						getProjects.data.length === 0 && (
							<div className="w-full px-2 py-4 text-center">
								<Muted>No results found</Muted>
							</div>
						)}

					{/* System */}
					{isSystemMode && (
						<CatalogGrid variant={gridStyle}>
							{filteredSystemApps.length > 0 ? (
								filteredSystemApps.map((project) => (
									<SystemAppGridItem
										key={project.project_id}
										app={project}
										href={project.href}
										gridStyle={gridStyle}
									/>
								))
							) : (
								<div className="col-span-full rounded-lg border border-dashed p-8 text-center text-muted-foreground">
									<P>{config.emptySystem}</P>
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
