import {
	ArrowDownward,
	ArrowUpward,
	CheckCircle,
	ContentCopy,
	Delete,
	Error as ErrorIcon,
	KeyboardArrowRight,
	LibraryAdd,
	MoreVert,
	Pending,
	PlayArrowRounded,
	PlayCircle,
	SwapHoriz,
} from "@mui/icons-material";
import { HammerIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import {
	ActionMessages,
	type SerializedState,
	useBlocks,
} from "@semoss/renderer";
import { runPixel } from "@semoss/sdk";
import {
	ButtonGroup,
	Card,
	CircularProgress,
	Collapse,
	type CustomShapeOptions,
	Divider,
	IconButton,
	Menu,
	type MenuProps,
	Stack,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useWorkspace } from "@/hooks";
import { MCP_NOTEBOOK_NAME } from "@/pages/app/app.constants";
// TODO: MOVE TO SDK or a seperate lib specifically for utilities @semoss/utility
import { copyTextToClipboard } from "@/utility";
import { replaceInBlocks } from "@/utility/dependencyReplacer";
import { getDependentBlocks } from "@/utility/dependencyScanner";
import DuplicateIcon from "../../assets/img/Duplicate.svg";
import { DependencyPromptModal } from "../blocks-workspace";
import { AddVariableModal } from "./AddVariableModal";
import { NotebookAddCell } from "./NotebookAddCell";
import { NotebookCellConsole } from "./NotebookCellConsole";
import { Operation } from "./operations";

const StyledStack = styled(Stack)(({ theme }) => ({
	paddingBottom: theme.spacing(2),
}));

const StyledRow = styled(Stack)(() => ({
	position: "relative",
}));

const StyledStackTwo = styled(Stack)(({ theme }) => ({
	position: "absolute",
	top: theme.spacing(-1.5),
	left: theme.spacing(10.5),
	paddingLeft: theme.spacing(1.5),
	paddingRight: theme.spacing(1.5),
	zIndex: 1,
	color: theme.palette.text.disabled,
	borderRadius: theme.shape.borderRadius,
	background: theme.palette.background.paper,
	overflow: "hidden",
	"&:hover": {
		backgroundColor: theme.palette.primaryContrast["50"],
		color: theme.palette.text.disabled,
		cursor: "pointer !important",
	},
}));

const StyledName = styled(Typography)(() => ({}));

const StyledCellActions = styled(Collapse)(({ theme }) => ({
	position: "absolute",
	top: theme.spacing(-2),
	right: theme.spacing(2),
	zIndex: 1,
	borderRadius: theme.shape.borderRadius,
	background: theme.palette.background.paper,
}));

const StyledStatusIconContainer = styled("div")(({ theme }) => ({
	height: "100%",
	width: "1.5em",
	display: "flex",
	paddingTop: theme.spacing(2),
}));

const StyledCollapseStack = styled("div")(({ theme }) => ({
	paddingTop: theme.spacing(2),
	display: "flex",
	flexDirection: "row",
	alignItems: "start",
}));

const StyledActionsCollapseStack = styled(StyledCollapseStack)(() => ({
	marginTop: "0px !important",
}));

const StyledRunIconButton = styled(IconButton)(() => ({
	padding: 0,
	width: "35px",
	display: "flex",
	justifyContent: "center",
	alignItems: "start",
	// removes gray hover background made visible by width added to accomodate brackets
	"&:hover": {
		backgroundColor: "#00000000",
	},
}));

const StyledCard = styled(Card, {
	shouldForwardProp: (prop) => prop !== "isCardCellSelected",
})<{ isCardCellSelected: boolean }>(({ theme, isCardCellSelected }) => {
	const shape = theme.shape as CustomShapeOptions;

	return {
		overflow: "visible", // Changed from hidden to visible for display (Pixel) reactor methods auto-complete suggestions
		flexGrow: 1,
		cursor: isCardCellSelected ? "inherit" : "pointer",
		border: isCardCellSelected
			? `1px solid ${theme.palette.secondary.main}`
			: "unset",
		borderRadius: shape.borderRadiusSm,
		boxShadow: "none",
		"&:hover": {
			boxShadow: "none",
		},
	};
});

const StyledCardContent = styled(Card.Content)(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	alignItems: "start",
	gap: theme.spacing(2),
	margin: "0",
	padding: theme.spacing(2),
	backgroundColor: theme.palette.background.default,
}));

