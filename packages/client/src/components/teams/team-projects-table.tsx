import type { AxiosResponse } from "axios";
import { Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@semoss/ui/next";
import {
	addProject,
	deleteProjectPermission,
	editProjectPermisison,
	getNumProjectsForGroup,
	getTeamProjects,
	getUnassignedTeamProjects,
} from "@/api";
import codeApp2 from "@/assets/img/code_app_2.png";
import codeApp3 from "@/assets/img/code_app_3.png";
import codeApp4 from "@/assets/img/code_app_4.png";
import codeApp5 from "@/assets/img/code_app_5.png";
import type { SETTINGS_ROLE } from "@/components/settings/settings.types";
import { useServerPagination } from "@/hooks";

const colors = [
	"#22A4FF",
	"#FA3F20",
	"#FA3F20",
	"#FF9800",
	"#FF9800",
	"#22A4FF",
	"#4CAF50",
];

const projectImages = [codeApp2, codeApp3, codeApp4, codeApp5];

// maps for permissions,
const permissionMapper = {
	Author: 1, // BE: 'DISPLAY'
	Editor: 2, // BE: 'DISPLAY'
	"Read-Only": 3, // DISPLAY: BE
};

const permissionOptions: {
	label: SETTINGS_ROLE;
	description: string;
	value: string;
}[] = [
	{
		label: "Author",
		description:
			"Ability to edit the model connection details, set the model as discoverable, provision other authors, and all editor abilities.",
		value: "Author",
	},
	{
		label: "Editor",
		description:
			"Ability to edit the model details, provision other users as editors and read only users, and all read only abilities.",
		value: "Editor",
	},
	{
		label: "Read-Only",
		description: "Ability to view model details and usage instructions.",
		value: "Read-Only",
	},
];

interface ProjectsTableProps {
	/**
	 * Id of the setting
	 */
	groupId: string;

	/**
	 * group type
	 */
	groupType: string;

	name: string;
}

interface TeamProjects {
	low_project_name: string;
	project_cost: string;
	project_created_by: string;
	project_created_by_type: string;
	project_date_created: string;
	project_discoverable: boolean;
	project_global: boolean;
	project_has_portal: boolean;
	project_id: string;
	project_name: string;
	project_portal_name: string;
	project_type: string;
	projectid?: string;
	type?: string;
	permission?: string;
	color?: string;
}

export const TeamProjectsTable = (props: ProjectsTableProps) => {
	const { groupId, groupType } = props;

	const AUTOCOMPLETE_LIMIT = 10;
	const AUTOCOMPLETE_OFFSET = 0;

	/** Project Table State */
	const [selectedProjects, setSelectedProojects] = useState<TeamProjects[]>(
		[],
	);
	const [count, setCount] = useState(0);

	/** Delete Project */
	const [deleteProjectsModal, setDeleteProjectsModal] =
		useState<boolean>(false);
	const [deleteProjectModal, setDeleteProjectModal] =
		useState<boolean>(false);
	const [projectToDelete, setProjectToDelete] = useState<TeamProjects | null>(
		null,
	);

	/** Add Project State */
	const [addProjectModal, setAddProjectModal] = useState<boolean>(false);
	const [nonCredentialedProjects, setNonCredentialedProjects] = useState<
		TeamProjects[]
	>([]);
	const [
		selectedNonCredentialedProjects,
		setSelectedNonCredentialedProjects,
	] = useState<TeamProjects[]>([]);
	const [addProjectRole, setAddProjectRole] = useState<SETTINGS_ROLE>();

	const [projects, setProjects] = useState<TeamProjects[]>([]);
	const [projectCount, setProjectCount] = useState(0);
	const [totalProjectsAll, setTotalProjectsAll] = useState(0);
	const [hasProjects, setHasProject] = useState(false);

	const [searchProjectInput, setSearchProjectInput] = useState<string>("");
	const [offset, setOffset] = useState(AUTOCOMPLETE_OFFSET);
	const [isScrollBottom, setIsScrollBottom] = useState(false);
	const [canCollect, setCanCollect] = useState<boolean>(true);
	const [_isLoading, setIsLoading] = useState<boolean>(false);
	const [searchLoading, setSearchLoading] = useState(false);

	const [projectImageMap, setProjectImageMap] = useState<
		Record<string, string>
	>({});

	const [searchFilter, setSearchFilter] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const isLoadingRef = useRef(false);

	const {
		page: projectsPage,
		rowsPerPage,
		setPage: setProjectsPage,
		setRowsPerPage,
		offset: pageOffset,
		totalPages,
		startRow,
		endRow,
	} = useServerPagination({
		totalCount: projectCount,
		initialRowsPerPage: 5,
		pageIndexBase: 1,
	});

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchFilter);
		}, 400);
		return () => clearTimeout(timer);
	}, [searchFilter]);

	const nearBottom = (
		target: {
			scrollHeight?: number;
			scrollTop?: number;
			clientHeight?: number;
		} = {},
	) => {
		const diff = Math.round(target.scrollHeight - target.scrollTop);
		return diff - 25 <= target.clientHeight;
	};

	const getProjects = useCallback(
		async (reset: boolean, nextOffset: number, nextSearch: string) => {
			if (isLoadingRef.current) {
				return;
			}
			isLoadingRef.current = true;
			setIsLoading(true);
			try {
				const response = await getUnassignedTeamProjects(
					groupId,
					groupType,
					AUTOCOMPLETE_LIMIT,
					nextOffset,
					nextSearch,
				);

				if (response) {
					const projects = (
						response as unknown as TeamProjects[]
					)?.map((val) => {
						return {
							...val,
							color: colors[
								Math.floor(Math.random() * colors.length)
							],
						};
					});

					setNonCredentialedProjects((prev) =>
						reset ? projects : prev.concat(projects),
					);
					setCanCollect(projects.length === AUTOCOMPLETE_LIMIT);
					setSearchLoading(false);
				}
			} catch (e) {
				toast.error(String(e));
				setSearchLoading(false);
			} finally {
				isLoadingRef.current = false;
				setIsLoading(false);
			}
		},
		[groupId, groupType],
	);

	const filterProjects = useCallback(() => {
		getTeamProjects(
			groupId,
			groupType,
			rowsPerPage,
			pageOffset, // offset
			debouncedSearch,
			false,
		).then((data: unknown[]) => {
			setProjects(data as TeamProjects[]);
			setHasProject(data.length > 0);
		});
	}, [
		groupId,
		groupType,
		projectsPage,
		debouncedSearch,
		rowsPerPage,
		pageOffset,
	]);

	useEffect(() => {
		if (count >= 0) {
			filterProjects();
		}
	}, [filterProjects, count]);

	useEffect(() => {
		const refreshToken = count;
		if (refreshToken < 0 || !groupId) {
			return;
		}
		const trimmed = debouncedSearch.trim();
		getNumProjectsForGroup(groupId, groupType, trimmed || undefined)
			.then((nextCount) => {
				if (trimmed) {
					setProjectCount(nextCount);
				} else {
					setTotalProjectsAll(nextCount);
					setProjectCount(nextCount);
				}
			})
			.catch((e) => {
				toast.error(String(e));
				if (trimmed) {
					setProjectCount(0);
				} else {
					setTotalProjectsAll(0);
					setProjectCount(0);
				}
			});
	}, [groupId, groupType, debouncedSearch, count]);

	useEffect(() => {
		if (!addProjectModal) {
			return;
		}
		if (isScrollBottom) {
			if (canCollect) {
				setOffset((prev) => prev + AUTOCOMPLETE_LIMIT);
			}
		}
	}, [addProjectModal, isScrollBottom, canCollect]);

	useEffect(() => {
		if (!addProjectModal) {
			return;
		}
		if (searchProjectInput) {
			setSearchLoading(true);
		}
		const timer = setTimeout(() => {
			if (!offset) {
				getProjects(true, 0, searchProjectInput);
			} else {
				if (canCollect) {
					getProjects(false, offset, searchProjectInput);
				}
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [addProjectModal, offset, searchProjectInput, canCollect, getProjects]);

	const submitNonGroupProjects = async () => {
		try {
			const requests = selectedNonCredentialedProjects.map((m) => {
				return {
					project_id: m.project_id,
					permission: permissionMapper[addProjectRole],
				};
			});

			if (requests.length === 0) {
				toast.warning("No apps to add");
				return;
			}

			for (let i = 0; i < requests.length; i++) {
				let response:
					| AxiosResponse<{ success: boolean }>
					| {
							response: Response;
							data: {
								success: boolean;
							};
					  }
					| null = null;
				response = await addProject(
					groupId,
					requests[i].project_id,
					requests[i].permission,
					groupType,
				);

				if (!response) {
					return;
				}

				if (response.data) {
					setAddProjectModal(false);
					setSelectedNonCredentialedProjects([]);
					toast.success("Successfully added app permissions");
				} else {
					toast.error("Error changing app permissions");
				}
			}
		} catch (e) {
			setAddProjectModal(false);
			setSelectedNonCredentialedProjects([]);
			toast.error(String(e));
		} finally {
			setCount((prev) => prev + 1);
			setOffset(0);
		}
	};

	const deleteProject = async (project: TeamProjects) => {
		try {
			let response:
				| AxiosResponse<{ success: boolean }>
				| {
						response: Response;
						data: {
							success: boolean;
						};
				  }
				| null = null;
			response = await deleteProjectPermission(groupId, groupType, {
				projectid: project.projectid ?? project.project_id,
				group_type: groupType,
			});

			if (!response) {
				return;
			}

			toast.success("Successfully removed app");
		} catch (e) {
			toast.error(String(e));
		} finally {
			setDeleteProjectModal(false);
			setCount((prev) => prev + 1);
		}
	};

	const deleteProjects = async () => {
		try {
			for (let i = 0; i < selectedProjects.length; i++) {
				try {
					let response:
						| AxiosResponse<{ success: boolean }>
						| {
								response: Response;
								data: {
									success: boolean;
								};
						  }
						| null = null;
					response = await deleteProjectPermission(
						groupId,
						groupType,
						{
							projectid:
								selectedProjects[i].projectid ??
								selectedProjects[i].project_id,
							group_type: groupType,
						},
					);

					if (!response) {
						return;
					}
				} catch (e) {
					toast.error(String(e));
				} finally {
					setDeleteProjectModal(false);
				}
			}
		} finally {
			toast.success("Successfully removed apps");
			setCount((prev) => prev + 1);
			setDeleteProjectsModal(false);
			setSelectedProojects([]);
		}
	};

	const updateSelectedProjects = async (project) => {
		try {
			if (!project.projectid) {
				toast.warning("No permissions to change");
				return;
			}

			let response:
				| AxiosResponse<{ success: boolean }>
				| {
						response: Response;
						data: {
							success: boolean;
						};
				  }
				| null = null;
			response = await editProjectPermisison(groupId, groupType, project);

			if (!response) {
				return;
			}

			if (response.data) {
				setProjects((prev) =>
					prev.map((item) =>
						item.projectid === project.projectid ||
						item.project_id === project.projectid
							? { ...item, permission: project.permission }
							: item,
					),
				);
				toast.success("Successfully updated permissions");
			} else {
				toast.error("Error changing permissions");
			}
		} catch (e) {
			toast.error(String(e));
		}
	};

	const handleInputChange = (newInputValue) => {
		setSearchFilter(newInputValue);
	};

	const getRandomImageForProject = useCallback(
		(projectId: string) => {
			if (projectImageMap[projectId]) {
				return projectImageMap[projectId];
			}
			const randomIndex = Math.floor(
				Math.random() * projectImages.length,
			);
			const newImage = projectImages[randomIndex];

			if (!projectImageMap[projectId]) {
				setProjectImageMap((prev) => ({
					...prev,
					[projectId]: newImage,
				}));
			}

			return newImage;
		},
		[projectImageMap],
	);

	const isAllSelected =
		selectedProjects.length === projects.length && projects.length > 0;

	return (
		<div className="flex w-full flex-col gap-6">
			{(projects && projects.length > 0) ||
			projectCount > 0 ||
			hasProjects ||
			searchFilter ? (
				<Card>
					<CardHeader className="flex flex-col gap-4">
						<div className="flex flex-wrap items-center gap-3">
							<CardTitle>Apps</CardTitle>
							<span className="text-muted-foreground text-sm">
								{debouncedSearch.trim()
									? `${projectCount} of ${totalProjectsAll} Apps`
									: `${totalProjectsAll} Apps`}
							</span>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<InputGroup className="w-full sm:max-w-sm">
								<InputGroupAddon>
									<Search className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									placeholder="Search Apps"
									value={searchFilter}
									onChange={(e) => {
										handleInputChange(e.target.value);
									}}
								/>
							</InputGroup>
							<div className="flex items-center gap-2 sm:flex-nowrap">
								<Button
									className="shrink-0"
									onClick={() => {
										setAddProjectRole(undefined);
										setOffset(0);
										setNonCredentialedProjects([]);
										setSearchProjectInput("");
										setAddProjectModal(true);
									}}
								>
									<Plus className="size-4" />
									Add Apps
								</Button>
								{selectedProjects.length > 0 && (
									<Button
										variant="outline"
										className="whitespace-nowrap border-destructive text-destructive hover:bg-destructive/10"
										onClick={() =>
											setDeleteProjectsModal(true)
										}
									>
										<Trash2 className="size-4" />
										Delete Selected
									</Button>
								)}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-12">
											<div className="flex justify-center">
												<Checkbox
													checked={isAllSelected}
													onCheckedChange={() => {
														if (!isAllSelected) {
															setSelectedProojects(
																projects,
															);
														} else {
															setSelectedProojects(
																[],
															);
														}
													}}
												/>
											</div>
										</TableHead>
										<TableHead>Name</TableHead>
										<TableHead className="w-[220px]">
											Access
										</TableHead>
										<TableHead className="w-[180px]">
											Added Date
										</TableHead>
										<TableHead className="text-right">
											Action
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{Array.isArray(projects) &&
									projects.length > 0 ? (
										projects.map((project) => {
											const projectId =
												project.projectid ??
												project.project_id;
											const projectKey =
												projectId ??
												project.project_name ??
												project.project_portal_name;
											const isSelected =
												selectedProjects.some(
													(value) =>
														value.projectid ===
															projectId ||
														value.project_id ===
															projectId,
												);
											return (
												<TableRow
													key={`project-${projectKey}`}
												>
													<TableCell className="w-12">
														<div className="flex justify-center">
															<Checkbox
																checked={
																	isSelected
																}
																onCheckedChange={() => {
																	if (
																		isSelected
																	) {
																		setSelectedProojects(
																			selectedProjects.filter(
																				(
																					p,
																				) =>
																					p.projectid !==
																						projectId &&
																					p.project_id !==
																						projectId,
																			),
																		);
																	} else {
																		setSelectedProojects(
																			[
																				...selectedProjects,
																				project,
																			],
																		);
																	}
																}}
															/>
														</div>
													</TableCell>
													<TableCell>
														<div className="min-w-0">
															<div className="truncate font-medium text-sm">
																{
																	project.project_name
																}
															</div>
															<div className="text-muted-foreground text-xs">
																{`App ID: ${projectId}`}
															</div>
														</div>
													</TableCell>
													<TableCell>
														<Select
															value={String(
																project.permission ??
																	"3",
															)}
															onValueChange={(
																value,
															) => {
																updateSelectedProjects(
																	{
																		projectid:
																			projectId,
																		type: project.type,
																		project_type:
																			project.type,
																		permission:
																			value,
																	},
																);
															}}
														>
															<SelectTrigger className="h-8 w-[150px]">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="1">
																	Author
																</SelectItem>
																<SelectItem value="2">
																	Editor
																</SelectItem>
																<SelectItem value="3">
																	Read-Only
																</SelectItem>
															</SelectContent>
														</Select>
													</TableCell>
													<TableCell className="whitespace-nowrap text-sm">
														{
															project.project_date_created
														}
													</TableCell>
													<TableCell className="text-right">
														<Button
															variant="ghost"
															size="icon-sm"
															onClick={() => {
																setProjectToDelete(
																	project,
																);
																setDeleteProjectModal(
																	true,
																);
															}}
														>
															<Trash2 className="size-4" />
														</Button>
													</TableCell>
												</TableRow>
											);
										})
									) : (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center"
											>
												No Apps found.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
								<TableFooter>
									<TableRow>
										<TableCell colSpan={5}>
											<div className="flex flex-wrap items-center justify-end gap-4">
												<div className="flex items-center gap-2 text-sm">
													<span>Rows per page:</span>
													<Select
														value={String(
															rowsPerPage,
														)}
														onValueChange={(
															value,
														) => {
															setRowsPerPage(
																parseInt(
																	value,
																	10,
																),
															);
														}}
													>
														<SelectTrigger className="h-8 w-[70px]">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{[5, 10, 20].map(
																(val) => (
																	<SelectItem
																		key={`rows-${val}`}
																		value={String(
																			val,
																		)}
																	>
																		{val}
																	</SelectItem>
																),
															)}
														</SelectContent>
													</Select>
												</div>
												<div className="text-muted-foreground text-sm">
													{startRow}-{endRow} of{" "}
													{projectCount}
												</div>
												<div className="flex gap-1">
													<Button
														variant="outline"
														size="icon-sm"
														onClick={() =>
															setProjectsPage(1)
														}
														disabled={
															projectsPage === 1
														}
													>
														{"<<"}
													</Button>
													<Button
														variant="outline"
														size="icon-sm"
														onClick={() =>
															setProjectsPage(
																Math.max(
																	1,
																	projectsPage -
																		1,
																),
															)
														}
														disabled={
															projectsPage === 1
														}
													>
														{"<"}
													</Button>
													<Button
														variant="outline"
														size="icon-sm"
														onClick={() =>
															setProjectsPage(
																Math.min(
																	totalPages,
																	projectsPage +
																		1,
																),
															)
														}
														disabled={
															projectsPage >=
															totalPages
														}
													>
														{">"}
													</Button>
													<Button
														variant="outline"
														size="icon-sm"
														onClick={() =>
															setProjectsPage(
																totalPages,
															)
														}
														disabled={
															projectsPage >=
															totalPages
														}
													>
														{">>"}
													</Button>
												</div>
											</div>
										</TableCell>
									</TableRow>
								</TableFooter>
							</Table>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>Apps</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center">
							<p className="text-muted-foreground text-sm">
								No apps present
							</p>
							<Button
								onClick={() => {
									setOffset(0);
									setNonCredentialedProjects([]);
									setSearchProjectInput("");
									setAddProjectModal(true);
								}}
							>
								<Plus className="size-4" />
								Add Apps
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<Dialog
				open={addProjectModal}
				onOpenChange={(open) => {
					if (!open) {
						setAddProjectModal(false);
						setOffset(0);
						setNonCredentialedProjects([]);
						setSelectedNonCredentialedProjects([]);
						setSearchProjectInput("");
					} else {
						setAddProjectModal(true);
					}
				}}
			>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Add Apps</DialogTitle>
						<DialogDescription>
							Select apps and assign an access level.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-4">
						<InputGroup>
							<InputGroupAddon>
								<Search className="size-4" />
							</InputGroupAddon>
							<InputGroupInput
								placeholder="Search apps"
								value={searchProjectInput}
								onChange={(e) => {
									setSearchProjectInput(e.target.value);
									setOffset(0);
								}}
							/>
						</InputGroup>
						<div
							className="max-h-[280px] overflow-auto rounded-md border p-2"
							onScroll={({ currentTarget }) =>
								setIsScrollBottom(nearBottom(currentTarget))
							}
						>
							{nonCredentialedProjects.length === 0 ? (
								<p className="p-4 text-center text-muted-foreground text-sm">
									{searchLoading
										? "Loading apps..."
										: "No apps found"}
								</p>
							) : (
								nonCredentialedProjects.map((project) => {
									const isSelected =
										selectedNonCredentialedProjects.some(
											(value) =>
												value.project_id ===
												project.project_id,
										);
									return (
										<div
											key={project.project_id}
											className="flex items-center gap-3 rounded-md p-3 hover:bg-muted/50"
										>
											<Checkbox
												checked={isSelected}
												onCheckedChange={() => {
													if (isSelected) {
														setSelectedNonCredentialedProjects(
															selectedNonCredentialedProjects.filter(
																(p) =>
																	p.project_id !==
																	project.project_id,
															),
														);
													} else {
														setSelectedNonCredentialedProjects(
															[
																...selectedNonCredentialedProjects,
																project,
															],
														);
													}
												}}
											/>
											<Avatar className="h-8 w-8">
												<AvatarImage
													src={getRandomImageForProject(
														project.project_id,
													)}
												/>
												<AvatarFallback className="text-xs">
													{project.project_name
														? project
																.project_name[0]
														: "A"}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1">
												<div className="font-medium text-sm">
													{project.project_name}
												</div>
												<div className="text-muted-foreground text-xs">
													App ID: {project.project_id}
												</div>
											</div>
										</div>
									);
								})
							)}
						</div>
						{selectedNonCredentialedProjects.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{selectedNonCredentialedProjects.map(
									(project) => (
										<Badge
											key={`selected-${project.project_id}`}
											variant="secondary"
											className="flex items-center gap-1"
										>
											{project.project_name}
											<button
												type="button"
												className="rounded-full p-0.5 hover:bg-muted"
												onClick={() => {
													setSelectedNonCredentialedProjects(
														selectedNonCredentialedProjects.filter(
															(p) =>
																p.project_id !==
																project.project_id,
														),
													);
												}}
											>
												<X className="size-3" />
											</button>
										</Badge>
									),
								)}
							</div>
						) : null}
						<div className="rounded-md border bg-muted/40 p-3">
							<p className="font-medium text-sm">App access</p>
							<div className="mt-3 grid gap-3">
								<RadioGroup
									value={addProjectRole}
									onValueChange={(value) => {
										setAddProjectRole(
											value as SETTINGS_ROLE,
										);
									}}
								>
									{permissionOptions.map((option) => (
										<div
											key={option.value}
											className="flex items-center gap-3 rounded-md border bg-background p-3"
										>
											<RadioGroupItem
												value={option.value}
											/>
											<div>
												<p className="font-medium text-sm">
													{option.label}
												</p>
												<p className="text-muted-foreground text-xs">
													{option.description}
												</p>
											</div>
										</div>
									))}
								</RadioGroup>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setAddProjectModal(false);
								setOffset(0);
								setNonCredentialedProjects([]);
							}}
						>
							Cancel
						</Button>
						<Button
							disabled={
								selectedNonCredentialedProjects.length < 1 ||
								!addProjectRole
							}
							onClick={() => {
								submitNonGroupProjects();
							}}
						>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteProjectModal}
				onOpenChange={setDeleteProjectModal}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Are you sure?</DialogTitle>
						<DialogDescription>
							{projectToDelete ? (
								<>
									This will remove{" "}
									<span className="font-medium text-foreground">
										{projectToDelete.project_name}
									</span>
									.
								</>
							) : (
								"This will remove the selected app."
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteProjectModal(false)}
						>
							Close
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (!projectToDelete) {
									console.error("No project to delete");
									return;
								}
								deleteProject(projectToDelete);
							}}
						>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteProjectsModal}
				onOpenChange={setDeleteProjectsModal}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Are you sure?</DialogTitle>
						<DialogDescription>
							Would you like to delete all selected apps?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteProjectsModal(false)}
						>
							Close
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								deleteProjects();
							}}
						>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
