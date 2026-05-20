import {
	ArrowDown,
	ArrowLeftRight,
	ArrowUp,
	BookPlus,
	ChevronRight,
	Copy,
	HammerIcon,
	Maximize2,
	Play,
	Trash2,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import {
	ActionMessages,
	type SerializedState,
	useBlocks,
} from "@semoss/renderer";
import { runPixel } from "@semoss/sdk";
import {
	Button,
	ButtonGroup,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Separator,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
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

		const [showRaw, setShowRaw] = useState(false);
		const [showConsole, setShowConsole] = useState(false);
		const [showLoggingModal, setShowLoggingModal] = useState(false);
		const [showCellActions, setShowCellActions] = useState(false);

		const [localCellPlayNumber, setLocalCellPlayNumber] = useState(null);

		const [variableModal, setVariableModal] = useState(false);
		const [dependentBlocksModal, setDependentBlocksModal] = useState(false);
		const [dependentBlocks, setDependentBlocks] = useState([]);

		const cardContentRef = useRef(null);
		const cardActionsRef = useRef(null);

		// get the cell
		const query = state.getQuery(queryId);
		const cell = query.getCell(cellId);

		const variableName = state.getAlias(queryId, cellId);

		// biome-ignore lint/correctness/useExhaustiveDependencies: dependentBlocksModal is intentional dep
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

		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only react to isExecuted
		useEffect(() => {
			if (cell.isExecuted === false) {
				setLocalCellPlayNumber(null);
			} else {
				const newPlayCount = cellPlayCounter + 1;
				setCellPlayCounter(newPlayCount);
				setLocalCellPlayNumber(newPlayCount);
			}
		}, [cell.isExecuted]);

		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only react to counter
		useEffect(() => {
			if (cellPlayCounter == null) {
				setLocalCellPlayNumber(null);
				setCellPlayCounter(null);
			}
		}, [cellPlayCounter]);

		/**
		 * Create a duplicate cell
		 */
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
				toast.success("Successfully replaced cells");
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
		// biome-ignore lint/correctness/useExhaustiveDependencies: cell.component is stable once set
		const rendered = useMemo(() => {
			if (!cell.component) {
				return;
			}

			return createElement(cell.component, {
				cell: cell,
				isExpanded: true,
				agentModelEngine: workspace.agentModelEngine,
			});
		}, [
			cell.component ? cell.component : null,
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

		const getCompactExecutionTime = (ms: number | undefined) => {
			if (!ms) return "";
			if (ms < 1000) return `${ms}ms`;
			if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
			const minutes = Math.floor(ms / 60000);
			const seconds = Math.floor((ms % 60000) / 1000);
			return `${minutes}m ${seconds}s`;
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
						value: cell.parameters.originalParams,
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
					toast.error(errors[0]);
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

				toast.error(error.message || "Failed to create MCP cell");
			}
		};

		const isCellSelected = (notebook?.selectedCell?.id ?? "") === cell.id;

		const rawOutput =
			cell.output == null
				? ""
				: typeof cell.output === "string"
					? cell.output
					: JSON.stringify(cell.output, null, 2);

		const outputHeader = cell.isExecuted ? (
			<div className="flex w-full flex-row items-center justify-between">
				<span className="text-muted-foreground text-xs">Output</span>
				<div className="flex items-center gap-1">
					<Button
						variant={showRaw ? "secondary" : "ghost"}
						size="sm"
						className="h-7 px-2 text-xs"
						onClick={() => setShowRaw((v) => !v)}
					>
						{showRaw ? "Formatted" : "Raw"}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 px-2 text-muted-foreground text-xs"
						onClick={() => copyTextToClipboard(rawOutput)}
					>
						<Copy className="size-3" /> Copy
					</Button>
				</div>
			</div>
		) : null;

		const consoleSection =
			cell.messages.length > 0 ? (
				<div className="flex flex-col">
					<div className="flex w-full items-center justify-between">
						<Button
							variant="ghost"
							size="sm"
							className="!px-0 h-7 text-muted-foreground text-xs hover:bg-transparent"
							onClick={() => setShowConsole((v) => !v)}
						>
							<ChevronRight
								className={`size-3 transition-transform ${showConsole ? "rotate-90" : ""}`}
							/>
							Logging ({cell.messages.length})
						</Button>
						{showConsole && (
							<div className="flex items-center gap-1">
								<Button
									title="Expand"
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-muted-foreground"
									onClick={() => setShowLoggingModal(true)}
								>
									<Maximize2 className="size-3" />
								</Button>
								<Button
									title="Copy logs"
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-muted-foreground"
									onClick={() =>
										copyTextToClipboard(
											cell.messages.join("\n"),
										)
									}
								>
									<Copy className="size-3" />
								</Button>
							</div>
						)}
					</div>
					{showConsole && (
						<div className="max-h-[200px] overflow-y-auto rounded bg-muted/30 px-2 py-1">
							<NotebookCellConsole messages={cell.messages} />
						</div>
					)}
				</div>
			) : null;

		const cellOutput = (
			<div
				id={`notebook-cell-${queryId}-${cellId}-card-actions`}
				ref={cardActionsRef}
				className="flex flex-col gap-1 bg-background p-2"
			>
				{consoleSection}
				{outputHeader}
				{cell.isExecuted ? (
					<div className="max-h-[300px] overflow-y-auto rounded bg-muted/30 px-2 py-1">
						{showRaw ? (
							<pre className="whitespace-pre-wrap break-all font-mono text-xs">
								{rawOutput}
							</pre>
						) : (
							cell.operation.map((o) => (
								<Operation
									key={`cell-operation--${cell.id}--${o}`}
									operation={o}
									output={cell.output}
								/>
							))
						)}
					</div>
				) : null}
			</div>
		);

		const cellOutputWithFrame = (
			<div
				id={`notebook-cell-${queryId}-${cellId}-card-actions`}
				ref={cardActionsRef}
				className="flex flex-col gap-1 bg-background p-2"
			>
				{consoleSection}
				{outputHeader}
				{cell.isExecuted ? (
					<div className="rounded bg-muted/30 px-2 py-1">
						{showRaw ? (
							<pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
								{rawOutput}
							</pre>
						) : (
							cell.operation.map((o) => (
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
						)}
					</div>
				) : null}
			</div>
		);

		return (
			// biome-ignore lint/a11y/noStaticElementInteractions: hover zone for cell actions
			<div
				className="flex flex-col gap-1 pb-2"
				onMouseEnter={() => setShowCellActions(true)}
				onMouseLeave={() => setShowCellActions(false)}
				onFocus={() => setShowCellActions(true)}
				onBlur={() => setShowCellActions(false)}
			>
				<div className="relative flex w-full flex-row gap-2">
					{/* Variable name label */}
					<button
						type="button"
						className="absolute top-[-12px] left-[calc(theme(spacing.10)+theme(spacing.6))] z-10 cursor-pointer overflow-hidden rounded bg-background px-1.5 py-0.5 text-muted-foreground text-xs transition-colors hover:bg-primary/10"
						onClick={() =>
							copyTextToClipboard(`{{${variableName}}}`)
						}
					>
						{variableName}
					</button>

					{/* Cell actions bar (visible on hover) */}
					{showCellActions && (
						<div className="absolute top-[-16px] right-2 z-10 rounded bg-background">
							<div className="flex items-center gap-1">
								<ButtonGroup className="border">
									{cell.query.id === MCP_NOTEBOOK_NAME && (
										<Button
											title={
												cell.widget === "mcp-tool"
													? "Revert to Code"
													: "Make Available through MCP"
											}
											variant="ghost"
											size="sm"
											className="h-7 px-2"
											disabled={
												cell.isLoading ||
												cell.widget === "mcp-tool"
													? false
													: !workspace.agentModelEngine
											}
											onClick={(e) => {
												e.stopPropagation();
												if (
													cell.widget !== "mcp-tool"
												) {
													makeCellMCP();
												} else {
													revertMCPToCell();
												}
											}}
										>
											{cell.widget === "mcp-tool" ? (
												<ArrowLeftRight className="size-4" />
											) : (
												<HammerIcon size={14} />
											)}
										</Button>
									)}
									<Button
										title="Run this cell and below"
										variant="ghost"
										size="sm"
										className="relative h-7 px-2"
										disabled={cell.isLoading}
										onClick={(e) => {
											e.stopPropagation();
											runCellAndBelowHandler();
										}}
									>
										<Play className="size-4" />
										<ArrowDown className="absolute right-0.5 bottom-0.5 size-2.5" />
									</Button>
									<Button
										title="Run the cells above"
										variant="ghost"
										size="sm"
										className="relative h-7 px-2"
										disabled={cell.isLoading}
										onClick={(e) => {
											e.stopPropagation();
											runCellsAboveHandler();
										}}
									>
										<Play className="size-4" />
										<ArrowUp className="absolute right-0.5 bottom-0.5 size-2.5" />
									</Button>
									<Button
										title="Duplicate cell"
										variant="ghost"
										size="sm"
										className="h-7 px-2"
										disabled={cell.isLoading}
										onClick={(e) => {
											e.stopPropagation();
											duplicateCell();
										}}
									>
										<img
											src={DuplicateIcon}
											alt="Duplicate Icon"
											className="size-4 object-contain"
										/>
									</Button>
									{variableName ? (
										<Button
											title={`Copy (${variableName})`}
											variant="ghost"
											size="sm"
											className="h-7 px-2"
											disabled={cell.isLoading}
											onClick={(e) => {
												e.stopPropagation();
												copyTextToClipboard(
													`{{${variableName}}}`,
												);
											}}
										>
											<Copy className="size-4" />
										</Button>
									) : (
										<Button
											title="Use as variable"
											variant="ghost"
											size="sm"
											className="h-7 px-2"
											disabled={cell.isLoading}
											onClick={(e) => {
												e.stopPropagation();
												setVariableModal(true);
											}}
										>
											<BookPlus className="size-4" />
										</Button>
									)}
									<Button
										title="Delete cell"
										variant="ghost"
										size="sm"
										className="h-7 px-2"
										disabled={
											cell.isLoading ||
											query.list.length <= 1
										}
										onClick={(e) => {
											e.stopPropagation();
											deleteCell();
										}}
									>
										<Trash2 className="size-4" />
									</Button>
								</ButtonGroup>
							</div>
						</div>
					)}

					{/* Card */}
					{/* biome-ignore lint/a11y/noStaticElementInteractions: card container, selecting cell on click */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: card container, keyboard nav handled by inner buttons */}
					<div
						className={`min-w-0 flex-grow overflow-visible rounded-sm border bg-background transition-colors ${isCellSelected ? "border-border border-l-[3px] border-l-primary" : "border-border/40 border-l-[3px] border-l-transparent"} cursor-pointer`}
						onClick={() =>
							notebook.selectCell(cell.query.id, cell.id)
						}
					>
						{/* Card content */}
						<div
							id={`notebook-cell-${queryId}-${cellId}-card-content`}
							ref={cardContentRef}
							className="flex flex-row items-start gap-2 px-3 py-2"
						>
							<div className="flex w-14 shrink-0 flex-col items-start gap-0.5 pt-0.5">
								<button
									type="button"
									title="Run cell"
									disabled={cell.isLoading}
									className={`flex items-center gap-1 font-mono text-xs hover:bg-transparent disabled:opacity-70 ${
										cell.isLoading
											? "text-muted-foreground"
											: cell.isSuccessful
												? "text-green-600 hover:text-green-700"
												: cell.isError
													? "text-destructive hover:text-destructive/80"
													: "text-muted-foreground hover:text-primary"
									}`}
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
									{cell.isLoading ? (
										<Spinner className="size-3 shrink-0" />
									) : (
										<Play className="size-3 shrink-0" />
									)}
									<span>
										{cell.isLoading
											? "[*]:"
											: localCellPlayNumber
												? `[${localCellPlayNumber}]:`
												: "[ ]:"}
									</span>
								</button>
								{(cell.isSuccessful || cell.isError) && (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="font-mono text-[10px] text-muted-foreground leading-tight">
												{getCompactExecutionTime(
													cell.executionDurationMilliseconds,
												)}
											</span>
										</TooltipTrigger>
										<TooltipContent>
											{getExecutionTimeString(
												cell.executionDurationMilliseconds,
											)}
										</TooltipContent>
									</Tooltip>
								)}
							</div>
							<div className="min-w-0 flex-1">{rendered}</div>
						</div>

						{/* Card output area */}
						{cell.parameters.type !== "markdown" && (
							<div>
								{cell.widget === "code" ? (
									<div>
										{cell.messages.length > 0 && (
											<div>
												{isCellSelected && (
													<Separator />
												)}
												{cellOutput}
											</div>
										)}
										{cell.isExecuted &&
											!cell.messages.length && (
												<div>
													{isCellSelected && (
														<Separator />
													)}
													{cellOutput}
												</div>
											)}
									</div>
								) : (
									<div>
										{cell.isExecuted && (
											<div>
												{isCellSelected && (
													<Separator />
												)}
												{cellOutputWithFrame}
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Add cell area — always mounted, CSS controls visibility */}
				<NotebookAddCell query={cell.query} previousCellId={cell.id} />

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

				<Dialog
					open={showLoggingModal}
					onOpenChange={(o) => !o && setShowLoggingModal(false)}
				>
					<DialogContent className="flex max-h-[80vh] w-[80vw] max-w-[80vw] flex-col sm:max-w-[80vw]">
						<DialogHeader>
							<DialogTitle>
								Logging ({cell.messages.length})
							</DialogTitle>
						</DialogHeader>
						<div className="relative flex-1 overflow-hidden rounded bg-muted/30">
							<Button
								title="Copy logs"
								variant="ghost"
								size="sm"
								className="absolute top-1 right-1 z-10 h-7 px-2 text-muted-foreground"
								onClick={() =>
									copyTextToClipboard(
										cell.messages.join("\n"),
									)
								}
							>
								<Copy className="size-3" />
							</Button>
							<div className="h-full overflow-y-auto px-3 py-2">
								<NotebookCellConsole messages={cell.messages} />
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		);
	},
);
