import {
	Add,
	ClearRounded,
	Delete,
	EditRounded,
	RemoveRedEyeRounded,
} from "@mui/icons-material";
import type { AxiosResponse } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { debounced } from "@semoss/sdk/react";
import {
	Autocomplete,
	Avatar,
	Box,
	Button,
	Card,
	Checkbox,
	Icon,
	IconButton,
	Modal,
	RadioGroup,
	Search,
	Stack,
	styled,
	Table,
	Typography,
	useNotification,
} from "@semoss/ui";
import {
	addProject,
	deleteProjectPermission,
	editProjectPermisison,
	getTeamProjects,
	getUnassignedTeamProjects,
} from "@/api";
import codeApp2 from "@/assets/img/code_app_2.png";
import codeApp3 from "@/assets/img/code_app_3.png";
import codeApp4 from "@/assets/img/code_app_4.png";
import codeApp5 from "@/assets/img/code_app_5.png";
import type { SETTINGS_ROLE } from "@/components/settings/settings.types";

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
const _UserInfoTableCell = styled(Table.Cell)({
	display: "flex",
	alignItems: "center",
	height: "84px",
});
const NameIDWrapper = styled("div")({
	display: "inline-block",
});

const NameTableCell = styled(Table.Cell)({
	width: "100%",
	maxWidth: "1px",
});

const DateTableCell = styled(Table.Cell)({
	whiteSpace: "nowrap",
	"@med_DateTableCell: 768px)": {
		whiteSpace: "normal",
	},
});

const StyledTablePagination = styled(Table.Pagination)({
	border: "none",
});

const StyledProjectContent = styled("div")({
	display: "flex",
	width: "100%",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: "25px",
	flexShrink: "0",
});

const StyledProjectInnerContent = styled("div")({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: "20px",
	alignSelf: "stretch",
});

const StyledTableContainer = styled(Table.Container)({
	borderRadius: "12px",
	boxShadow: "0px 5px 22px 0px rgba(0, 0, 0, 0.06)",
});

const StyledProjectTable = styled(Table)({
	backgroundColor: "white",
	tableLayout: "fixed",
});

const StyledTableTitleContainer = styled("div")({
	display: "flex",
	alignItems: "center",
	alignSelf: "stretch",
	boxShadow: "0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset",
	backgroundColor: "white",
});

const StyledTableTitleDiv = styled("div")({
	display: "flex",
	padding: "12px 16px 12px 16px",
	alignItems: "center",
	gap: "10px",
	fontWeight: 500,
});

const StyledTableTitleProjectCountContainer = styled("div")({
	display: "flex",
	height: "56px",
	alignItems: "center",
	gap: "10px",
	flex: "1 0 0",
});

const _StyledTableTitleProjectCount = styled("div")({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
});

const StyledSearchButtonContainer = styled("div")({
	display: "flex",
	alignItems: "center",
});

const StyledDeleteSelectedContainer = styled("div")({
	display: "flex",
	padding: "10px 8px 10px 16px",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: "10px",
});

const StyledAddProjectsContainer = styled("div")({
	display: "flex",
	padding: "10px 24px 10px 8px",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: "10px",
});

const StyledNonProjectsDiv = styled("div")({
	width: "100%",
	height: "503px",
	display: "flex",
	flexDirection: "column",
	gap: "1rem",
	justifyContent: "center",
	alignItems: "center",
	background: "white",
});

const StyledCheckbox = styled(Checkbox)({
	paddingBottom: "0px",
});

const StyledModalContentText = styled(Modal.ContentText)({
	display: "flex",
	flexDirection: "column",
	gap: ".5rem",
	marginTop: "12px",
});

const StyledCard = styled(Card)({
	borderRadius: "12px",
});

const StyledModal = styled(Modal)({
	"& .MuiPaper-root": {
		borderRadius: "12px",
		padding: "24px",
	},
});

const StyledRadioGroup = styled(RadioGroup)({
	flexWrap: "nowrap",
	whiteSpace: "nowrap",
});

