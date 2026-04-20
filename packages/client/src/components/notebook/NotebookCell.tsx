import {
	ArrowDown as ArrowDownward,
	ArrowUp as ArrowUpward,
	CheckCircle,
	Copy as ContentCopy,
	Trash2 as Delete,
	AlertCircle as ErrorIcon,
	ChevronRight as KeyboardArrowRight,
	FolderPlus as LibraryAdd,
	Loader2,
	MoreVertical as MoreVert,
	Clock as Pending,
	ArrowLeftRight as SwapHoriz,
} from "lucide-react";
import { HammerIcon, PlayCircle } from "lucide-react";
const PlayArrowRounded = PlayCircle;
import { observer } from "mobx-react-lite";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import {
	ActionMessages,
	type SerializedState,
	useBlocks,
} from "@semoss/renderer";
import { runPixel } from "@semoss/sdk";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	toast,
} from "@semoss/ui/next";
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

		// notification-compatible wrapper for toast
		const notification = {
			add: ({ color, message }: { color: string; message: string }) => {
				if (color === "success") toast.success(message);
				else if (color === "error") toast.error(message);
				else toast(message);
			},
		};

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

			return <span className="text-xs">{str}</span>;
		};

		const getCellStatusIcon = () => {
			if (cell.isLoading) {
				return <Loader2 className="h-6 w-6 animate-spin" />;
			} else if (cell.isSuccessful) {
				return <CheckCircle className="h-6 w-6 text-green-600" />;
			} else if (cell.isError) {
				return <ErrorIcon className="h-6 w-6 text-destructive" />;
			} else {
				return <Pending className="h-6 w-6 text-muted-foreground" />;
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

		const isCardSelected = (notebook?.selectedCell?.id ?? "") === cell.id;

		return (
			<div
				className="flex flex-col gap-2 pb-4"
				onMouseEnter={() => {
					setShowCellActions(true);
				}}
				onMouseLeave={() => {
					setShowCellActions(false);
				}}
				onFocus={() => {
					console.log("onFocus");
					setShowCellActions(true);
				}}
				onBlur={() => {
					console.log("onBlur");
					setShowCellActions(false);
				}}
			>
				<div className="relative flex flex-row w-full min-w-0 gap-2">
					{/* Variable name label */}
					<div
						className="absolute z-[1] bg-background rounded overflow-hidden px-3 hover:bg-blue-50 hover:cursor-pointer"
						style={{ top: "-12px", left: "84px" }}
						onClick={() => {
							copyTextToClipboard(
								`{{${variableName}}}`,
								notification,
							);
						}}
					>
						<span className="text-sm text-muted-foreground" title="Copy variable">
							{variableName}
						</span>
					</div>

					{/* Cell actions toolbar */}
					{showCellActions && (
						<Popover open={open} onOpenChange={(isOpen) => { if (!isOpen) setAnchorEl(null); }}>
							<div
								className="absolute z-[1] rounded bg-background"
								style={{ top: "-16px", right: "16px" }}
							>
								<div className="flex gap-2 items-center">
									<PopoverAnchor asChild>
										<div className="inline-flex border border-muted-foreground rounded">
											{cell.query.id === MCP_NOTEBOOK_NAME && (
												<button
													type="button"
													title={
														cell.widget === "mcp-tool"
															? "Revert to Code"
															: "Make Available through MCP"
													}
													className="px-2 py-1 text-muted-foreground hover:bg-accent disabled:opacity-50"
													disabled={
														cell.isLoading ||
														(cell.widget === "mcp-tool"
															? false
															: !workspace.agentModelEngine)
													}
													onClick={(e) => {
														e.stopPropagation();
														if (cell.widget !== "mcp-tool") {
															makeCellMCP();
														} else {
															revertMCPToCell();
														}
													}}
												>
													<span className="flex items-center">
														{cell.widget === "mcp-tool" ? (
															<SwapHoriz className="h-5 w-5" />
														) : (
															<HammerIcon size={20} />
														)}
													</span>
												</button>
											)}
											<button
												type="button"
												title="Run this cell and below"
												className="px-2 py-1 text-muted-foreground hover:bg-accent disabled:opacity-50"
												disabled={cell.isLoading}
												onClick={(e) => {
													e.stopPropagation();
													runCellAndBelowHandler();
												}}
											>
												<span className="flex items-center relative">
													<PlayArrowRounded className="h-4 w-4" style={{ padding: "2px" }} />
													<ArrowDownward
														className="absolute"
														style={{ marginTop: "10px", marginLeft: "15px", width: "10px" }}
													/>
												</span>
											</button>
											<button
												type="button"
												title="Run the cells above"
												className="px-2 py-1 text-muted-foreground hover:bg-accent disabled:opacity-50"
												disabled={cell.isLoading}
												onClick={(e) => {
													e.stopPropagation();
													runCellsAboveHandler();
												}}
											>
												<span className="flex items-center relative">
													<PlayArrowRounded className="h-4 w-4" style={{ padding: "2px" }} />
													<ArrowUpward
														className="absolute"
														style={{ marginTop: "10px", marginLeft: "15px", width: "10px" }}
													/>
												</span>
											</button>
											<button
												type="button"
												title="Duplicate cell"
												className="px-2 py-1 text-muted-foreground hover:bg-accent disabled:opacity-50"
												disabled={cell.isLoading}
												onClick={(e) => {
													e.stopPropagation();
													duplicateCell();
												}}
											>
												<span className="flex items-center">
													<img
														src={DuplicateIcon}
														alt="Duplicate Icon"
														className="inline-block align-middle object-contain"
														style={{ width: "1.25rem", height: "1.25rem" }}
													/>
												</span>
											</button>
											{variableName ? (
												<button
													type="button"
													title={`Copy (${variableName})`}
													className="px-2 py-1 text-muted-foreground hover:bg-accent disabled:opacity-50"
													disabled={cell.isLoading}
													onClick={(e) => {
														e.stopPropagation();
														copyTextToClipboard(
															`{{${variableName}}}`,
															notification,
														);
													}}
												>
													<span className="flex items-center">
														<ContentCopy className="h-5 w-5" />
													</span>
												</button>
											) : (
												<button
													type="button"
													title="Use as variable"
													className="px-2 py-1 text-muted-foreground hover:bg-accent disabled:opacity-50"
													disabled={cell.isLoading}
													onClick={(e) => {
														e.stopPropagation();
														setVariableModal(true);
													}}
												>
													<span className="flex items-center">
														<LibraryAdd className="h-5 w-5" />
													</span>
												</button>
											)}
											<button
												type="button"
												title="Delete cell"
												className="px-2 py-1 text-muted-foreground hover:bg-accent disabled:opacity-50"
												disabled={
													cell.isLoading || query.list.length <= 1
												}
												onClick={(e) => {
													e.stopPropagation();
													deleteCell();
												}}
											>
												<span className="flex items-center">
													<Delete className="h-5 w-5" />
												</span>
											</button>
											<button
												type="button"
												title="More actions"
												className="px-2 py-1 text-muted-foreground hover:bg-accent disabled:opacity-50"
												disabled={cell.isLoading}
												onClick={(e) => {
													e.stopPropagation();
													setAnchorEl(e.currentTarget);
												}}
											>
												<span className="flex items-center">
													<MoreVert className="h-5 w-5" />
												</span>
											</button>
										</div>
									</PopoverAnchor>
									<PopoverContent align="start" className="w-auto p-0">
										<button
											type="button"
											disabled={true}
											className="flex w-full px-4 py-2 capitalize text-sm opacity-50"
											onClick={() => {
												setAnchorEl(null);
											}}
										>
											Generate with AI
										</button>
									</PopoverContent>
								</div>
							</div>
						</Popover>
					)}

					{/* Sidebar: status icon + collapse arrows */}
					<div className="flex flex-row cursor-pointer gap-2 items-start">
						<div className="flex items-center justify-center pt-4 w-6">
							{getCellStatusIcon()}
						</div>
						<div className="flex flex-col">
							<div
								id={`notebook-cell-${queryId}-${cellId}-card-content-collapse`}
								ref={targetContentCollapseRef}
								className="pt-4 flex flex-row items-start"
								onClick={() => {
									setContentExpanded(!contentExpanded);
								}}
								title={`${contentExpanded ? "Collapse" : "Open"} cell ${cellId} input`}
							>
								<div className="flex items-center justify-center h-[1.5em]">
									<KeyboardArrowRight
										className="h-3.5 w-3.5 text-gray-600"
										style={{
											transform: contentExpanded ? "rotate(90deg)" : "",
											transition: "transform 0.2s",
										}}
									/>
								</div>
							</div>
							{cell.isExecuted &&
								cell.parameters.type !== "markdown" && (
									<div
										id={`notebook-cell-${queryId}-${cellId}-card-actions-collapse`}
										ref={targetActionsCollapseRef}
										className="flex flex-row items-start"
										style={{ marginTop: 0 }}
										onClick={() => {
											setOutputExpanded(!outputExpanded);
										}}
										title={`${outputExpanded ? "Collapse" : "Open"} cell ${cellId} output`}
									>
										<div className="flex items-center justify-center h-[1.5em]">
											<KeyboardArrowRight
											className="h-3.5 w-3.5 text-gray-600"
												style={{
													transform: outputExpanded ? "rotate(90deg)" : "",
													transition: "transform 0.2s",
												}}
											/>
										</div>
									</div>
								)}
						</div>
					</div>

					{/* Card */}
					<div
						className="flex-grow min-w-0 rounded-sm"
						style={{
							cursor: isCardSelected ? "inherit" : "pointer",
							border: isCardSelected
								? "1px solid hsl(var(--border))"
								: "unset",
							boxShadow: "none",
						}}
						onClick={() => {
							notebook.selectCell(cell.query.id, cell.id);
						}}
					>
						{/* Card content */}
						<div
							id={`notebook-cell-${queryId}-${cellId}-card-content`}
							ref={cardContentRef}
							className="flex flex-row items-start gap-4 m-0 p-4 bg-muted/50"
						>
							<button
								type="button"
								title="Run cell"
								disabled={cell.isLoading}
								className="p-0 w-[35px] shrink-0 flex justify-center items-start border-none bg-transparent hover:bg-transparent cursor-pointer"
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
									<PlayCircle className="h-5 w-5" />
								) : (
									<span className="text-[17px] inline-flex items-center font-mono leading-none whitespace-nowrap">
										{localCellPlayNumber ? (
											`[ ${localCellPlayNumber} ]`
										) : (
											<span className="inline-flex items-center">
												[<span className="inline-block w-[17px]" />]
											</span>
										)}
									</span>
								)}
							</button>
							<div className="flex-1 min-w-0">{rendered}</div>
						</div>

						{/* Card actions / output */}
						{cell.parameters.type !== "markdown" && (
							<div>
								{cell.widget === "code" ? (
									<div>
										{cell.messages.length > 0 && (
											<div>
												{isCardSelected && (
													<hr className="border-t border-border" />
												)}
												<div
													id={`notebook-cell-${queryId}-${cellId}-card-actions`}
													ref={cardActionsRef}
													className="p-4 m-0 bg-background"
												>
													<div
														id={`notebook-cell-actions-${queryId}-${cellId}`}
														className="flex flex-col w-full"
													>
														<div className="flex flex-row items-center w-full">
															{getExecutionLabel()}
														</div>
														{outputExpanded && (
															<div>
																<NotebookCellConsole
																	messages={cell.messages}
																/>
																{cell.isExecuted
																	? cell.operation.map((o) => (
																			<Operation
																				key={`cell-operation--${cell.id}--${o}`}
																				operation={o}
																				output={cell.output}
																			/>
																		))
																	: null}
															</div>
														)}
													</div>
												</div>
											</div>
										)}
										{cell.isExecuted &&
											!cell.messages.length && (
												<div>
													{isCardSelected && (
														<hr className="border-t border-border" />
													)}
													<div
														id={`notebook-cell-${queryId}-${cellId}-card-actions`}
														ref={cardActionsRef}
														className="p-4 m-0 bg-background"
													>
														<div
															id={`notebook-cell-actions-${queryId}-${cellId}`}
															className="flex flex-col w-full"
														>
															<div className="flex flex-row items-center w-full">
																{getExecutionLabel()}
															</div>
															{outputExpanded && (
																<>
																	<NotebookCellConsole
																		messages={cell.messages}
																	/>
																	{cell.isExecuted
																		? cell.operation.map((o) => (
																				<Operation
																					key={`cell-operation--${cell.id}--${o}`}
																					operation={o}
																					output={cell.output}
																				/>
																			))
																		: null}
																</>
															)}
														</div>
													</div>
												</div>
											)}
									</div>
								) : (
									<div>
										{cell.isExecuted && (
											<div>
												{isCardSelected && (
													<hr className="border-t border-border" />
												)}
												<div
													id={`notebook-cell-${queryId}-${cellId}-card-actions`}
													ref={cardActionsRef}
													className="p-4 m-0 bg-background"
												>
													<div
														id={`notebook-cell-actions-${queryId}-${cellId}`}
														className="flex flex-col w-full"
													>
														<div className="flex flex-row items-center w-full">
															{getExecutionLabel()}
														</div>
														{outputExpanded && (
															<>
																<NotebookCellConsole
																	messages={cell.messages}
																/>
																{cell.isExecuted
																	? cell.operation.map((o) => (
																			<Operation
																				key={`cell-operation--${cell.id}--${o}`}
																				operation={o}
																				output={cell.output}
																				cellData={{
																					cellId: cell.id.toString(),
																					queryId: queryId.toString(),
																				}}
																			/>
																		))
																	: null}
															</>
														)}
													</div>
												</div>
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Add cell button area */}
				<div
					className="h-10"
					style={{ marginLeft: "72px" }}
					onMouseEnter={() => {
						setHoveredAddCellActions(true);
					}}
					onMouseLeave={() => {
						setHoveredAddCellActions(false);
					}}
					onFocus={() => {
						setHoveredAddCellActions(true);
					}}
					onBlur={() => {
						setHoveredAddCellActions(false);
					}}
				>
					{(isCardSelected || hoveredAddCellActions) && (
						<NotebookAddCell
							query={cell.query}
							previousCellId={cell.id}
						/>
					)}
				</div>

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
			</div>
		);
	},
);
