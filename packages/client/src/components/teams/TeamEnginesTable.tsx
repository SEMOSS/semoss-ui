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
	addEnginePermission,
	deleteEnginePermission,
	editEnginePermission,
	getTeamEngines,
	getUnassignedTeamEngines,
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

const StyledModal = styled(Modal)({
	"& .MuiPaper-root": {
		borderRadius: "12px",
		padding: "16px",
	},
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
	paddingLeft: "20px",
	"@media (max-width: 768px)": {
		whiteSpace: "normal",
	},
});

const StyledTablePagination = styled(Table.Pagination)({
	border: "none",
});

const StyledEngineContent = styled("div")({
	display: "flex",
	width: "100%",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: "25px",
	flexShrink: "0",
});

const StyledEngineInnerContent = styled("div")({
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

const StyledEngineTable = styled(Table)({
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

const StyledTableTitleEngineContainer = styled("div")({
	display: "flex",
	alignItems: "center",
	flex: "1 0 0",
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

const StyledAddEnginesContainer = styled("div")({
	display: "flex",
	padding: "10px 24px 10px 8px",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: "10px",
});

const StyledNonEnginesDiv = styled("div")({
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
	marginTop: "8px",
});

const StyledCard = styled(Card)({
	borderRadius: "12px",
	boxShadow: "none",
	margin: "0",
	"&:last-child": {
		borderBottom: "none",
	},
	"&:hover": {
		backgroundColor: "transparent",
	},
	"& .MuiCardHeader-root": {
		margin: "0px 0px 0px 0px",
		padding: "0px 0px 0px 0px",
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

interface EnginesTableProps {
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

interface Engine {
	engine_name: string;
	engine_id: string;
	engineid: string;
	engine_type: string;
	engine_date_created: string;
	permission: string;
	type: string;
}

export const TeamEnginesTable = (props: EnginesTableProps) => {
	const { groupId, groupType } = props;

	const notification = useNotification();
	const AUTOCOMPLETE_LIMIT = 10;
	const AUTOCOMPLETE_OFFSET = 0;

	/** Engine Table State */
	const [enginesPage, setEnginesPage] = useState<number>(1);
	const [selectedEngines, setSelectedEngines] = useState<Engine[]>([]);
	const [count, setCount] = useState(0);

	/** Delete Engine */
	const [deleteEnginesModal, setDeleteEnginesModal] =
		useState<boolean>(false);
	const [deleteEngineModal, setDeleteEngineModal] = useState<boolean>(false);
	const [engineToDelete, setEngineToDelete] = useState<Engine | null>(null);

	/** Add Engine State */
	const [addEngineModal, setAddEngineModal] = useState<boolean>(false);
	const [nonCredentialedEngines, setNonCredentialedEngines] = useState<
		Engine[]
	>([]);
	const [selectedNonCredentialedEngines, setSelectedNonCredentialedEngines] =
		useState<Engine[]>([]);
	const [addEngineRole, setAddEngineRole] = useState<SETTINGS_ROLE>();

	const [engines, setEngines] = useState<Engine[]>([]);
	const [enginesCount, setEngineCount] = useState<number>(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [hasEngines, setHasEngines] = useState(false);

	const [searchEngineInput, setSearchEngineInput] = useState<string>("");
	const [offset, setOffset] = useState(AUTOCOMPLETE_OFFSET);
	const [isScrollBottom, setIsScrollBottom] = useState(false);
	const [canCollect, setCanCollect] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [searchLoading, setSearchLoading] = useState(false);
	const [projectImageMap, setProjectImageMap] = useState<
		Record<string, string>
	>({});

	/**
	 * @name getEngines
	 * @desc Gets all engines without credentials
	 */
	const getEngines = async (reset: boolean) => {
		if (isLoading) {
			return;
		}
		setIsLoading(true);
		try {
			// let response;
			// possibly add more db table columns / keys here to get id type for display under engines
			// eslint-disable-next-line prefer-const
			const response = await getUnassignedTeamEngines(
				groupId,
				groupType,
				AUTOCOMPLETE_LIMIT,
				offset,
				searchEngineInput,
			);

			// ignore if there is no response
			if (response) {
				let requests = reset ? [] : nonCredentialedEngines;
				const engines = (response as Engine[]).map((val: Engine) => {
					return {
						...val,
						color: colors[
							Math.floor(Math.random() * colors.length)
						],
					};
				});

				requests = requests.concat(engines);
				setNonCredentialedEngines(requests);
				setCanCollect(engines.length === AUTOCOMPLETE_LIMIT);
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
	 * @name getAdditionalEngines
	 */
	const getAdditionalEngines = useCallback(() => {
		setOffset(offset + AUTOCOMPLETE_LIMIT);
	}, [offset]);

	const engineSearchRef = useRef(undefined);

	const { watch, setValue } = useForm<{
		SEARCH_FILTER: string;
	}>({
		defaultValues: {
			// Filters for engines table
			SEARCH_FILTER: "",
		},
	});

	const searchFilter = watch("SEARCH_FILTER");

	/**
	 * @name useEffect
	 * @desc - sets engines in react hook form
	 */
	useEffect(() => {
		filterEngines();
	}, [groupId, groupType, enginesPage, searchFilter, count, rowsPerPage]);
	useEffect(() => {
		if (isScrollBottom) {
			if (canCollect) {
				getAdditionalEngines();
			}
		}
	}, [isScrollBottom, canCollect]);

	useEffect(() => {
		if (searchEngineInput) {
			setSearchLoading(true);
		}
		const timer = setTimeout(() => {
			if (!offset) {
				getEngines(true);
			} else {
				if (canCollect) {
					getEngines(false);
				} else {
					getEngines(true);
				}
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [offset, searchEngineInput, canCollect]);

	/**
	 * @name submitNonGroupEngines
	 */
	const submitNonGroupEngines = async () => {
		try {
			// construct requests for post data
			const requests = selectedNonCredentialedEngines.map((m) => {
				return {
					engine_id: m.engine_id,
					permission: permissionMapper[addEngineRole],
				};
			});

			if (requests.length === 0) {
				notification.add({
					color: "warning",
					message: `No engines to add`,
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
				response = await addEnginePermission(
					groupId,
					requests[i].engine_id,
					permissionMapper[addEngineRole],
					groupType ? groupType : "",
				);

				if (!response) {
					return;
				}

				// ignore if there is no response
				if (response) {
					setAddEngineModal(false);
					setSelectedNonCredentialedEngines([]);

					notification.add({
						color: "success",
						message: "Successfully added engine permission",
					});
				} else {
					notification.add({
						color: "error",
						message: `Error adding engine permission`,
					});
				}
			}
		} catch (e) {
			setAddEngineModal(false);
			setSelectedNonCredentialedEngines([]);

			notification.add({
				color: "error",
				message: String(e),
			});
		} finally {
			// refresh the engines
			setCount(count + 1);
			setOffset(0);
		}
	};

	/**
	 * @name deleteEngine
	 * @param engine
	 */
	const deleteEngine = async (engine: Engine) => {
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
			response = await deleteEnginePermission(groupId, groupType, engine);

			if (!response) {
				return;
			}

			notification.add({
				color: "success",
				message: `Successfully removed engine`,
			});
		} catch (e) {
			notification.add({
				color: "error",
				message: String(e),
			});
		} finally {
			setDeleteEngineModal(false);
			setCount(count + 1);
		}
		// refresh the engines
	};

	/**
	 * @name deleteEnginePermissions
	 */
	const deleteEnginePermissions = async () => {
		try {
			for (let i = 0; i < selectedEngines.length; i++) {
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
					response = await deleteEnginePermission(
						groupId,
						groupType,
						selectedEngines[i],
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
					setDeleteEngineModal(false);
				}
			}
		} finally {
			notification.add({
				color: "success",
				message: `Successfully removed engines`,
			});
			setCount(count + 1);
			setDeleteEnginesModal(false);
			setSelectedEngines([]);
		}
	};

	/** ENGINES TABLE FUNCTIONS */
	const updateSelectedEngines = async (engine: Engine) => {
		try {
			if (!engine.engineid) {
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
			response = await editEnginePermission(groupId, engine);

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
		enginesPageCounts: [5],
	};

	enginesCount > 9 && paginationOptions.enginesPageCounts.push(10);
	enginesCount > 19 && paginationOptions.enginesPageCounts.push(20);

	const filterEngines = useCallback(() => {
		getTeamEngines(
			groupId,
			groupType,
			rowsPerPage,
			enginesPage * rowsPerPage - rowsPerPage, // offset
			searchFilter,
		).then((response) => {
			setEngines(
				(response as unknown as { data: Engine[]; response: unknown })
					.data as Engine[],
			);
			setHasEngines(
				(response as unknown as { data: Engine[]; response: unknown })
					.data?.length > 0,
			);
		});

		getTeamEngines(
			groupId,
			groupType,
			100,
			0, // offset
			searchFilter,
		).then((responseData) => {
			setEngineCount(
				(
					(
						responseData as unknown as {
							data: Engine[];
							response: unknown;
						}
					).data as Engine[]
				)?.length,
			);
		});
	}, [
		enginesPage,
		searchFilter,
		groupId,
		groupType,
		rowsPerPage,
		getTeamEngines,
	]);

	const debouncedFilterProjects = debounced(filterEngines, 400);

	const handleInputChange = (newInputValue: string) => {
		setValue("SEARCH_FILTER", newInputValue);
		debouncedFilterProjects();
	};

	return (
		<StyledEngineContent>
			<StyledEngineInnerContent>
				{(engines && engines.length > 0) ||
				enginesCount > 0 ||
				hasEngines ||
				searchFilter ? (
					<StyledTableContainer>
						<StyledTableTitleContainer>
							<StyledTableTitleEngineContainer>
								<StyledTableTitleDiv>
									Engines
								</StyledTableTitleDiv>
								<Typography variant="body1">
									{enginesCount} Engines
								</Typography>
							</StyledTableTitleEngineContainer>
							<StyledSearchButtonContainer>
								<Search
									ref={engineSearchRef}
									placeholder="Search Engines"
									size="small"
									value={searchFilter}
									onChange={(e) => {
										handleInputChange(e.target.value);
									}}
								/>
							</StyledSearchButtonContainer>

							<StyledDeleteSelectedContainer>
								{selectedEngines.length > 0 && (
									<Button
										variant={"outlined"}
										color="error"
										onClick={() =>
											setDeleteEnginesModal(true)
										}
									>
										Delete Selected
									</Button>
								)}
							</StyledDeleteSelectedContainer>
							<StyledAddEnginesContainer>
								<Button
									variant={"contained"}
									onClick={() => {
										getEngines(true);
										setAddEngineRole(undefined);
										setAddEngineModal(true);
									}}
									startIcon={<Add />}
								>
									Add Engines
								</Button>
							</StyledAddEnginesContainer>
						</StyledTableTitleContainer>
						<StyledEngineTable>
							<Table.Head>
								<Table.Row>
									<NameTableCell size="small">
										<Checkbox
											checked={
												selectedEngines.length ===
													engines?.length &&
												engines?.length > 0
											}
											onChange={() => {
												if (
													selectedEngines.length !==
													engines?.length
												) {
													setSelectedEngines(
														engines || [],
													);
												} else {
													setSelectedEngines([]);
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
								{Array.isArray(engines) &&
								engines.length > 0 ? (
									engines.map((engine, i) => {
										let isSelected = false;

										if (engine) {
											isSelected = selectedEngines.some(
												(value) => {
													return (
														value.engineid ===
														engine.engineid
													);
												},
											);
										}
										if (engine) {
											return (
												<Table.Row
													key={`${engine.engineid} + ${i}`}
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
																		const selEngines =
																			[];
																		selectedEngines.forEach(
																			(
																				p,
																			) => {
																				if (
																					p.engineid !==
																					engine.engineid
																				)
																					selEngines.push(
																						p,
																					);
																			},
																		);
																		setSelectedEngines(
																			selEngines,
																		);
																	} else {
																		setSelectedEngines(
																			[
																				...selectedEngines,
																				engine,
																			],
																		);
																	}
																}}
															/>
															<NameIDWrapper>
																<Typography variant="body2">
																	{
																		engine.engine_name
																	}
																</Typography>
																<Typography
																	variant="body2"
																	color="secondary"
																>
																	{`Engine ID: ${engine.engineid}`}
																</Typography>
															</NameIDWrapper>
														</Stack>
													</Table.Cell>
													<Table.Cell size="small">
														<StyledRadioGroup
															row
															defaultValue={
																engine.permission
															}
															onChange={(e) => {
																console.log(
																	"Hit Update Permission fn and fix in state",
																);
																updateSelectedEngines(
																	{
																		engineid:
																			engine.engineid,
																		type: engine.type,
																		permission:
																			e
																				.target
																				.value,
																		engine_name:
																			engine.engine_name,
																		engine_id:
																			engine.engine_id,
																		engine_type:
																			engine.engine_type,
																		engine_date_created:
																			engine.engine_date_created,
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
															engine.engine_date_created
														}
													</DateTableCell>
													<Table.Cell size="small">
														<IconButton
															onClick={() => {
																// set engine
																setEngineToDelete(
																	engine,
																);
																// open modal
																setDeleteEngineModal(
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
									<Table.Row key="no-engines-found">
										<Table.Cell colSpan={4} align="center">
											No Engines found.
										</Table.Cell>
									</Table.Row>
								)}
							</Table.Body>
							<Table.Footer>
								<Table.Row>
									<StyledTablePagination
										rowsPerPageOptions={
											paginationOptions.enginesPageCounts
										}
										onPageChange={(_e, v) => {
											setEnginesPage(v + 1);
											setSelectedEngines([]);
										}}
										onRowsPerPageChange={(e) => {
											setRowsPerPage(
												parseInt(e.target.value, 10),
											);
											setEnginesPage(1);
										}}
										page={enginesPage - 1}
										rowsPerPage={rowsPerPage}
										count={enginesCount}
									/>
								</Table.Row>
							</Table.Footer>
						</StyledEngineTable>
					</StyledTableContainer>
				) : (
					<StyledTableContainer>
						<StyledTableTitleContainer>
							<StyledTableTitleDiv>
								<Typography variant={"h6"}>Engines</Typography>
							</StyledTableTitleDiv>
						</StyledTableTitleContainer>
						<StyledNonEnginesDiv>
							<Typography variant={"body1"}>
								No engines present
							</Typography>
							<Button
								variant={"contained"}
								onClick={() => {
									getEngines(true);
									setAddEngineModal(true);
								}}
							>
								Add Engines
							</Button>
						</StyledNonEnginesDiv>
					</StyledTableContainer>
				)}
			</StyledEngineInnerContent>
			<StyledModal open={addEngineModal} maxWidth="lg">
				<Modal.Title>
					<Typography variant="h6">Add Engines</Typography>
				</Modal.Title>
				<Modal.Content sx={{ width: "50rem" }}>
					<StyledModalContentText>
						<Autocomplete
							label="Select Engine"
							size={"small"}
							loading={searchLoading}
							multiple={true}
							freeSolo={false}
							filterOptions={(x) => x}
							options={nonCredentialedEngines}
							includeInputInList={true}
							limitTags={2}
							getLimitTagsText={() =>
								` +${selectedNonCredentialedEngines.length - 2}`
							}
							value={selectedNonCredentialedEngines}
							inputValue={searchEngineInput}
							getOptionLabel={(option: Engine) => {
								return `${option.engine_name} ID: ${option.engine_id}`;
							}}
							isOptionEqualToValue={(option, value) => {
								return (
									typeof option !== "string" &&
									typeof value !== "string" &&
									option.engine_name === value.engine_name
								);
							}}
							onChange={(_event, newValue: Engine[]) => {
								setSelectedNonCredentialedEngines([
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
								setSearchEngineInput(newValue);
								setOffset(0);
							}}
						/>

						{selectedNonCredentialedEngines?.map((engine, idx) => (
							<Box
								key={`${engine.engine_name}- ${idx}`}
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
												height: "50px",
												width: "50px",
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
													engine.engine_name,
												)}
											/>
										</Box>
									</Box>
									<Card.Header
										title={
											<Typography variant="h6">
												{engine.engine_name}
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
													{`Engine ID: `}
													<Typography
														variant="body2"
														component="span"
													>
														{engine.engine_id}
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
														selectedNonCredentialedEngines.filter(
															(val) =>
																val.engine_id !==
																engine.engine_id,
														);
													setSelectedNonCredentialedEngines(
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
						))}

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
							Engine access
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
										setAddEngineRole(val as SETTINGS_ROLE);
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
															display: "flex",
															alignItems:
																"center",
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
							setAddEngineModal(false);
							setOffset(0);
							setNonCredentialedEngines([]);
						}}
					>
						Cancel
					</Button>
					<Button
						variant={"contained"}
						disabled={
							!addEngineRole ||
							selectedNonCredentialedEngines.length < 1
						}
						onClick={() => {
							submitNonGroupEngines();
						}}
					>
						Save
					</Button>
				</Modal.Actions>
			</StyledModal>
			<Modal open={deleteEngineModal} maxWidth="md">
				<Modal.Title>
					<Typography variant="h6">Are you sure?</Typography>
				</Modal.Title>
				<Modal.Content>
					<Modal.ContentText>
						{engineToDelete && (
							<Typography variant="body1">
								This will remove{" "}
								<b>{engineToDelete.engine_name}</b>
							</Typography>
						)}
					</Modal.ContentText>
				</Modal.Content>
				<Modal.Actions>
					<Button
						variant="text"
						onClick={() => setDeleteEngineModal(false)}
					>
						Close
					</Button>
					<Button
						color="error"
						variant={"contained"}
						onClick={() => {
							if (!engineToDelete) {
								console.error("No engine to delete");
							}
							deleteEngine(engineToDelete);
						}}
					>
						Confirm
					</Button>
				</Modal.Actions>
			</Modal>
			<Modal open={deleteEnginesModal}>
				<Modal.Title>Are you sure?</Modal.Title>
				<Modal.Content>
					Would you like to delete all selected engines?
				</Modal.Content>
				<Modal.Actions>
					<Button
						variant="text"
						onClick={() => setDeleteEnginesModal(false)}
					>
						Close
					</Button>
					<Button
						variant={"contained"}
						color="error"
						onClick={() => {
							deleteEnginePermissions();
						}}
					>
						Confirm
					</Button>
				</Modal.Actions>
			</Modal>
		</StyledEngineContent>
	);
};