const StyledCardInput = styled("div")(() => ({
	width: "98%",
}));

const StyledCardActions = styled(Card.Actions)(({ theme }) => ({
	padding: theme.spacing(2),
	margin: "0",
	backgroundColor: theme.palette.background.paper,
}));

const StyledButtonLabel = styled("div")(() => ({
	display: "flex",
	alignItems: "center",
}));

const StyledButtonGroupButton = styled(ButtonGroup.Item)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
	border: `1px solid ${theme.palette.text.secondary}`,
}));

const StyledSidebar = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	cursor: "pointer",
	gap: theme.spacing(1),
}));
const StyledExpandContainer = styled("div")(() => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	height: "1.5em",
}));

const StyledExpandArrow = styled(KeyboardArrowRight, {
	shouldForwardProp: (prop) => prop !== "rotated",
})<{ rotated: boolean }>(({ theme, rotated }) => ({
	color: theme.palette.grey[600],
	transform: rotated ? "rotate(90deg)" : "",
}));

const StyledAddCellContainer = styled(Stack)(({ theme }) => ({
	marginLeft: `${theme.spacing(9)} !important`,
	height: theme.spacing(5),
}));

const StyledPlayArrowRounded = styled(PlayArrowRounded)(() => ({
	padding: "2px",
}));

const StyledArrowDownward = styled(ArrowDownward)(() => ({
	marginTop: "10px",
	marginLeft: "15px",
	position: "absolute",
	width: "10px",
}));

const StyledArrowUpward = styled(ArrowUpward)(() => ({
	marginTop: "10px",
	marginLeft: "15px",
	position: "absolute",
	width: "10px",
}));

const StyledContentCopy = styled(ContentCopy)(() => ({
	padding: "2px",
}));

const StyledLibraryAdd = styled(LibraryAdd)(() => ({
	padding: "2px",
}));

const StyledMenu = styled((props: MenuProps) => (
	<Menu
		anchorOrigin={{
			vertical: "bottom",
			horizontal: "left",
		}}
		transformOrigin={{
			vertical: "top",
			horizontal: "left",
		}}
		{...props}
	/>
))(({ theme }) => ({
	"& .MuiPaper-root": {
		marginTop: theme.spacing(1),
	},
	".MuiList-root": {
		padding: 0,
	},
}));

const StyledMenuItem = styled(Menu.Item)(() => ({
	textTransform: "capitalize",
}));

const StyledPlayWrapper = styled("span")(() => ({
	fontSize: "17px",
	display: "inline-block",
}));

const StyledPlaySpacer = styled("span")(() => ({
	display: "inline-block",
	width: "17px",
}));

const StyledDuplicateIcon = styled("img")({
	width: "1.03rem",
	height: "1.0625rem",
	display: "inline-block",
	verticalAlign: "middle",
	objectFit: "contain",
});

interface NotebookCellProps {
	/** Id of the  the query */
	queryId: string;

	/** Id of the cell of the query */
	cellId: string;

	/** Id of the cell of the query */
	cellPlayCounter: number;

	/** Id of the cell of the query */
	setCellPlayCounter: (count: number) => void;
}

/**
 * Render the content of a cell in the notebook
 */
