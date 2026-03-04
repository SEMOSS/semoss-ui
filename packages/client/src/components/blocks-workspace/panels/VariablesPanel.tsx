import {
	Add,
	ArrowDownward,
	ArrowUpward,
	AutoFixHighOutlined,
	Close,
	Tune,
} from "@mui/icons-material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocks, VARIABLE_TYPES, type Variable } from "@semoss/renderer";
import {
	Accordion,
	Badge,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Divider,
	IconButton,
	List,
	Modal,
	Popover,
	Search,
	Stack,
	styled,
	Tooltip,
	Typography,
} from "@semoss/ui";
import { AddVariablePopover, NotebookVariable } from "@/components/notebook";
import { Panel } from "@/components/workspace";
import { usePixel, useWorkspace } from "@/hooks";
import ExpandCollapseIcon from "../../../assets/img/ExpandCollapseIcon.png";
import { suggestVariableRenames } from "../utils";

const StyledStack = styled(Stack)(() => ({
	maxHeight: "100%",
}));

const StyledMenu = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	width: "100%",
	paddingTop: theme.spacing(1),
	backgroundColor: theme.palette.background.paper,
	overflowY: "scroll",
}));

const StyledMenuTitle = styled(Typography)(() => ({
	color: "#212121",
	fontFamily: "Inter",
	fontSize: "16px",
	fontWeight: "500",
	lineHeight: "150%",
	letterSpacing: "0.15px",
}));

const StyledTitleSpan = styled("span")(() => ({
	color: "var(--Primary-Dark, #1260DD)",
	fontFamily: "Inter",
	fontFeatureSettings: "'liga' off, 'clig' off",
	fontStyle: "normal",
	fontSize: "13px",
	lineHeight: "18px",
	fontWeight: 400,
	marginTop: "8px",
	letterSpacing: "0.16px",
	marginBottom: "8px",
}));

const StyledMenuScroll = styled("div")(({ theme }) => ({
	flex: "1",
	width: "100%",
	paddingBottom: theme.spacing(1),
	overflowX: "hidden",
	overflowY: "auto",
}));

const StyledBox = styled(Box)(({ theme }) => ({
	height: "752px",
	width: "344px",
	display: "inline-flex",
	flexDirection: "column",
	borderRadius: "8px",
	borderRight: "1px solid var(--Secondary-Divider, #E6E6E6)",
	background: "var(--Background-Paper-1, #FFF)",
	boxShadow: "0 5px 8px 0 rgba(0, 0, 0, 0.08)",
	gap: "8px",
}));

const StyledTitle = styled("div")(({ theme }) => ({
	borderRadius: "16px",
	background: " #EBF4FE",
	width: "fit-content",
	marginTop: "8px",
	paddingRight: theme.spacing(2),
	paddingLeft: theme.spacing(2),
	marginBottom: "8px",
	backgroundColor: theme.palette.primary.selected,
	color: theme.palette.info.dark,
}));

const StyledStackFilter = styled(Stack)(() => ({
	display: "flex",
	padding: "4px 16px",
	height: "40px",
	alignSelf: "stretch",
	borderRadius: "6px 6px 0 0",
}));

const StyledTypography = styled(Typography)(() => ({
	display: "flex",
	padding: "4px 0",
	flexDirection: "column",
	alignItems: "flex-start",
	flex: "1 0 0",
	height: "21px",
	color: "#0471F0",
	fontSize: "14px",
	fontWeight: "400",
	lineHeigh: "150%",
	letterSpacing: "0.17px",
	position: "relative",
	top: "3px",
}));

const StyledList = styled(List)(() => ({
	height: "464px",
	overflowY: "auto",
}));

const StyledListContent = styled(Stack)(() => ({
	display: "flex",
	paddingTop: "8px",
	flexDirection: "row",
	marginLeft: "15px",
}));
const StyledSelectAllListContent = styled(Stack)(() => ({
	display: "flex",
	flexDirection: "row",
	marginLeft: "15px",
}));

