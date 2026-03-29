import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { EngineLandscapeCard } from "@/components/engine";
import { DeleteEntityDialog } from "@/components/shared/delete-entity-dialog";
import { usePixel, useRootStore, useSettings } from "@/hooks";

const initialState = {
	projects: [],
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
			return {
				...state,
				projects: [...state.projects, ...action.value],
			};
		}
	}
	return state;
};

export interface ProjectInterface {
	project_global?: boolean | string | number;
	project_id?: string;
	project_name?: string;
	project_display_name?: string;
	project_date_created?: string;
	project_date_last_edited?: string;
	project_permission?: number | string;
	project_user_permission?: number | string;
	app_global?: boolean | string | number;
	app_id?: string;
	app_name?: string;
	app_display_name?: string;
	app_date_created?: string;
	app_date_last_edited?: string;
	app_permission?: number | string;
	app_user_permission?: number | string;
	app_tag?: string[] | string;
	app_description?: string;
	permission?: number | string;
	user_permission?: number | string;
	tag?: string[] | string;
	description?: string;
}

export const ProjectSettingsPage = () => {
	const { adminMode } = useSettings();
	const { configStore, monolithStore } = useRootStore();
	const navigate = useNavigate();
	const [state, dispatch] = useReducer(reducer, initialState);
	const { projects } = state;

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sortKey, setSortKey] = useState("PROJECTNAME");
	const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
	const [canCollect, setCanCollect] = useState(true);
	const [offset, setOffset] = useState(0);
	const [isSearching, setIsSearching] = useState(false);
	const [isDeletingApp, setIsDeletingApp] = useState(false);
	const [appToDelete, setAppToDelete] = useState<{
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

	const projectMetaKeys = configStore.store.config.projectMetaKeys.filter(
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

	const metaKeys = projectMetaKeys.map((k) => {
		return k.metakey;
	});

	const projectPixelPrefix = adminMode ? "AdminMyProjects" : "MyProjects";

	const getProjects = usePixel<ProjectInterface[]>(
		`
        ${projectPixelPrefix}(metaKeys = ${JSON.stringify(
			metaKeys,
		)}, filterWord=["${debouncedSearch}"], sort=[{"${sortKey}" : "${sortOrder}"}], limit=[${limit}], offset=[${offset}]);
        `,
		{
			data: [],
		},
	);

	const formatProjectName = (str?: string) => {
		if (!str) {
			return "Untitled App";
		}
		return str
			.split("_")
			.map((frag) => {
				return frag.charAt(0).toUpperCase() + frag.slice(1);
			})
			.join(" ");
	};

	const getProjectId = (project: ProjectInterface) => {
		return project.project_id || project.app_id || "";
	};

	const getProjectDisplayName = (project: ProjectInterface) => {
		return (
			project.project_display_name ||
			project.app_display_name ||
			formatProjectName(project.project_name || project.app_name)
		);
	};

	const getProjectCreatedDate = (project: ProjectInterface) => {
		return project.project_date_created || project.app_date_created;
	};

	const getProjectGlobal = (project: ProjectInterface) => {
		return project.project_global ?? project.app_global ?? false;
	};

	const getProjectPermission = (project: ProjectInterface) => {
		return (
			project.permission ||
			project.project_permission ||
			project.project_user_permission ||
			project.app_permission ||
			project.app_user_permission ||
			project.user_permission
		);
	};

	const getProjectTags = (project: ProjectInterface) => {
		return project.tag || project.app_tag;
	};

	const getProjectDescription = (project: ProjectInterface) => {
		return project.description || project.app_description || "";
	};

	const isOwnerPermission = (permission?: number | string | null) => {
		return permission === 1 || permission === "OWNER";
	};

	const isGlobalProject = (value: ProjectInterface["project_global"]) => {
		return (
			value === true || value === "true" || value === 1 || value === "1"
		);
	};

	const escapePixelString = (value: string) => {
		return value.replaceAll("'", "\\'");
	};

	const deleteApp = async () => {
		if (!appToDelete) {
			return;
		}

		try {
			setIsDeletingApp(true);

			const response = await monolithStore.runQuery(
				`DeleteProject(project=['${escapePixelString(appToDelete.id)}']);`,
			);

			const operationType =
				response.pixelReturn?.[0]?.operationType || "";
			const output = response.pixelReturn?.[0]?.output;

			if (operationType.indexOf("ERROR") === -1) {
				dispatch({
					type: "field",
					field: "projects",
					value: projects.filter(
						(project) => getProjectId(project) !== appToDelete.id,
					),
				});
				toast.success(`Successfully deleted ${appToDelete.name}`);
			} else {
				toast.error(String(output || "Failed to delete app"));
			}
		} catch (error) {
			toast.error(String(error));
		} finally {
			setIsDeletingApp(false);
			setAppToDelete(null);
		}
	};

	const resetKey = `${adminMode}-${debouncedSearch}-${sortKey}-${sortOrder}`;

	//** reset dataMode if adminMode is toggled */
	useEffect(() => {
		void resetKey;
		setOffset(0);
		setCanCollect(true);
		dispatch({
			type: "field",
			field: "projects",
			value: [],
		});
	}, [resetKey]);

	//** append data through infinite scroll */
	useEffect(() => {
		if (getProjects.status !== "SUCCESS") {
			return;
		}

		const loadedProjects = getProjects.data || [];

		if (loadedProjects.length < limit) {
			setCanCollect(false);
		} else {
			if (!canCollectRef.current) {
				setCanCollect(true);
			}
		}

		dispatch({
			type: "append",
			value: loadedProjects,
		});

		searchbarRef.current?.focus();
	}, [getProjects.status, getProjects.data]);

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

	return (
		<>
			{(getProjects.status === "LOADING" || isSearching) && (
				<div className="fixed inset-0 z-[1501] flex items-center justify-center bg-white/50">
					<div className="flex flex-col items-center gap-1">
						<Spinner />
						<p className="text-sm">
							{isSearching ? "Searching" : "Loading"}
						</p>
						<p className="text-muted-foreground text-xs">
							Projects
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
							placeholder="Project"
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
								value={sortKey}
								onValueChange={(value) => setSortKey(value)}
							>
								<SelectTrigger
									className="h-9 w-full"
									aria-label="Sort By"
								>
									<SelectValue placeholder="Sort By" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="PROJECTNAME">
										Name
									</SelectItem>
									<SelectItem value="DATECREATED">
										Date Created
									</SelectItem>
									<SelectItem value="DATELASTEDITED">
										Date Last Edited
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
								data-testid="projectSettingsPage-asc-btn"
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
								data-testid="projectSettingsPage-desc-btn"
								onClick={() => setSortOrder("DESC")}
							>
								<ArrowDown className="size-4" />
							</Button>
						</div>
					</div>
				</div>

				<div className="flex w-full flex-col gap-2">
					{projects.length === 0 &&
					getProjects.status === "SUCCESS" &&
					debouncedSearch ? (
						<div className="py-4 text-center text-muted-foreground text-sm">
							No projects found matching "{debouncedSearch}"
						</div>
					) : null}

					{projects.length
						? projects.map((project) => {
								const projectId = getProjectId(project);
								const projectName =
									getProjectDisplayName(project);
								const projectPermission =
									getProjectPermission(project);
								const projectIsGlobal = isGlobalProject(
									getProjectGlobal(project),
								);

								if (!projectId) {
									return null;
								}

								return (
									<div key={projectId}>
										<EngineLandscapeCard
											name={projectName}
											id={projectId}
											type={"PROJECT"}
											forceFolderIcon={true}
											desktopInlineMeta={true}
											tag={getProjectTags(project)}
											date={getProjectCreatedDate(
												project,
											)}
											owner={"N/A"}
											description={getProjectDescription(
												project,
											)}
											isGlobal={projectIsGlobal}
											isDiscoverable={true}
											hideFavorite={true}
											onDelete={
												adminMode ||
												isOwnerPermission(
													projectPermission,
												)
													? () => {
															setAppToDelete({
																id: projectId,
																name: projectName,
															});
														}
													: undefined
											}
											onClick={() => {
												navigate(`${projectId}`, {
													state: {
														name: projectName,
														global: projectIsGlobal,
														permission:
															projectPermission ||
															3,
													},
												});
											}}
										/>
									</div>
								);
							})
						: getProjects.status === "SUCCESS" &&
							!debouncedSearch && (
								<div className="py-4 text-muted-foreground text-sm">
									No apps to choose from
								</div>
							)}
				</div>
			</div>
			<DeleteEntityDialog
				open={Boolean(appToDelete)}
				onOpenChange={(open) => {
					if (!open) {
						setAppToDelete(null);
					}
				}}
				entityType="App"
				entityName={appToDelete?.name}
				entityId={appToDelete?.id}
				onConfirm={deleteApp}
				isLoading={isDeletingApp}
			/>
		</>
	);
};