export const NotebookCell = observer(
	(props: NotebookCellProps): JSX.Element => {
		const { queryId, cellId, cellPlayCounter, setCellPlayCounter } = props;

		const { state, notebook } = useBlocks();
		const { workspace } = useWorkspace();
		const notification = useNotification();

		const [contentExpanded, setContentExpanded] = useState(true);
		const [outputExpanded, setOutputExpanded] = useState(true);
		const [hoveredAddCellActions, setHoveredAddCellActions] =
			useState(false);
		const [showCellActions, setShowCellActions] = useState(false);

		const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
		const open = Boolean(anchorEl);

		const [localCellPlayNumber, setLocalCellPlayNumber] = useState(null);

		const [variableModal, setVariableModal] = useState(false);
		const [dependentBlocksModal, setDependentBlocksModal] = useState(false);
		const [dependentBlocks, setDependentBlocks] = useState([]);

		const cardContentRef = useRef(null);
		const cardActionsRef = useRef(null);
		const targetContentCollapseRef = useRef(null);
		const targetActionsCollapseRef = useRef(null);

		// get the cell
		const query = state.getQuery(queryId);
		const cell = query.getCell(cellId);

		const variableName = state.getAlias(queryId, cellId);

		const replacementCellOptions = useMemo(() => {
			if (!state.queries) return [];
			const allCellsList = [];
			Object.keys(state.queries).forEach((queryId) => {
				state.queries[queryId].list.forEach((cellId) => {
					if (cellId === cell.id && queryId === cell.query.id) return;
					allCellsList.push(`${queryId}--${cellId}`);
				});
			});
			return allCellsList;
		}, [state.queries, dependentBlocksModal === true]);

		useEffect(() => {
			if (cardContentRef.current) {
				const cardContentHeight = cardContentRef.current.offsetHeight; // Consider offsetHeight for borders
				if (targetContentCollapseRef.current) {
					targetContentCollapseRef.current.style.height = `${cardContentHeight}px`;
				}
			}

			if (cardActionsRef.current) {
				const cardActionsHeight = cardActionsRef.current.offsetHeight; // Consider offsetHeight for borders
				if (targetActionsCollapseRef.current) {
					targetActionsCollapseRef.current.style.height = `${cardActionsHeight}px`;
				}
			}
		}, [
			cardContentRef.current,
			contentExpanded,
			cardActionsRef.current,
			outputExpanded,
		]);

		useEffect(() => {
			if (cell.isExecuted === false) {
				setLocalCellPlayNumber(null);
			} else {
				const newPlayCount = cellPlayCounter + 1;
				setCellPlayCounter(newPlayCount);
				setLocalCellPlayNumber(newPlayCount);
			}
		}, [cell.isExecuted]);

		useEffect(() => {
			if (cellPlayCounter == null) {
				setLocalCellPlayNumber(null);
				setCellPlayCounter(null);
			}
		}, [cellPlayCounter]);

		/**
		 * Create a duplicate cell
		 */
		console.log(cell, "important");
		const duplicateCell = async () => {
			try {
				let parameters = { ...cell.parameters };

				if (
					cell.widget === "query-import" ||
					cell.widget === "data-import" ||
					cell.widget === "text-to-sql"
				) {
					parameters = {
						...parameters,
						frameVariableName: `FRAME_${Math.floor(Math.random() * 100000)}`,
					};
				}

				// copy and add the step to the end
				const newCellId = (await state.dispatch({
					message: ActionMessages.NEW_CELL,
					payload: {
						queryId: queryId,
						previousCellId: cellId,
						config: {
							widget: cell.widget,
							parameters,
						},
					},
				})) as string;

				state.dispatch({
					message: ActionMessages.ADD_VARIABLE,
					payload: {
						id: `${queryId}--${newCellId}`,
						type: "cell",
						to: queryId,
						cellId: newCellId,
					},
				});

				notebook.selectCell(queryId, newCellId);
			} catch (e) {
				console.error(e);
			}
		};

		const handleReplaceCells = async (replacements: {
			[blockId: string]: string;
		}) => {
			try {
				workspace.setLoading(true);
				const updatedStateJson = await replaceInBlocks(
					state,
					replacements,
					{
						queryId,
						cellId,
					},
				);
				const s = JSON.parse(
					JSON.stringify(updatedStateJson),
				) as SerializedState;
				await state.dispatch({
					message: ActionMessages.SET_STATE,
					payload: {
						state: s,
					},
				});
				await dispatchDeleteCell();
				notification.add({
					color: "success",
					message: "Successfully replaced cells",
				});
				workspace.setLoading(false);
			} catch (e) {
				console.error(e);
				workspace.setLoading(false);
			}
		};

		const dispatchDeleteCell = async () => {
			try {
				const currentCellIndex = query.list.indexOf(cell.id);
				state.dispatch({
					message: ActionMessages.DELETE_CELL,
					payload: {
						queryId: cell.query.id,
						cellId: cell.id,
					},
				});
				notebook.selectCell(
					queryId,
					query.list[Math.max(currentCellIndex - 1, 0)],
				);
			} catch (e) {
				console.error(e);
			}
		};
		const deleteCell = async () => {
			try {
				const dependentBlocks = await getDependentBlocks(
					state,
					queryId,
					cellId,
				);
				if (dependentBlocks.length > 0) {
					setDependentBlocksModal(true);
					setDependentBlocks(dependentBlocks);
				} else {
					dispatchDeleteCell();
				}
			} catch (e) {
				console.error(e);
			}
		};

		// render the view
		const rendered = useMemo(() => {
			if (!cell.component) {
				return;
			}

			return createElement(cell.component, {
				cell: cell,
				isExpanded: contentExpanded,
				agentModelEngine: workspace.agentModelEngine,
			});
		}, [
			cell.component ? cell.component : null,
			contentExpanded,
			workspace.agentModelEngine,
		]);

		const getExecutionTimeString = (
			timeMilliseconds: number | undefined,
		) => {
			if (timeMilliseconds) {
				const milliseconds = Math.floor(
					(timeMilliseconds % 1000) / 100,
				);
				const seconds = Math.floor((timeMilliseconds / 1000) % 60);
				const minutes = Math.floor(
					(timeMilliseconds / (1000 * 60)) % 60,
				);
				return `${minutes} min ${seconds} sec ${milliseconds} ms`;
			} else {
				return "";
			}
		};

		const getExecutionLabel = () => {
			let str = "";
			if (cell.isLoading) {
				str = "";
			} else if (cell.query.isLoading) {
				str = "";
			} else if (cell.isSuccessful || cell.isError) {
				str = getExecutionTimeString(
					cell.executionDurationMilliseconds,
				);
			} else {
				str = "Pending Execution";
			}

			return <Typography variant="caption">{str}</Typography>;
		};

		const getCellStatusIcon = () => {
			if (cell.isLoading) {
				return <CircularProgress size="1em" />;
			} else if (cell.isSuccessful) {
				return <CheckCircle color="success" />;
			} else if (cell.isError) {
				return <ErrorIcon color="error" />;
			} else {
				return <Pending color="disabled" />;
			}
		};

		const runCellAndBelowHandler = () => {
			try {
				const currentCellIndex = query.list.indexOf(cell.id);
				const allCells = query.list;

				allCells.slice(currentCellIndex).forEach((currCellId) => {
					state.dispatch({
						message: ActionMessages.RUN_CELL,
						payload: {
							queryId: cell.query.id,
							cellId: currCellId,
						},
					});
				});
			} catch (e) {
				console.error(e);
			}
		};

		const runCellsAboveHandler = () => {
			try {
				const currentCellIndex = query.list.indexOf(cell.id);
				const allCells = query.list;
				allCells.slice(0, currentCellIndex).forEach((currCellId) => {
					state.dispatch({
						message: ActionMessages.RUN_CELL,
						payload: {
							queryId: cell.query.id,
							cellId: currCellId,
						},
					});
				});
			} catch (e) {
				console.error(e);
			}
		};

		/**
		 * @description
		 * Revert MCP cell back to original code cell
		 */
		const revertMCPToCell = async () => {
			try {
				workspace.setLoading(true);
				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						queryId: cell.query.id,
						cellId: cell.id,
						path: "",
						value: cell.parameters["originalParams"],
					},
				});
				workspace.setLoading(false);
			} catch (e) {
				console.error(e);
			}
		};

		/**
		 * @description
		 * 1. make pixel call to generate python tool for cell
		 * 2. Swap cell config in place for mcp config
		 */
		const makeCellMCP = async () => {
			try {
				workspace.setLoading(true);
				// Save current app state before making MCP tool
				await runPixel(
					`SaveAppBlocksJson(project=["${workspace.appId}"], json=["<encode>${JSON.stringify(state.toJSON())}</encode>"]);`,
				);
				// Make pixel call to generate MCP tool
				const { errors, pixelReturn } = await runPixel(
					`MakeNotebookCellMCP(project="${workspace.appId}", model="${workspace.agentModelEngine}", cellId="${cell.id}")`,
				);

				workspace.setLoading(false);

				// Handle pixel call errors
				if (errors?.length) {
					notification.add({
						message: errors[0],
						color: "error",
					});
					return;
				}

				// Validate pixel return
				if (!pixelReturn?.[0]?.output) {
					throw new Error("Invalid response from pixel call");
				}

				const output = pixelReturn[0].output as {
					tools: {
						_type: string;
						name: string;
						title: string;
						description: string;
						inputSchema: {
							properties: {
								[key: string]: {
									title: string;
									description: string;
									type: string;
								};
							};
							required: string[];
							title: string;
							type: string;
						};
					}[];
				};

				// Validate output structure
				if (!output.tools?.[0]) {
					throw new Error("No tools found in pixel response");
				}

				const tool = output.tools[0];
				const toolName = tool.name;
				const toolType = tool._type;
				const properties = tool.inputSchema?.properties || {};

				// Build parameters object from schema properties
				const params = Object.keys(properties).reduce((acc, key) => {
					acc[key] = null;
					return acc;
				}, {});

				// Dispatch action to update cell configuration
				state.dispatch({
					message: ActionMessages.MAKE_CELL_MCP,
					payload: {
						queryId: cell.query.id,
						cellId: cell.id,
						parameters: {
							name: toolName,
							projectId: workspace.appId,
							originalParams: {
								widget: cell.widget,
								parameters: cell.parameters,
							},
							paramType: toolType,
							params,
						},
					},
				});
			} catch (error) {
				console.error("Error in makeCellMCP:", error);
				workspace.setLoading(false);

				notification.add({
					message: error.message || "Failed to create MCP cell",
					color: "error",
				});
			}
		};

		return (
			<StyledStack
				direction={"column"}
				gap={1}
				onMouseEnter={() => {
					setShowCellActions(true);
				}}
				onMouseLeave={() => {
					setShowCellActions(false);
				}}
				onFocus={() => {
					console.log("onFocus");
					// Keyboard Navigation
					setShowCellActions(true);
				}}
				onBlur={() => {
					console.log("onBlur");
					// Keyboard Navigation
					setShowCellActions(false);
				}}
			>
				<StyledRow direction="row" width="100%" spacing={1}>
					<StyledStackTwo
						onClick={() => {
							copyTextToClipboard(
								`{{${variableName}}}`,
								notification,
							);
						}}
					>
						<StyledName variant="subtitle2" title={"Copy variable"}>
							{variableName}
						</StyledName>
					</StyledStackTwo>

					<StyledCellActions in={showCellActions}>
						<Stack gap={1} direction={"row"} alignItems={"center"}>
							<StyledButtonGroup variant="outlined">
								{cell.query.id === MCP_NOTEBOOK_NAME && (
									<StyledButtonGroupButton
										title={
											cell.widget === "mcp-tool"
												? "Revert to Code"
												: "Make Available through MCP"
										}
										size="small"
										disabled={
											cell.isLoading ||
											cell.widget === "mcp-tool"
												? false
												: !workspace.agentModelEngine
										}
										onClick={(e) => {
											// stop propogation to card parent so newly created cell will be selected
											e.stopPropagation();
											if (cell.widget !== "mcp-tool") {
												// helper fn to make the cell mcp
												makeCellMCP();
											} else {
												// helper fn to revert the cell to code
												revertMCPToCell();
											}
										}}
									>
										<StyledButtonLabel>
											{cell.widget === "mcp-tool" ? (
												<SwapHoriz />
											) : (
												<HammerIcon size={16} />
											)}
										</StyledButtonLabel>
									</StyledButtonGroupButton>
								)}
								<StyledButtonGroupButton
									title="Run this cell and below"
									size="small"
									disabled={cell.isLoading}
									onClick={(e) => {
										// stop propogation to card parent so newly created cell will be selected
										e.stopPropagation();
										runCellAndBelowHandler();
									}}
								>
									<StyledButtonLabel>
										<StyledPlayArrowRounded fontSize="medium" />
										<StyledArrowDownward fontSize="small" />
									</StyledButtonLabel>
								</StyledButtonGroupButton>
								<StyledButtonGroupButton
									title="Run the cells above"
									size="small"
									disabled={cell.isLoading}
									onClick={(e) => {
										// stop propogation to card parent so newly created cell will be selected
										e.stopPropagation();
										runCellsAboveHandler();
									}}
								>
									<StyledButtonLabel>
										<StyledPlayArrowRounded fontSize="medium" />
										<StyledArrowUpward fontSize="small" />
									</StyledButtonLabel>
								</StyledButtonGroupButton>
								<StyledButtonGroupButton
									title="Duplicate cell"
									size="small"
									disabled={cell.isLoading}
									onClick={(e) => {
										// stop propogation to card parent so newly created cell will be selected
										e.stopPropagation();
										duplicateCell();
									}}
								>
									<StyledButtonLabel>
										<StyledDuplicateIcon
											src={DuplicateIcon}
											alt="Duplicate Icon"
										/>
									</StyledButtonLabel>
								</StyledButtonGroupButton>
								{variableName ? (
									<StyledButtonGroupButton
										title={`Copy (${variableName})`}
										size="small"
										disabled={cell.isLoading}
										onClick={(e) => {
											// stop propogation to card parent so newly created cell will be selected
											e.stopPropagation();
											copyTextToClipboard(
												`{{${variableName}}}`,
												notification,
											);
										}}
									>
										<StyledButtonLabel>
											<StyledContentCopy fontSize="small" />
										</StyledButtonLabel>
									</StyledButtonGroupButton>
								) : (
									<StyledButtonGroupButton
										title="Use as variable"
										size="small"
										disabled={cell.isLoading}
										onClick={(e) => {
											// stop propogation to card parent so newly created cell will be selected
											e.stopPropagation();
											setVariableModal(true);
										}}
									>
										<StyledButtonLabel>
											<StyledLibraryAdd fontSize="medium" />
										</StyledButtonLabel>
									</StyledButtonGroupButton>
								)}
								<StyledButtonGroupButton
									title="Delete cell"
									disabled={
										cell.isLoading || query.list.length <= 1
									}
									size="small"
									onClick={(e) => {
										e.stopPropagation();
										deleteCell();
									}}
								>
									<StyledButtonLabel>
										<Delete fontSize="small" />
									</StyledButtonLabel>
								</StyledButtonGroupButton>
								<StyledButtonGroupButton
									title="Delete cell"
									disabled={cell.isLoading}
									size="small"
									onClick={(e) => {
										e.stopPropagation();
										setAnchorEl(e.currentTarget);
									}}
								>
									<StyledButtonLabel>
										<MoreVert fontSize="small" />
									</StyledButtonLabel>
								</StyledButtonGroupButton>
							</StyledButtonGroup>
							<StyledMenu
								anchorEl={anchorEl}
								open={open}
								onClose={() => {
									setAnchorEl(null);
								}}
							>
								<StyledMenuItem
									disabled={true}
									value={"generate-with-ai"}
									onClick={() => {
										setAnchorEl(null);
									}}
								>
									Generate with AI
								</StyledMenuItem>
							</StyledMenu>
						</Stack>
					</StyledCellActions>

					<StyledSidebar>
						<StyledStatusIconContainer>
							{getCellStatusIcon()}
						</StyledStatusIconContainer>
						<Stack>
							<StyledCollapseStack
								id={`notebook-cell-${queryId}-${cellId}-card-content-collapse`}
								ref={targetContentCollapseRef}
								onClick={() => {
									setContentExpanded(!contentExpanded);
								}}
								title={`${
									contentExpanded ? "Collapse" : "Open"
								} cell ${cellId} input`}
							>
								<StyledExpandContainer>
									<StyledExpandArrow
										fontSize="small"
										rotated={contentExpanded}
									/>
								</StyledExpandContainer>
							</StyledCollapseStack>
							{cell.isExecuted &&
								cell.parameters.type !== "markdown" && (
									<StyledActionsCollapseStack
										id={`notebook-cell-${queryId}-${cellId}-card-actions-collapse`}
										ref={targetActionsCollapseRef}
										onClick={() => {
											setOutputExpanded(!outputExpanded);
										}}
										title={`${
											outputExpanded ? "Collapse" : "Open"
										} cell ${cellId} output`}
									>
										<StyledExpandContainer>
											<StyledExpandArrow
												fontSize="small"
												rotated={outputExpanded}
											/>
										</StyledExpandContainer>
									</StyledActionsCollapseStack>
								)}
						</Stack>
					</StyledSidebar>
					<StyledCard
						isCardCellSelected={
							(notebook?.selectedCell?.id ?? "") === cell.id
						}
						onClick={() => {
							notebook.selectCell(cell.query.id, cell.id);
						}}
					>
						<StyledCardContent
							id={`notebook-cell-${queryId}-${cellId}-card-content`}
							ref={cardContentRef}
						>
							<StyledRunIconButton
								title="Run cell"
								disabled={cell.isLoading}
								size="medium"
								onMouseDown={() => {
									state.dispatch({
										message: ActionMessages.RUN_CELL,
										payload: {
											queryId: cell.query.id,
											cellId: cell.id,
										},
									});
								}}
							>
								{showCellActions ? (
									<PlayCircle fontSize="inherit" />
								) : (
									<StyledPlayWrapper>
										{localCellPlayNumber ? (
											`[ ${localCellPlayNumber} ]`
										) : (
											<span>
												[<StyledPlaySpacer />]
											</span>
										)}
									</StyledPlayWrapper>
								)}
							</StyledRunIconButton>
							<StyledCardInput>{rendered}</StyledCardInput>
						</StyledCardContent>
						{cell.parameters.type !== "markdown" && (
							<div>
								{cell.widget === "code" ? (
									<div>
										{cell.messages.length > 0 && (
											<div>
												{(notebook?.selectedCell?.id ??
													"") === cell.id && (
													<Divider />
												)}
												<StyledCardActions
													id={`notebook-cell-${queryId}-${cellId}-card-actions`}
													ref={cardActionsRef}
												>
													<Stack
														id={`notebook-cell-actions-${queryId}-${cellId}`}
														direction="column"
														width="100%"
													>
														<Stack
															direction="row"
															alignItems="center"
															width="100%"
														>
															{getExecutionLabel()}
														</Stack>
														{outputExpanded && (
															<div>
																<NotebookCellConsole
																	messages={
																		cell.messages
																	}
																/>
																{cell.isExecuted
																	? cell.operation.map(
																			(
																				o,
																			) => {
																				return (
																					<Operation
																						key={`cell-operation--${cell.id}--${o}`}
																						operation={
																							o
																						}
																						output={
																							cell.output
																						}
																					/>
																				);
																			},
																		)
																	: null}
															</div>
														)}
													</Stack>
												</StyledCardActions>
											</div>
										)}
										{cell.isExecuted &&
											!cell.messages.length && (
												<div>
													{(notebook?.selectedCell
														?.id ?? "") ===
														cell.id && <Divider />}
													<StyledCardActions
														id={`notebook-cell-${queryId}-${cellId}-card-actions`}
														ref={cardActionsRef}
													>
														<Stack
															id={`notebook-cell-actions-${queryId}-${cellId}`}
															direction="column"
															width="100%"
														>
															<Stack
																direction="row"
																alignItems="center"
																width="100%"
															>
																{getExecutionLabel()}
															</Stack>
															{outputExpanded && (
																<>
																	<NotebookCellConsole
																		messages={
																			cell.messages
																		}
																	/>
																	{cell.isExecuted
																		? cell.operation.map(
																				(
																					o,
																				) => {
																					return (
																						<Operation
																							key={`cell-operation--${cell.id}--${o}`}
																							operation={
																								o
																							}
																							output={
																								cell.output
																							}
																						/>
																					);
																				},
																			)
																		: null}
																</>
															)}
														</Stack>
													</StyledCardActions>
												</div>
											)}
									</div>
								) : (
									<div>
										{cell.isExecuted && (
											<div>
												{(notebook?.selectedCell?.id ??
													"") === cell.id && (
													<Divider />
												)}
												<StyledCardActions
													id={`notebook-cell-${queryId}-${cellId}-card-actions`}
													ref={cardActionsRef}
												>
													<Stack
														id={`notebook-cell-actions-${queryId}-${cellId}`}
														direction="column"
														width="100%"
													>
														<Stack
															direction="row"
															alignItems="center"
															width="100%"
														>
															{getExecutionLabel()}
														</Stack>
														{outputExpanded && (
															<>
																<NotebookCellConsole
																	messages={
																		cell.messages
																	}
																/>
																{cell.isExecuted
																	? cell.operation.map(
																			(
																				o,
																			) => {
																				return (
																					<Operation
																						key={`cell-operation--${cell.id}--${o}`}
																						operation={
																							o
																						}
																						output={
																							cell.output
																						}
																						cellData={{
																							cellId: cell.id.toString(),
																							queryId:
																								queryId.toString(),
																						}}
																					/>
																				);
																			},
																		)
																	: null}
															</>
														)}
													</Stack>
												</StyledCardActions>
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</StyledCard>
				</StyledRow>
				<StyledAddCellContainer
					onMouseEnter={() => {
						setHoveredAddCellActions(true);
					}}
					onMouseLeave={() => {
						setHoveredAddCellActions(false);
					}}
					onFocus={() => {
						// Keyboard Navigation
						setHoveredAddCellActions(true);
					}}
					onBlur={() => {
						// Keyboard Navigation
						setHoveredAddCellActions(false);
					}}
				>
					<Collapse
						in={
							(notebook?.selectedCell?.id ?? "") === cell.id ||
							hoveredAddCellActions
						}
					>
						<NotebookAddCell
							query={cell.query}
							previousCellId={cell.id}
						/>
					</Collapse>
				</StyledAddCellContainer>

				<AddVariableModal
					open={variableModal}
					type={"cell"}
					to={queryId}
					cellId={cellId}
					onClose={() => {
						setVariableModal(false);
					}}
				/>

				<DependencyPromptModal
					open={dependentBlocksModal}
					onClose={() => {
						setDependentBlocksModal(false);
					}}
					onDelete={() => dispatchDeleteCell()}
					onReplace={handleReplaceCells}
					dependents={dependentBlocks}
					replacementOptions={replacementCellOptions}
				/>
			</StyledStack>
		);
	},
);