// maps for permissions,
const permissionMapper = {
	Author: 1, // BE: 'DISPLAY'
	Editor: 2, // BE: 'DISPLAY'
	"Read-Only": 3, // DISPLAY: BE
};

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
}

export const TeamProjectsTable = (props: ProjectsTableProps) => {
	const { groupId, groupType } = props;

	const notification = useNotification();
	const AUTOCOMPLETE_LIMIT = 10;
	const AUTOCOMPLETE_OFFSET = 0;

	/** Project Table State */
	const [projectsPage, setProjectsPage] = useState<number>(1);
	const [selectedProjects, setSelectedProojects] = useState([]);
	const [count, setCount] = useState(0);

	/** Delete Project */
	const [deleteProjectsModal, setDeleteProjectsModal] =
		useState<boolean>(false);
	const [deleteProjectModal, setDeleteProjectModal] =
		useState<boolean>(false);
	const [projectToDelete, setProjectToDelete] = useState(null);

	/** Add Project State */
	const [addProjectModal, setAddProjectModal] = useState<boolean>(false);
	const [nonCredentialedProjects, setNonCredentialedProjects] = useState([]);
	const [
		selectedNonCredentialedProjects,
		setSelectedNonCredentialedProjects,
	] = useState([]);
	const [addProjectRole, setAddProjectRole] = useState<SETTINGS_ROLE>();

	const [projects, setProjects] = useState([]);
	const [projectCount, setProjectCount] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [hasProjects, setHasProject] = useState(false);

	const [searchProjectInput, setSearchProjectInput] = useState<string>("");
	const [offset, setOffset] = useState(AUTOCOMPLETE_OFFSET);
	const [isScrollBottom, setIsScrollBottom] = useState(false);
	const [canCollect, setCanCollect] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [searchLoading, setSearchLoading] = useState(false);

	const [projectImageMap, setProjectImageMap] = useState<
		Record<string, string>
	>({});

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

	/**
	 * @name getAdditionalProjects
	 */
	const getAdditionalProjects = () => {
		setOffset(offset + AUTOCOMPLETE_LIMIT);
	};

	const projectSearchRef = useRef(undefined);

	const { watch, setValue } = useForm<{
		SEARCH_FILTER: string;
	}>({
		defaultValues: {
			// Filters for projects table
			SEARCH_FILTER: "",
		},
	});

	const searchFilter = watch("SEARCH_FILTER");

	/**
	 * @name useEffect
	 * @desc - sets projects in react hook form
	 */
	useEffect(() => {
		filterProjects();
	}, [groupId, groupType, count, projectsPage, searchFilter, rowsPerPage]);
	useEffect(() => {
		if (isScrollBottom) {
			if (canCollect) {
				getAdditionalProjects();
			}
		}
	}, [isScrollBottom]);

	useEffect(() => {
		if (searchProjectInput) {
			setSearchLoading(true);
		}
		const timer = setTimeout(() => {
			if (!offset) {
				getProjects(true);
			} else {
				if (canCollect) {
					getProjects(false);
				} else {
					getProjects(true);
				}
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [offset, searchProjectInput]);

	/**
	 * @name submitNonGroupProjects
	 */
	const submitNonGroupProjects = async () => {
		try {
			// construct requests for post data
			const requests = selectedNonCredentialedProjects.map((m) => {
				return {
					project_id: m.project_id,
					permission: permissionMapper[addProjectRole],
				};
			});

			if (requests.length === 0) {
				notification.add({
					color: "warning",
					message: `No apps to add`,
				});

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
					permissionMapper[addProjectRole],
					groupType ? groupType : "",
				);

				if (!response) {
					return;
				}

				// ignore if there is no response
				if (response) {
					setAddProjectModal(false);
					setSelectedNonCredentialedProjects([]);

					notification.add({
						color: "success",
						message: "Successfully added app permission",
					});
				} else {
					notification.add({
						color: "error",
						message: `Error adding project permission`,
					});
				}
			}
		} catch (e) {
			setAddProjectModal(false);
			setSelectedNonCredentialedProjects([]);

			notification.add({
				color: "error",
				message: String(e),
			});
		} finally {
			// refresh the projects
			setCount(count + 1);
			setOffset(0);
		}
	};

	/**
	 * @name deleteProject
	 * @param project
	 */
	const deleteProject = async (project) => {
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
				project,
			);

			if (!response) {
				return;
			}

			notification.add({
				color: "success",
				message: `Successfully removed project`,
			});
		} catch (e) {
			notification.add({
				color: "error",
				message: String(e),
			});
		} finally {
			setDeleteProjectModal(false);
			setCount(count + 1);
		}
		// refresh the projects
	};

	/**
	 * @name deleteProjectPermissions
	 */
	const deleteProjectPermissions = async () => {
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
						selectedProjects[i],
					);

					if (!response) {
						return;
					}
				} catch (e) {
					notification.add({
						color: "error",
						message: String(e),
					});
				} finally {
					setDeleteProjectModal(false);
				}
			}
		} finally {
			notification.add({
				color: "success",
				message: `Successfully removed apps`,
			});
			setCount(count + 1);
			setDeleteProjectsModal(false);
			setSelectedProojects([]);
		}
	};

	/**
	 * @name getProjects
	 * @desc Gets all projects without credentials
	 */
	const getProjects = async (reset: boolean) => {
		if (isLoading) {
			return;
		}
		setIsLoading(true);
		try {
			// possibly add more db table columns / keys here to get id type for display under projects
			// eslint-disable-next-line prefer-const
			const response = await getUnassignedTeamProjects(
				groupId,
				groupType,
				AUTOCOMPLETE_LIMIT,
				offset,
				searchProjectInput,
			);

			// ignore if there is no response
			if (response) {
				let requests = reset ? [] : nonCredentialedProjects;
				const projects = (response as unknown as TeamProjects[])?.map(
					(val) => {
						return {
							...val,
							color: colors[
								Math.floor(Math.random() * colors.length)
							],
						};
					},
				);

				requests = requests.concat(projects);
				setNonCredentialedProjects(requests);
				setCanCollect(projects.length === AUTOCOMPLETE_LIMIT);
				setIsLoading(false);
				setSearchLoading(false);
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: String(e),
			});
			setIsLoading(false);
			setSearchLoading(false);
		}
	};

	/** MEMBER TABLE FUNCTIONS */
	const updateSelectedProjects = async (project) => {
		try {
			if (!project.projectid) {
				notification.add({
					color: "warning",
					message: `No permissions to change`,
				});

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

			// ignore if there is no response

			if (response.data) {
				notification.add({
					color: "success",
					message: "Successfully updated permissions",
				});
			} else {
				notification.add({
					color: "error",
					message: `Error changing permissions`,
				});
			}
		} catch (e) {
			notification.add({
				color: "error",
				message: String(e),
			});
		} finally {
			// refresh the members
			// getMembers.refresh();
		}
	};

	const paginationOptions = {
		projectsPageCounts: [5],
	};

	projectCount > 9 && paginationOptions.projectsPageCounts.push(10);
	projectCount > 19 && paginationOptions.projectsPageCounts.push(20);

	const filterProjects = useCallback(() => {
		getTeamProjects(
			groupId,
			groupType,
			rowsPerPage,
			projectsPage * rowsPerPage - rowsPerPage, // offset
			searchFilter,
			false,
		).then((data: unknown[]) => {
			setProjects(data);
			setHasProject(data.length > 0);
		});
		getTeamProjects(
			groupId,
			groupType,
			100,
			0, // offset
			searchFilter,
			false,
		).then((data: unknown[]) => setProjectCount(data.length));
	}, [count, projectsPage, searchFilter, rowsPerPage]);

	const debouncedFilterProjects = debounced(filterProjects, 400);

	const handleInputChange = (newInputValue) => {
		setValue("SEARCH_FILTER", newInputValue);
		debouncedFilterProjects();
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

			// Only update state if we don't have an image for this project
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

	return (
		<StyledProjectContent>
			<StyledProjectInnerContent>
				{(projects && projects.length > 0) ||
				projectCount > 0 ||
				hasProjects ||
				searchFilter ? (
					<StyledTableContainer>
						<StyledTableTitleContainer>
							<StyledTableTitleDiv>Apps</StyledTableTitleDiv>
							<StyledTableTitleProjectCountContainer>
								<Typography variant="body1">
									{projectCount} Apps
								</Typography>
							</StyledTableTitleProjectCountContainer>
							<StyledSearchButtonContainer>
								<Search
									ref={projectSearchRef}
									placeholder="Search Apps"
									size="small"
									value={searchFilter}
									onChange={(e) => {
										handleInputChange(e.target.value);
									}}
								/>
							</StyledSearchButtonContainer>

							<StyledDeleteSelectedContainer>
								{selectedProjects.length > 0 && (
									<Button
										variant={"outlined"}
										color="error"
										onClick={() =>
											setDeleteProjectsModal(true)
										}
									>
										Delete Selected
									</Button>
								)}
							</StyledDeleteSelectedContainer>

							<StyledAddProjectsContainer>
								<Button
									variant={"contained"}
									onClick={() => {
										getProjects(true);
										setAddProjectRole(undefined);
										setAddProjectModal(true);
									}}
									startIcon={<Add />}
								>
									Add Apps
								</Button>
							</StyledAddProjectsContainer>
						</StyledTableTitleContainer>
						<StyledProjectTable>
							<Table.Head>
								<Table.Row>
									<NameTableCell size="small">
										<Checkbox
											checked={
												selectedProjects.length ===
													projects.length &&
												projects.length > 0
											}
											onChange={() => {
												if (
													selectedProjects.length !==
													projects.length
												) {
													setSelectedProojects(
														projects,
													);
												} else {
													setSelectedProojects([]);
												}
											}}
										/>
										Name
									</NameTableCell>
									<Table.Cell
										size="small"
										sx={{ width: "320px" }}
									>
										Access
									</Table.Cell>
									<Table.Cell
										size="small"
										sx={{
											width: "200px",
											textAlign: "left",
											paddingLeft: "20px",
										}}
									>
										Added Date
									</Table.Cell>
									<Table.Cell
										size="small"
										sx={{
											width: "75px",
											textAlign: "center",
										}}
									>
										Action
									</Table.Cell>
								</Table.Row>
							</Table.Head>
							<Table.Body>
								{Array.isArray(projects) &&
								projects.length > 0 ? (
									projects.map((project, i) => {
										let isSelected = false;

										if (project) {
											isSelected = selectedProjects.some(
												(value) => {
													return (
														value.projectid ===
														project.projectid
													);
												},
											);
										}
										if (project) {
											return (
												<Table.Row
													key={`project-${project.projectid}-${i}`}
												>
													<Table.Cell size="small">
														<Stack
															direction="row"
															spacing={0}
														>
															<StyledCheckbox
																checked={
																	isSelected
																}
																onChange={() => {
																	if (
																		isSelected
																	) {
																		const selProjects =
																			[];
																		selectedProjects.forEach(
																			(
																				p,
																			) => {
																				if (
																					p.projectid !==
																					project.projectid
																				)
																					selProjects.push(
																						p,
																					);
																			},
																		);
																		setSelectedProojects(
																			selProjects,
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

															<NameIDWrapper>
																<Typography variant="body2">
																	{
																		project.project_name
																	}
																</Typography>
																<Typography
																	variant="body2"
																	color="secondary"
																>
																	{`App ID: ${project.projectid}`}
																</Typography>
															</NameIDWrapper>
														</Stack>
													</Table.Cell>
													<Table.Cell size="small">
														<StyledRadioGroup
															row
															defaultValue={
																project.permission
															}
															onChange={(e) => {
																console.log(
																	"Hit Update Permission fn and fix in state",
																);
																updateSelectedProjects(
																	{
																		projectid:
																			project.projectid,
																		type: project.type,
																		project_type:
																			project.type,
																		permission:
																			e
																				.target
																				.value,
																	},
																);
															}}
														>
															<RadioGroup.Item
																value="1"
																label="Author"
															/>
															<RadioGroup.Item
																value="2"
																label="Editor"
															/>
															<RadioGroup.Item
																value="3"
																label="Read-Only"
															/>
														</StyledRadioGroup>
													</Table.Cell>
													<DateTableCell size="small">
														{
															project.project_date_created
														}
													</DateTableCell>
													<Table.Cell size="small">
														<IconButton
															onClick={() => {
																// set project
																setProjectToDelete(
																	project,
																);
																// open modal
																setDeleteProjectModal(
																	true,
																);
															}}
														>
															<Delete></Delete>
														</IconButton>
													</Table.Cell>
												</Table.Row>
											);
										} else {
											return (
												<Table.Row
													key={`No data available`}
												>
													<Table.Cell size="small"></Table.Cell>
													<Table.Cell size="small"></Table.Cell>
													<Table.Cell size="small"></Table.Cell>
													<Table.Cell size="small"></Table.Cell>
												</Table.Row>
											);
										}
									})
								) : (
									<Table.Row key="no-apps-found">
										<Table.Cell colSpan={4} align="center">
											No Apps found.
										</Table.Cell>
									</Table.Row>
								)}
							</Table.Body>
							<Table.Footer>
								<Table.Row>
									<StyledTablePagination
										rowsPerPageOptions={
											paginationOptions.projectsPageCounts
										}
										onPageChange={(_e, v) => {
											setProjectsPage(v + 1);
											setSelectedProojects([]);
										}}
										onRowsPerPageChange={(e) => {
											setRowsPerPage(
												parseInt(e.target.value, 10),
											);
											setProjectsPage(1);
										}}
										page={projectsPage - 1}
										rowsPerPage={rowsPerPage}
										count={projectCount}
									/>
								</Table.Row>
							</Table.Footer>
						</StyledProjectTable>
					</StyledTableContainer>
				) : (
					<StyledTableContainer>
						<StyledTableTitleContainer>
							<StyledTableTitleDiv>
								<Typography variant={"h6"}>Apps</Typography>
							</StyledTableTitleDiv>
						</StyledTableTitleContainer>
						<StyledNonProjectsDiv>
							<Typography variant={"body1"}>
								No apps present
							</Typography>
							<Button
								variant={"contained"}
								onClick={() => {
									getProjects(true);
									setAddProjectModal(true);
								}}
							>
								Add Apps
							</Button>
						</StyledNonProjectsDiv>
					</StyledTableContainer>
				)}
			</StyledProjectInnerContent>
			<StyledModal open={addProjectModal} maxWidth="lg">
				<Modal.Title>
					<Typography variant="h6">Add Apps</Typography>
				</Modal.Title>
				<Modal.Content sx={{ width: "50rem" }}>
					<StyledModalContentText>
						<Autocomplete
							label="Select App"
							loading={searchLoading}
							multiple={true}
							freeSolo={false}
							filterOptions={(x) => x}
							options={nonCredentialedProjects}
							includeInputInList={true}
							limitTags={2}
							getLimitTagsText={() =>
								` +${
									selectedNonCredentialedProjects.length - 2
								}`
							}
							value={selectedNonCredentialedProjects}
							inputValue={searchProjectInput}
							getOptionLabel={(option) => {
								return `${option.project_name} ID: ${option.project_id}`;
							}}
							isOptionEqualToValue={(option, value) => {
								return (
									option.project_name === value.project_name
								);
							}}
							onChange={(_event, newValue) => {
								setSelectedNonCredentialedProjects([
									...newValue,
								]);
							}}
							ListboxProps={{
								onScroll: ({ target }) =>
									setIsScrollBottom(
										nearBottom(
											target as {
												scrollHeight?: number;
												scrollTop?: number;
												clientHeight?: number;
											},
										),
									),
							}}
							onInputChange={(_event, newValue) => {
								setSearchProjectInput(newValue);
								setOffset(0);
							}}
						/>

						{selectedNonCredentialedProjects.map((project, idx) => {
							return (
								<Box
									key={`non-credentialed-${project.project_id}`}
									sx={{
										display: "flex",
										justifyContent: "left",
										align: "center",
										backgroundColor:
											idx % 2 !== 0
												? "rgba(0, 0, 0, .03)"
												: "",
									}}
								>
									<Box
										sx={{
											width: "100%",
											gap: "8px",
											position: "relative",
											paddingBottom: "7px",
											border: "0px",
											display: "flex",
											alignItems: "center",
										}}
									>
										<Box
											sx={{
												display: "flex",
												justifyContent: "center",
												marginTop: "6px",
												marginLeft: "8px",
												marginRight: "8px",
												float: "left",
											}}
										>
											<Box
												sx={{
													display: "flex",
													height: "32px",
													width: "32px",
													justifyContent: "center",
													alignItems: "center",
													border: "0.5px solid rgba(0, 0, 0, .05)",
													borderRadius: "50%",
												}}
											>
												<Avatar
													aria-label="avatar"
													sx={{
														display: "flex",
														width: "50px",
														height: "50px",
														"& img": {
															width: "100%",
															height: "100%",
															objectFit: "cover",
														},
													}}
													src={getRandomImageForProject(
														project.project_id,
													)}
												/>
											</Box>
										</Box>
										<Card.Header
											title={
												<Typography variant="h6">
													{project.project_name}
												</Typography>
											}
											sx={{
												color: "#000",
												maxWidth: "85%",
												width: "100%",
												float: "left",
												gap: "16px",
												display: "inline-flex",
												alignItems: "center",
												paddingBottom: "7px",
												margin: "0px 0px 0px 0px",
											}}
											subheader={
												<Box
													sx={{
														display: "flex",
														gap: 2,
													}}
												>
													<span
														style={{
															opacity: 0.9,
															fontSize: "11px",
															width: "70%",
															gap: "4px",
														}}
													>
														{`App ID: `}
														<Typography
															variant="body2"
															component="span"
														>
															{project.project_id}
														</Typography>
													</span>
												</Box>
											}
											action={
												<IconButton
													sx={{
														height: "48px",
														width: "48px",
														fontSize: "small",
														color: "rgba( 0, 0, 0, .7)",
														mr: "2px",
														top: "20%",
														position: "absolute",
														padding: "10px",
													}}
													onClick={() => {
														const filtered =
															selectedNonCredentialedProjects.filter(
																(val) =>
																	val.project_id !==
																	project.project_id,
															);
														setSelectedNonCredentialedProjects(
															filtered,
														);
													}}
												>
													<ClearRounded />
												</IconButton>
											}
										/>
									</Box>
								</Box>
							);
						})}

						<Typography
							variant="subtitle1"
							sx={{
								pt: "12px",
								pb: "12px",
								fontWeight: "bold",
								fontSize: "16",
								color: "#000",
							}}
						>
							App access
						</Typography>
						<Box
							sx={{
								backgroundColor: "rgba(0,0,0,.03)",
								padding: "10px",
								borderRadius: "8px",
							}}
						>
							<RadioGroup
								label={""}
								onChange={(e) => {
									const val = e.target.value;
									if (val) {
										setAddProjectRole(val as SETTINGS_ROLE);
									}
								}}
							>
								<Stack spacing={1}>
									<StyledCard>
										<Card.Header
											title={
												<Box
													sx={{
														display: "flex",
														fontSize: "16px",
													}}
												>
													<Avatar
														sx={{
															width: "20px",
															height: "20px",
															mt: "6px",
															marginRight: "12px",
															fontSize: "12px",
															fontWeight: "bold",
															backgroundColor:
																"rgba(0, 0, 0, .5)",
														}}
													>
														A
													</Avatar>
													Author
												</Box>
											}
											sx={{ color: "#000" }}
											subheader={
												<Box
													sx={{
														marginLeft: "30px",
													}}
												>
													Ability to edit the model
													connection details, set the
													model as discoverable,
													provision other authors, and
													all editor abilities.
												</Box>
											}
											action={
												<RadioGroup.Item
													value="Author"
													label=""
												/>
											}
										/>
									</StyledCard>
									<StyledCard>
										<Card.Header
											title={
												<Box
													sx={{
														display: "flex",
														fontSize: "16px",
													}}
												>
													<Icon
														sx={{
															width: "20px",
															height: "20px",
															mt: "6px",
															marginRight: "12px",
															fontSize: "12px",
															fontWeight: "bold",
															color: "rgba(0, 0, 0, .5)",
														}}
													>
														<EditRounded />
													</Icon>
													Editor
												</Box>
											}
											sx={{ color: "#000" }}
											subheader={
												<Box
													sx={{
														marginLeft: "30px",
													}}
												>
													Ability to edit the model
													details, provision other
													users as editors and read
													only users, and all read
													only abilities.
												</Box>
											}
											action={
												<RadioGroup.Item
													value="Editor"
													label=""
												/>
											}
										/>
									</StyledCard>
									<StyledCard>
										<Card.Header
											title={
												<Box
													sx={{
														display: "flex",
														fontSize: "16px",
													}}
												>
													<Icon
														sx={{
															width: "24px",
															height: "24px",
															mt: "0px",
															marginRight: "12px",
															fontSize: "24px",
															fontWeight: "bold",
															color: "rgba(0, 0, 0, .5)",
															maxWidth: "24px",
															display: "flex", // Ensure the icon is displayed properly
															alignItems:
																"center", // Center the icon vertically
															justifyContent:
																"center",
														}}
													>
														<RemoveRedEyeRounded />
													</Icon>
													Read-Only
												</Box>
											}
											sx={{ color: "#000" }}
											subheader={
												<Box
													sx={{
														marginLeft: "30px",
													}}
												>
													Ability to view model
													details and usage
													instructions
												</Box>
											}
											action={
												<RadioGroup.Item
													value="Read-Only"
													label=""
												/>
											}
										/>
									</StyledCard>
								</Stack>
							</RadioGroup>
						</Box>
					</StyledModalContentText>
				</Modal.Content>
				<Modal.Actions>
					<Button
						variant="outlined"
						onClick={() => {
							setAddProjectModal(false);
							setOffset(0);
							setNonCredentialedProjects([]);
						}}
					>
						Cancel
					</Button>
					<Button
						variant={"contained"}
						disabled={
							!addProjectRole ||
							selectedNonCredentialedProjects.length < 1
						}
						onClick={() => {
							submitNonGroupProjects();
						}}
					>
						Save
					</Button>
				</Modal.Actions>
			</StyledModal>
			<Modal open={deleteProjectModal} maxWidth="md">
				<Modal.Title>
					<Typography variant="h6">Are you sure?</Typography>
				</Modal.Title>
				<Modal.Content>
					<Modal.ContentText>
						{projectToDelete && (
							<Typography variant="body1">
								This will remove{" "}
								<b>{projectToDelete.project_name}</b>
							</Typography>
						)}
					</Modal.ContentText>
				</Modal.Content>
				<Modal.Actions>
					<Button
						variant="text"
						onClick={() => setDeleteProjectModal(false)}
					>
						Close
					</Button>
					<Button
						color="error"
						variant={"contained"}
						onClick={() => {
							if (!projectToDelete) {
								console.error("No project to delete");
							}
							deleteProject(projectToDelete);
						}}
					>
						Confirm
					</Button>
				</Modal.Actions>
			</Modal>
			<Modal open={deleteProjectsModal}>
				<Modal.Title>Are you sure?</Modal.Title>
				<Modal.Content>
					Would you like to delete all selected apps?
				</Modal.Content>
				<Modal.Actions>
					<Button
						variant="text"
						onClick={() => setDeleteProjectsModal(false)}
					>
						Close
					</Button>
					<Button
						variant={"contained"}
						color="error"
						onClick={() => {
							deleteProjectPermissions();
						}}
					>
						Confirm
					</Button>
				</Modal.Actions>
			</Modal>
		</StyledProjectContent>
	);
};