const StyledTypographyContent = styled(Typography)(() => ({
	color: "#212121",
	fontSize: "16px",
	fontWeight: "400",
	lineHeight: "150%",
	letterSpacing: "0.15px",
	position: "relative",
	top: "1px",
}));

const StyledBoxSort = styled(Stack)(() => ({
	display: "flex",
	height: "138px",
	padding: "8px 0",
}));

const StyledTypographySort = styled(Typography)(() => ({
	display: "flex",
	padding: "4px 16px",
	color: "#212121",
	fontSize: "14px",
	lineHeight: "150%",
	letterSpacing: "0.17px",
	height: "21px",
	fontWeight: 400,
	position: "relative",
	bottom: "8px",
}));

const FlexButton = styled(Button)({
	flex: 1,
	textWrap: "nowrap",
});

const StyledStackFilterBy = styled(Stack)({
	padding: "4px 0",
});

const StyledTypographyAsc = styled(Typography)(() => ({
	display: "flex",
	padding: "4px 0px",
	color: "#212121",
	fontSize: "14px",
	fontWeight: "400",
	lineHeight: "150%",
	letterSpacing: "0.17px",
	height: "21px",
}));

const StyledListItem = styled(List.Item)(() => ({
	cursor: "pointer",
	"&:hover": {
		backgroundColor: "#f5f5f5",
	},
	"&:active": {
		backgroundColor: "#e0e0e0",
	},
	transition: "background-color 0.15s ease-in-out",
}));

const StyledCheckbox = styled(Checkbox)(() => ({
	width: "56px",
	marginRight: "0px",
}));

const StyledCheckboxFilter = styled(Checkbox)(() => ({
	width: "56px",
	position: "relative",
	bottom: "8px",
	marginRight: "0px",
}));

const StyledIconButtonAsc = styled(IconButton)(() => ({
	position: "relative",
	right: "2px",
	color: "#757575",
	bottom: "2px",
}));

const StyledIconButtonDesc = styled(IconButton)(() => ({
	position: "relative",
	color: "#757575",
	bottom: "1px",
	right: "10px",
}));

const StyledStackVariable = styled(Stack)(() => ({
	paddingLeft: "16px",
	paddingTop: "16px",
}));

const StyledTooltip = styled(Tooltip)(() => ({
	"& .MuiTooltip-tooltip": {
		bgcolor: "#757575",
		color: "#FFFFFF",
		fontSize: "12px",
		fontWeight: 400,
		padding: "6px 12px",
		borderRadius: "4px",
		boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
	},
	"& .MuiTooltip-arrow": {
		color: "#424242",
	},
}));

const StyledAccordion = styled(Accordion)(() => ({
	boxShadow: "none",
	"&:before": { display: "none" },
	"&.Mui-expanded": {
		margin: 0,
	},
	"&:not(:last-child)": {
		marginBottom: 0,
	},
}));

const StyledStackAccordion = styled(Stack)(() => ({
	padding: "2px 0px",
	height: "40px",
}));

const StyledAccordionTrigger = styled(Accordion.Trigger)(() => ({
	minHeight: "48px",
	flexDirection: "row-reverse",
	"& .MuiAccordionSummary-expandIconWrapper": {
		marginRight: "2px",
		marginLeft: 0,
		transform: "rotate(0deg)",
		transition: "transform 0.2s",
		"&.Mui-expanded": {
			transform: "rotate(90deg)",
		},
	},
	"&.Mui-expanded": {
		minHeight: "48px",
	},
	"& .MuiAccordionSummary-content": {
		margin: 0,
		"&.Mui-expanded": {
			margin: 0,
		},
	},
}));

const StyledTypographyType = styled(Typography)(() => ({
	fontWeight: 400,
	fontSize: "16px",
	color: "#212121",
}));

const StyledAccordionContent = styled(Accordion.Content)(() => ({
	padding: 0,
	"& .MuiAccordionDetails-root": {
		padding: 0,
	},
}));

const StyledListVariableContent = styled(List)(() => ({
	padding: 0,
	"& .MuiStack-root > :not(style):not(style)": {
		marginTop: 0,
	},
}));

const StyledListItemContent = styled(List.Item)(() => ({
	paddingY: 1,
	paddingX: 2,
	display: "flex",
	alignItems: "center",
	gap: 1.5,
	"&:hover": {
		backgroundColor: "#f9f9f9",
		cursor: "pointer",
	},
	"&:last-child": {
		borderBottom: "none",
	},
}));

const StyledExpandIcon = styled("img")(() => ({
	width: 20,
	height: 20,
}));

interface VariablePanelProps {
	title: string;
}

/**
 * Render the variables menu
 */
export const VariablesPanel = observer(
	(props: VariablePanelProps): JSX.Element => {
		const { title } = props;

		const { state } = useBlocks();
		const { workspace } = useWorkspace();

		/**
		 * State
		 */
		const [popoverAnchorEle, setPopoverAnchorEl] =
			useState<HTMLElement | null>(null);
		const [filterAnchorEl, setFilterAnchorEl] =
			useState<HTMLElement | null>(null);
		const [engines, setEngines] = useState<{
			models: {
				app_id: string;
				app_name: string;
				app_type: string;
				app_subtype: string;
			}[];
			databases: {
				app_id: string;
				app_name: string;
				app_type: string;
				app_subtype: string;
			}[];
			storages: {
				app_id: string;
				app_name: string;
				app_type: string;
				app_subtype: string;
			}[];
			functions: {
				app_id: string;
				app_name: string;
				app_type: string;
				app_subtype: string;
			}[];
			vectors: {
				app_id: string;
				app_name: string;
				app_type: string;
				app_subtype: string;
			}[];
		}>({
			models: [],
			databases: [],
			storages: [],
			functions: [],
			vectors: [],
		});
		const [filterWord, setFilterWord] = useState("");
		const [selectedFilter, setSelectedFilter] = useState(VARIABLE_TYPES);
		const [tempFilter, setTempFilter] = useState<string[]>(VARIABLE_TYPES);
		const [expandedItems, setExpandedItems] = useState<
			Record<string, boolean>
		>(() => {
			const groupedVariables = Object.entries(state.variables).reduce(
				(acc, [id, variable]) => {
					if (!acc[variable.type]) acc[variable.type] = [];
					acc[variable.type].push({ id, variable });
					return acc;
				},
				{} as Record<string, { id: string; variable: Variable }[]>,
			);

			const initial: Record<string, boolean> = {};
			Object.keys(groupedVariables).forEach((type) => {
				initial[type] = false;
			});
			return initial;
		});
		const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // Default to ascending
		const [tempSortOrder, setTempSortOrder] = useState<"asc" | "desc">(
			"asc",
		);

		// New state for the rename modal
		const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
		const [suggestedChanges, setSuggestedChanges] = useState<
			Record<string, string>
		>({});
		const [selectedChanges, setSelectedChanges] = useState<
			Record<string, boolean>
		>({});
		const [isProcessing, setIsProcessing] = useState(false);

		const [llmLoad, setLLMLoad] = useState<boolean>(false);

		/**
		 * API
		 */
		const getEngines =
			usePixel<
				{
					app_id: string;
					app_name: string;
					app_type: string;
					app_subtype: string;
				}[]
			>(`MyEngines();`);

		/**
		 * Computed
		 */
		const isFilterPopoverOpen = Boolean(filterAnchorEl);
		const isPopoverOpen = Boolean(popoverAnchorEle);

		/**
		 * Effects/Memos
		 */
		useEffect(() => {
			if (getEngines.status !== "SUCCESS") {
				return;
			}
			const cleanedEngines = getEngines.data.map((d) => ({
				app_name: d.app_name ? d.app_name.replace(/_/g, " ") : "",
				app_id: d.app_id,
				app_type: d.app_type,
				app_subtype: d.app_subtype,
			}));

			const newEngines = {
				models: cleanedEngines.filter((e) => e.app_type === "MODEL"),
				databases: cleanedEngines.filter(
					(e) => e.app_type === "DATABASE",
				),
				storages: cleanedEngines.filter(
					(e) => e.app_type === "STORAGE",
				),
				functions: cleanedEngines.filter(
					(e) => e.app_type === "FUNCTION",
				),
				vectors: cleanedEngines.filter((e) => e.app_type === "VECTOR"),
			};

			setEngines(newEngines);
		}, [getEngines.status, getEngines.data]);

		useEffect(() => {
			if (filterAnchorEl) {
				setTempFilter(selectedFilter);
				setTempSortOrder(sortOrder);
			}
		}, [filterAnchorEl]);

		useEffect(() => {
			if (filterAnchorEl) {
				setTempFilter(selectedFilter);
			}
		}, [filterAnchorEl]);

		const variables = useMemo(() => {
			return Object.entries(state.variables)
				.filter(
					([id, val]) =>
						id.includes(filterWord) &&
						selectedFilter.includes(val.type),
				)
				.sort((a, b) => {
					const typeCompare = a[1].type.localeCompare(b[1].type);
					if (typeCompare !== 0) {
						return sortOrder === "asc" ? typeCompare : -typeCompare;
					}
					return sortOrder === "asc"
						? a[0].localeCompare(b[0])
						: b[0].localeCompare(a[0]);
				});
		}, [
			filterWord,
			JSON.stringify(selectedFilter),
			sortOrder,
			Object.values(state.variables),
		]);

		/**
		 * Handle opening the rename modal and getting suggestions
		 */
		const handleOpenRenameModal = async () => {
			setLLMLoad(true);
			try {
				const changes = await suggestVariableRenames(
					state,
					workspace.agentModelEngine,
				);

				if (typeof changes === "object" && changes !== null) {
					const changesRecord = changes as Record<string, string>;
					setSuggestedChanges(changesRecord);

					// Initialize all changes as selected (true)
					const initialSelection: Record<string, boolean> = {};
					Object.keys(changesRecord).forEach((key) => {
						initialSelection[key] = true;
					});
					setSelectedChanges(initialSelection);

					setIsRenameModalOpen(true);
				}
				setLLMLoad(false);
			} catch (error) {
				console.error("Error getting suggested changes:", error);
				setLLMLoad(false);
			}
		};

		/**
		 * Handle applying the selected changes
		 */
		const handleApplyChanges = async () => {
			workspace.setLoading(true);
			try {
				// Filter only the selected changes
				const changesToApply: Record<string, string> = {};
				Object.entries(suggestedChanges).forEach(
					([oldName, newName]) => {
						if (selectedChanges[oldName]) {
							changesToApply[oldName] = newName;
						}
					},
				);

				if (Object.keys(changesToApply).length > 0) {
					// TODO: Refactor this and go off of cell and variable class functions
					const success = await (state as any).applyVariableRenames(
						changesToApply,
					);
					// if (success) {
					setIsRenameModalOpen(false);
					setSuggestedChanges({});
					setSelectedChanges({});
					// }
				}
			} catch (error) {
				console.error("Error applying changes:", error);
			} finally {
				workspace.setLoading(false);
			}
		};

		/**
		 * Handle toggling a change selection
		 */
		const handleToggleChange = (oldName: string) => {
			setSelectedChanges((prev) => ({
				...prev,
				[oldName]: !prev[oldName],
			}));
		};

		const allSelected = tempFilter.length === VARIABLE_TYPES.length;

		function capitalizeFirstLetter(str) {
			if (!str) return "";
			return str.charAt(0).toUpperCase() + str.slice(1);
		}

		const groupedVariables = useMemo(() => {
			return variables.reduce(
				(acc, [id, variable]) => {
					if (!acc[variable.type]) acc[variable.type] = [];
					acc[variable.type].push({ id, variable });
					return acc;
				},
				{} as Record<string, { id: string; variable: Variable }[]>,
			);
		}, [variables]);

		const tooltipText = useMemo(() => {
			const groupedVariables = variables.reduce(
				(acc, [id, variable]) => {
					if (!acc[variable.type]) acc[variable.type] = [];
					acc[variable.type].push({ id, variable });
					return acc;
				},
				{} as Record<string, { id: string; variable: Variable }[]>,
			);

			const types = Object.keys(groupedVariables);
			const expandedCount = types.filter(
				(type) => expandedItems[type] === true,
			).length;

			if (expandedCount === 0) {
				return "Expand Variables";
			} else if (expandedCount === types.length) {
				return "Collapse Variables";
			} else {
				return "Collapse All";
			}
		}, [variables, expandedItems]);

		const prevTypesRef = useRef<string[]>([]);

		useEffect(() => {
			const currentTypes = Object.keys(groupedVariables);
			const prevTypes = prevTypesRef.current;

			const newTypes = currentTypes.filter(
				(type) => !prevTypes.includes(type),
			);

			if (newTypes.length > 0) {
				setTimeout(() => {
					setExpandedItems((prev) => {
						const updated = { ...prev };

						const existingTypes = Object.keys(prev);
						let defaultStateForNewTypes = false;

						if (existingTypes.length > 0) {
							const allExpanded = existingTypes.every(
								(type) => prev[type] === true,
							);
							const allCollapsed = existingTypes.every(
								(type) => prev[type] === false,
							);

							if (allExpanded) {
								defaultStateForNewTypes = true;
							} else if (allCollapsed) {
								defaultStateForNewTypes = false;
							} else {
								defaultStateForNewTypes = false;
							}
						}

						newTypes.forEach((type) => {
							updated[type] = defaultStateForNewTypes;
						});
						return updated;
					});
				}, 0);
			}

			prevTypesRef.current = currentTypes;
		}, [groupedVariables]);

		return (
			<Panel>
				<StyledStack
					direction={"column"}
					spacing={0}
					className="notebook-variables-menu"
				>
					<StyledTitle>
						<StyledTitleSpan>{title}</StyledTitleSpan>
					</StyledTitle>
					<StyledMenu>
						<Stack
							spacing={2}
							paddingLeft={2}
							paddingBottom={1}
							paddingRight={2}
							direction="row"
							justifyContent={"space-between"}
							alignItems={"center"}
						>
							<Search
								size={"small"}
								placeholder="Search"
								onChange={(e) => {
									setFilterWord(e.target.value);
								}}
								data-testid={"variable-panel-search-txt"}
							/>
							<IconButton
								size="small"
								onClick={(e) => {
									setFilterAnchorEl(e.currentTarget);
								}}
								data-testid={"variable-panel-filter-btn"}
							>
								<Badge
									variant="dot"
									color="primary"
									invisible={
										selectedFilter.length ===
											VARIABLE_TYPES.length &&
										sortOrder === "asc"
									}
								>
									<Tune />
								</Badge>
							</IconButton>
						</Stack>
						<Stack spacing={2} paddingLeft={2}>
							<Popover
								id={"filter-variable-popover"}
								open={isFilterPopoverOpen}
								anchorEl={filterAnchorEl}
								onClose={() => {
									setFilterAnchorEl(null);
								}}
								anchorOrigin={{
									vertical: "top",
									horizontal: "right",
								}}
								transformOrigin={{
									vertical: "bottom",
									horizontal: "left",
								}}
								sx={{
									"& .MuiPopover-paper": {
										overflowY: "auto",
									},
								}}
								marginThreshold={45}
							>
								<StyledBox>
									<StyledStackFilter>
										<StyledStackFilterBy direction="row">
											<StyledTypography variant="body2">
												Filter By
											</StyledTypography>
											<IconButton
												size="small"
												onClick={() => {
													setFilterAnchorEl(null);
												}}
												data-testid={
													"variable-filter-popover-close-btn"
												}
											>
												<Close />
											</IconButton>
										</StyledStackFilterBy>
									</StyledStackFilter>

									<Divider />
									<StyledList>
										{/* SELECT ALL CHECKBOX */}
										<StyledListItem
											onClick={(e) => {
												e.stopPropagation();
												if (allSelected) {
													setTempFilter([]);
												} else {
													setTempFilter([
														...VARIABLE_TYPES,
													]);
												}
											}}
											data-testid={
												"variable-filter-select-all-item"
											}
										>
											<StyledSelectAllListContent>
												<Box
													onClick={(e) =>
														e.stopPropagation()
													}
												>
													<StyledCheckbox
														checked={allSelected}
														onChange={(e) => {
															e.stopPropagation();
															if (allSelected) {
																setTempFilter(
																	[],
																);
															} else {
																setTempFilter([
																	...VARIABLE_TYPES,
																]);
															}
														}}
														data-testid={
															"variable-filter-select-all-chk"
														}
													/>
												</Box>
												<StyledTypographyContent variant="body1">
													Select All
												</StyledTypographyContent>
											</StyledSelectAllListContent>
										</StyledListItem>
										<Stack direction="column" spacing={0}>
											{VARIABLE_TYPES.map((type) => (
												<List.Item
													key={type}
													data-testid={`variable-filter-${type}-item`}
													onClick={() => {
														setTempFilter((prev) =>
															prev.includes(type)
																? prev.filter(
																		(t) =>
																			t !==
																			type,
																	)
																: [
																		...prev,
																		type,
																	],
														);
													}}
													sx={{
														"& .MuiStack-root > :not(style) ~ :not(style)":
															{
																marginTop:
																	"0 !important",
															},
														cursor: "pointer",
														"&:hover": {
															backgroundColor:
																"#f5f5f5",
														},
														"&:active": {
															backgroundColor:
																"#e0e0e0",
														},
														transition:
															"background-color 0.15s ease-in-out",
													}}
												>
													<StyledListContent>
														<Box
															onClick={(e) =>
																e.stopPropagation()
															}
														>
															<StyledCheckboxFilter
																checked={tempFilter.includes(
																	type,
																)}
																data-testid={`variable-filter-${type}-chk`}
																onChange={(
																	e,
																) => {
																	e.stopPropagation();
																	setTempFilter(
																		(
																			prev,
																		) => {
																			if (
																				prev.includes(
																					type,
																				)
																			) {
																				return prev.filter(
																					(
																						t,
																					) =>
																						t !==
																						type,
																				);
																			}
																			return [
																				...prev,
																				type,
																			];
																		},
																	);
																}}
															/>
														</Box>
														<StyledTypographyContent variant="body1">
															{capitalizeFirstLetter(
																type,
															)}
														</StyledTypographyContent>
													</StyledListContent>
												</List.Item>
											))}
										</Stack>
									</StyledList>
									<Divider />
									<StyledBoxSort direction="column">
										<StyledTypographySort variant="subtitle1">
											Sort By:
										</StyledTypographySort>

										{/* ASC */}
										<List.Item
											onClick={() =>
												setTempSortOrder("asc")
											}
											data-testid={
												"variable-filter-sort-asc-item"
											}
											sx={{
												"& .MuiStack-root > :not(style) ~ :not(style)":
													{
														marginTop:
															"0 !important",
													},
												backgroundColor:
													tempSortOrder === "asc"
														? "#E3F2FD"
														: "transparent",
												cursor: "pointer",
												"&:hover": {
													backgroundColor:
														tempSortOrder === "asc"
															? "#BBDEFB"
															: "#f5f5f5",
												},
											}}
										>
											<StyledTypographyAsc variant="body2">
												<StyledTypographySort variant="body2">
													Asc
												</StyledTypographySort>
												<StyledIconButtonAsc>
													<ArrowUpward fontSize="small" />
												</StyledIconButtonAsc>
											</StyledTypographyAsc>
										</List.Item>

										{/* DESC */}
										<List.Item
											onClick={() =>
												setTempSortOrder("desc")
											}
											data-testid={
												"variable-filter-sort-desc-item"
											}
											sx={{
												"& .MuiStack-root > :not(style) ~ :not(style)":
													{
														marginTop:
															"0 !important",
													},
												backgroundColor:
													tempSortOrder === "desc"
														? "#E3F2FD"
														: "transparent",
												cursor: "pointer",
												height: "40px",
												alignItems: "center",
												"&:hover": {
													backgroundColor:
														tempSortOrder === "desc"
															? "#BBDEFB"
															: "#f5f5f5",
												},
											}}
										>
											<StyledTypographyAsc variant="body2">
												<StyledTypographySort variant="body2">
													Desc
												</StyledTypographySort>
												<StyledIconButtonDesc>
													<ArrowDownward fontSize="small" />
												</StyledIconButtonDesc>
											</StyledTypographyAsc>
										</List.Item>
									</StyledBoxSort>
									<Divider />
									<Stack
										direction="row"
										paddingX={4}
										paddingY={2}
										spacing={2}
									>
										<FlexButton
											variant="outlined"
											color="secondary"
											onClick={() => {
												setTempFilter(VARIABLE_TYPES);
												setSelectedFilter(
													VARIABLE_TYPES,
												);
												setTempSortOrder("asc");
												setSortOrder("asc");
												setFilterAnchorEl(null);
											}}
											data-testid={
												"variable-filter-clear-all-btn"
											}
										>
											Clear All
										</FlexButton>
										<FlexButton
											variant="contained"
											onClick={() => {
												setSelectedFilter(tempFilter);
												setSortOrder(tempSortOrder);
												setFilterAnchorEl(null);
											}}
											data-testid={
												"variable-filter-apply-btn"
											}
										>
											Apply
										</FlexButton>
									</Stack>
								</StyledBox>
							</Popover>
						</Stack>
						<StyledStackVariable spacing={2}>
							<Stack
								direction="row"
								justifyContent="space-between"
								alignItems={"center"}
							>
								<StyledMenuTitle variant="h6">
									Variables
								</StyledMenuTitle>
								<Stack direction="row" spacing={1}>
									<IconButton
										size="small"
										disabled={
											!workspace.agentModelEngine ||
											isProcessing
										}
										onClick={handleOpenRenameModal}
										data-testid={
											"variable-panel-rename-suggest-btn"
										}
									>
										{llmLoad ? (
											<CircularProgress
												size="1.5rem"
												color="secondary"
											/>
										) : (
											<AutoFixHighOutlined />
										)}
									</IconButton>
									<StyledTooltip
										title="Create New Variable"
										arrow
									>
										<IconButton
											className="notebook-variable-menu__add-variable-button"
											onClick={(e) => {
												setPopoverAnchorEl(
													e.currentTarget,
												);
											}}
											data-testid={
												"variable-panel-add-variable-btn"
											}
										>
											<Add />
										</IconButton>
									</StyledTooltip>
									<StyledTooltip
										title={tooltipText}
										placement="bottom"
										arrow
									>
										<IconButton
											onClick={() => {
												const newState = {};
												const types =
													Object.keys(
														groupedVariables,
													);
												const hasAnyExpanded =
													types.some(
														(type) =>
															expandedItems[
																type
															] === true,
													);
												types.forEach((type) => {
													newState[type] =
														!hasAnyExpanded;
												});
												setExpandedItems(newState);
											}}
											data-testid={
												"variable-panel-expand-collapse-btn"
											}
										>
											<StyledExpandIcon
												src={ExpandCollapseIcon}
												alt="Expand/Collapse"
											/>
										</IconButton>
									</StyledTooltip>
								</Stack>
							</Stack>
						</StyledStackVariable>

						<StyledMenuScroll>
							{Object.entries(groupedVariables).map(
								([type, vars]) => {
									if (expandedItems[type] === undefined) {
										return null;
									}
									return (
										<StyledAccordion
											key={type}
											expanded={expandedItems[type]}
											onChange={(_, isExpanded) => {
												setExpandedItems((prev) => ({
													...prev,
													[type]: isExpanded,
												}));
											}}
											data-testid={`variable-panel-type-${type}-accordion`}
										>
											<StyledStackAccordion>
												<StyledAccordionTrigger
													expandIcon={
														<ChevronRightIcon />
													}
												>
													<StyledTypographyType variant="body1">
														{capitalizeFirstLetter(
															type,
														)}
													</StyledTypographyType>
												</StyledAccordionTrigger>
											</StyledStackAccordion>
											<StyledAccordionContent>
												<StyledListVariableContent>
													{vars.map(
														({ id, variable }) => (
															<StyledListItemContent
																key={id}
															>
																<NotebookVariable
																	id={id}
																	variable={
																		variable
																	}
																	engines={
																		engines
																	}
																	suggestVariableRenames={
																		suggestVariableRenames
																	}
																/>
															</StyledListItemContent>
														),
													)}
												</StyledListVariableContent>
											</StyledAccordionContent>
										</StyledAccordion>
									);
								},
							)}
						</StyledMenuScroll>

						{isPopoverOpen && (
							<AddVariablePopover
								open={isPopoverOpen}
								anchorEl={popoverAnchorEle}
								onClose={() => {
									setPopoverAnchorEl(null);
								}}
								engines={engines}
							/>
						)}
					</StyledMenu>
				</StyledStack>

				{/* Rename Modal */}
				<Modal
					open={isRenameModalOpen}
					onClose={() => setIsRenameModalOpen(false)}
					aria-labelledby="rename-variables-modal"
				>
					<Box
						sx={{
							position: "absolute",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							width: 600,
							maxHeight: "80vh",
							bgcolor: "background.paper",
							borderRadius: 2,
							boxShadow: 24,
							p: 4,
							overflow: "auto",
						}}
					>
						<Typography variant="h6" gutterBottom>
							Suggested Variable Name Changes
						</Typography>
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ mb: 3 }}
						>
							Review and select the variable name changes you'd
							like to apply. All changes are selected by default.
						</Typography>

						<Stack spacing={2} sx={{ mb: 3 }}>
							{Object.entries(suggestedChanges).map(
								([oldName, newName]) => (
									<Box
										key={oldName}
										sx={{
											display: "flex",
											alignItems: "center",
											p: 2,
											border: "1px solid",
											borderColor: "divider",
											borderRadius: 1,
											backgroundColor:
												"background.default",
										}}
									>
										<Checkbox
											checked={
												selectedChanges[oldName] ||
												false
											}
											onChange={() =>
												handleToggleChange(oldName)
											}
										/>
										<Box sx={{ ml: 2, flex: 1 }}>
											<Typography
												variant="body2"
												color="text.secondary"
											>
												{oldName}
											</Typography>
											<Typography
												variant="body1"
												sx={{ fontWeight: "bold" }}
											>
												→ {newName}
											</Typography>
										</Box>
									</Box>
								),
							)}
						</Stack>

						<Stack
							direction="row"
							spacing={2}
							justifyContent="flex-end"
						>
							<Button
								onClick={() => setIsRenameModalOpen(false)}
								disabled={isProcessing}
							>
								Cancel
							</Button>
							<Button
								variant="contained"
								onClick={handleApplyChanges}
								disabled={
									isProcessing ||
									Object.keys(selectedChanges).filter(
										(key) => selectedChanges[key],
									).length === 0
								}
							>
								{isProcessing
									? "Applying..."
									: "Apply Selected Changes"}
							</Button>
						</Stack>
					</Box>
				</Modal>
			</Panel>
		);
	},
);
