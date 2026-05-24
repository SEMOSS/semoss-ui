import {
	ArrowDown,
	ArrowLeftRight,
	ArrowUp,
	BookPlus,
	Braces,
	ChevronRight,
	ChevronsDownUp,
	ChevronsUpDown,
	Copy,
	CopyPlus,
	GripVertical,
	HammerIcon,
	Maximize2,
	MoreVertical,
	Pencil,
	Play,
	Trash2,
	X,
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
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
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
import { copyTextToClipboard, isOutputJSON } from "@/utility";
import { replaceInBlocks } from "@/utility/dependencyReplacer";
import { getDependentBlocks } from "@/utility/dependencyScanner";
import { DependencyPromptModal } from "../blocks-workspace";
import { AddVariableModal } from "./AddVariableModal";
import { NotebookAddCell } from "./notebook-add-cell";
import { NotebookCellConsole } from "./notebook-cell-console";
import { Operation } from "./operations";
import { RenameVariableDialog } from "./rename-variable-dialog";
import { noLigatureStyle } from "./variable-references";

interface NotebookCellProps {
	/** Id of the  the query */
	queryId: string;

	/** Id of the cell of the query */
	cellId: string;

	/** Id of the cell of the query */
	cellPlayCounter: number;

	/** Id of the cell of the query */
	setCellPlayCounter: (count: number) => void;

	/** Drag handle props injected by SortableItems (dnd-kit attrs + listeners) */
	dragHandleProps?: React.HTMLAttributes<HTMLElement>;
}

/**
 * Render the content of a cell in the notebook
 */
export const NotebookCell = observer(
	(props: NotebookCellProps): JSX.Element => {
		const {
			queryId,
			cellId,
			cellPlayCounter,
			setCellPlayCounter,
			dragHandleProps,
		} = props;

		const { state, notebook } = useBlocks();
		const { workspace } = useWorkspace();

		const [showRaw, setShowRaw] = useState(false);
		const [showConsole, setShowConsole] = useState(false);
		const [showLoggingModal, setShowLoggingModal] = useState(false);
		const [showOutputModal, setShowOutputModal] = useState(false);
		const [expandAllOutput, setExpandAllOutput] = useState(false);

		const [renameOpen, setRenameOpen] = useState(false);

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
				// Include the current cell as well as everything above it.
				allCells
					.slice(0, currentCellIndex + 1)
					.forEach((currCellId) => {
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

		const outputIsJson = useMemo(
			() => isOutputJSON(cell.output) != null,
			[cell.output],
		);

		const outputStats = useMemo(() => {
			const lines = rawOutput ? rawOutput.split("\n").length : 0;
			const bytes = rawOutput
				? new TextEncoder().encode(rawOutput).length
				: 0;
			return { lines, bytes };
		}, [rawOutput]);

		const formatBytes = (bytes: number) => {
			if (bytes < 1024) return `${bytes} bytes`;
			if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
			return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
		};

		const renderOutputHeader = (onExpand?: () => void) => (
			<div className="flex w-full flex-row items-center justify-between gap-2 px-1">
				<div className="flex min-w-0 items-center gap-2">
					<Braces className="size-3.5 text-muted-foreground" />
					<span className="font-medium text-foreground text-xs">
						Output
					</span>
					{outputIsJson && (
						<span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
							JSON
						</span>
					)}
				</div>
				<div className="flex items-center gap-1">
					<Button
						title={showRaw ? "Show formatted" : "Show raw"}
						variant={showRaw ? "secondary" : "ghost"}
						size="sm"
						className="h-7 px-2 text-xs"
						onClick={() => setShowRaw((v) => !v)}
					>
						{showRaw ? "Formatted" : "Raw"}
					</Button>
					<Button
						title="Copy output"
						variant="ghost"
						size="sm"
						className="h-7 px-2 text-muted-foreground"
						onClick={() => copyTextToClipboard(rawOutput)}
					>
						<Copy className="size-3" />
					</Button>
					{onExpand && (
						<Button
							title="Expand"
							variant="ghost"
							size="sm"
							className="h-7 px-2 text-muted-foreground"
							onClick={onExpand}
						>
							<Maximize2 className="size-3" />
						</Button>
					)}
				</div>
			</div>
		);

		const renderOutputFooter = () => (
			<div className="flex w-full flex-row items-center justify-between gap-2 px-1 pt-1 text-muted-foreground text-xs">
				<span className="font-mono">
					{outputStats.lines}{" "}
					{outputStats.lines === 1 ? "line" : "lines"}
					{" · "}
					{formatBytes(outputStats.bytes)}
				</span>
				{!showRaw && outputIsJson && (
					<button
						type="button"
						aria-label={
							expandAllOutput
								? "Collapse all JSON nodes"
								: "Expand all JSON nodes"
						}
						className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
						onClick={() => setExpandAllOutput((v) => !v)}
					>
						{expandAllOutput ? (
							<ChevronsDownUp className="size-3" />
						) : (
							<ChevronsUpDown className="size-3" />
						)}
						{expandAllOutput ? "Collapse all" : "Expand all"}
					</button>
				)}
			</div>
		);

		const outputHeader = cell.isExecuted
			? renderOutputHeader(() => setShowOutputModal(true))
			: null;

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
					<>
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
										expandAll={expandAllOutput}
										hideJsonToggle
									/>
								))
							)}
						</div>
						{renderOutputFooter()}
					</>
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
				{cell.isExecuted
					? (() => {
							const isFrameOp = (o: string) =>
								o === "FRAME_DATA_CHANGE" ||
								o === "FRAME_FILTER_CHANGE";
							const frameOps = cell.operation.filter(isFrameOp);
							const nonFrameOps = cell.operation.filter(
								(o) => !isFrameOp(o),
							);
							return (
								<div className="flex flex-col gap-2">
									<div className="rounded bg-muted/30 px-2 py-1">
										{showRaw ? (
											<pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
												{rawOutput}
											</pre>
										) : (
											nonFrameOps.map((o) => (
												<Operation
													key={`cell-operation--${cell.id}--${o}`}
													operation={o}
													output={cell.output}
													expandAll={expandAllOutput}
													hideJsonToggle
													cellData={{
														cellId: cell.id.toString(),
														queryId:
															queryId.toString(),
													}}
												/>
											))
										)}
									</div>
									{frameOps.length > 0 ? (
										<div className="rounded bg-muted/30 px-2 py-1">
											{frameOps.map((o) => (
												<Operation
													key={`cell-operation--${cell.id}--${o}`}
													operation={o}
													output={cell.output}
													cellData={{
														cellId: cell.id.toString(),
														queryId:
															queryId.toString(),
													}}
												/>
											))}
										</div>
									) : null}
									{renderOutputFooter()}
								</div>
							);
						})()
					: null}
			</div>
		);

		const cellTypeLabel = (() => {
			if (cell.widget === "code") {
				const lang = (cell.parameters as { language?: string })
					?.language;
				if (lang === "python") return "Python";
				if (lang === "r") return "R";
				if (lang === "pixel") return "Pixel";
				if (cell.parameters.type === "markdown") return "Markdown";
				return "Code";
			}
			if (cell.widget === "query-import") return "Query";
			if (cell.widget === "data-import") return "Query Builder";
			if (cell.widget === "mcp-tool") return "MCP";
			if (typeof cell.widget === "string") {
				return cell.widget
					.split("-")
					.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
					.join(" ");
			}
			return "Cell";
		})();

		return (
			<div className="flex flex-col gap-1 pb-2">
				<div className="flex w-full flex-row items-start gap-1">
					{/* Left rail: drag handle, play, [n] */}
					<div className="flex w-10 shrink-0 flex-col items-center gap-2 pt-2">
						{/* biome-ignore lint/a11y/noStaticElementInteractions: drag handle, drag attrs come from dnd-kit */}
						<div
							{...dragHandleProps}
							title="Drag to reorder"
							className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground"
						>
							<GripVertical className="size-4" />
						</div>
						<button
							type="button"
							title="Run cell"
							disabled={cell.isLoading}
							className="group/run flex flex-col items-center gap-1 disabled:opacity-70"
							onMouseDown={() => {
								notebook.selectCell(cell.query.id, cell.id);
								state.dispatch({
									message: ActionMessages.RUN_CELL,
									payload: {
										queryId: cell.query.id,
										cellId: cell.id,
									},
								});
							}}
						>
							<span
								className={`inline-flex size-7 items-center justify-center rounded-full border transition-colors ${
									cell.isLoading
										? "border-muted-foreground/40 text-muted-foreground"
										: cell.isSuccessful
											? "border-green-600/50 text-green-600 group-hover/run:border-green-700 group-hover/run:text-green-700"
											: cell.isError
												? "border-destructive/50 text-destructive group-hover/run:border-destructive group-hover/run:text-destructive/80"
												: "border-muted-foreground/40 text-muted-foreground group-hover/run:border-primary group-hover/run:text-primary"
								}`}
							>
								{cell.isLoading ? (
									<Spinner className="size-3.5" />
								) : (
									<Play className="size-3.5" />
								)}
							</span>
							<span className="font-mono text-muted-foreground text-xs leading-none">
								{cell.isLoading
									? "[*]"
									: localCellPlayNumber
										? `[${localCellPlayNumber}]`
										: "[ ]"}
							</span>
						</button>
					</div>

					{/* Card */}
					{/* biome-ignore lint/a11y/noStaticElementInteractions: card container, selecting cell on click */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: card container, keyboard nav handled by inner buttons */}
					<div
						className={`@container min-w-0 flex-grow cursor-pointer overflow-visible rounded-sm border-l-[3px] transition-colors ${
							isCellSelected
								? "border border-primary border-l-primary bg-background ring-1 ring-primary/30"
								: "border border-border/40 border-l-transparent bg-background hover:bg-muted/30"
						}`}
						onClick={() =>
							notebook.selectCell(cell.query.id, cell.id)
						}
					>
						{/* Header row */}
						<div className="flex items-center justify-between gap-2 border-border/40 border-b px-3 py-1.5">
							<div className="flex min-w-0 items-center gap-2">
								{variableName ? (
									<div className="inline-flex min-w-0 items-center gap-1">
										<button
											type="button"
											title={`Copy {{${variableName}}}`}
											className="inline-flex min-w-0 cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-foreground text-sm outline-none transition-colors hover:text-primary focus:outline-none focus-visible:outline-none"
											onClick={(e) => {
												e.stopPropagation();
												copyTextToClipboard(
													`{{${variableName}}}`,
												);
											}}
										>
											<span
												className="block min-w-0 max-w-[16ch] truncate font-mono"
												style={noLigatureStyle}
											>
												{variableName}
											</span>
											<Copy className="@md:inline-block hidden size-3 shrink-0" />
										</button>
										<button
											type="button"
											title="Rename variable"
											className="@md:inline-flex hidden cursor-pointer items-center rounded-sm border-none bg-transparent p-0.5 text-muted-foreground outline-none transition-colors hover:text-primary focus:outline-none focus-visible:outline-none"
											disabled={cell.isLoading}
											onClick={(e) => {
												e.stopPropagation();
												setRenameOpen(true);
											}}
										>
											<Pencil className="size-3" />
										</button>
									</div>
								) : (
									<Button
										title="Use as variable"
										variant="ghost"
										size="sm"
										className="h-7 gap-1 px-2 text-muted-foreground text-xs"
										disabled={cell.isLoading}
										onClick={(e) => {
											e.stopPropagation();
											setVariableModal(true);
										}}
									>
										<BookPlus className="size-3" />
										Name
									</Button>
								)}
								<span className="@lg:inline-flex hidden @lg:items-center whitespace-nowrap rounded bg-muted px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
									{cellTypeLabel}
								</span>
							</div>
							<div className="flex items-center gap-2">
								{(cell.isSuccessful || cell.isError) && (
									<Tooltip>
										<TooltipTrigger asChild>
											<span className="font-mono text-muted-foreground text-xs">
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
								<ButtonGroup>
									<Button
										title="Run the cells above and this cell"
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
									{/* Inline secondary actions — visible when there's room */}
									{cell.query.id === MCP_NOTEBOOK_NAME && (
										<Button
											title={
												cell.widget === "mcp-tool"
													? "Revert to Code"
													: "Make Available through MCP"
											}
											variant="ghost"
											size="sm"
											className="@sm:inline-flex hidden h-7 px-2"
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
										title="Duplicate cell"
										variant="ghost"
										size="sm"
										className="@sm:inline-flex hidden h-7 px-2"
										disabled={cell.isLoading}
										onClick={(e) => {
											e.stopPropagation();
											duplicateCell();
										}}
									>
										<CopyPlus className="size-4" />
									</Button>
									<Button
										title="Delete cell"
										variant="ghost"
										size="sm"
										className="@sm:inline-flex hidden h-7 px-2"
										disabled={
											cell.isLoading ||
											(query?.list.length ?? 0) <= 1
										}
										onClick={(e) => {
											e.stopPropagation();
											deleteCell();
										}}
									>
										<Trash2 className="size-4" />
									</Button>
								</ButtonGroup>
								{/* Kebab fallback — only when too narrow for inline actions */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											title="More actions"
											variant="ghost"
											size="sm"
											className="@sm:hidden h-7 px-1.5"
											disabled={cell.isLoading}
											onClick={(e) => e.stopPropagation()}
										>
											<MoreVertical className="size-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onSelect={() => duplicateCell()}
										>
											<CopyPlus className="size-4" />
											Duplicate cell
										</DropdownMenuItem>
										{cell.query.id ===
											MCP_NOTEBOOK_NAME && (
											<DropdownMenuItem
												disabled={
													cell.isLoading ||
													cell.widget === "mcp-tool"
														? false
														: !workspace.agentModelEngine
												}
												onSelect={() => {
													if (
														cell.widget !==
														"mcp-tool"
													) {
														makeCellMCP();
													} else {
														revertMCPToCell();
													}
												}}
											>
												{cell.widget === "mcp-tool" ? (
													<>
														<ArrowLeftRight className="size-4" />
														Revert to Code
													</>
												) : (
													<>
														<HammerIcon size={14} />
														Make Available through
														MCP
													</>
												)}
											</DropdownMenuItem>
										)}
										<DropdownMenuItem
											disabled={
												(query?.list.length ?? 0) <= 1
											}
											onSelect={() => deleteCell()}
										>
											<Trash2 className="size-4" />
											Delete cell
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>

						{/* Card content */}
						<div
							id={`notebook-cell-${queryId}-${cellId}-card-content`}
							ref={cardContentRef}
							className="px-3 py-2"
						>
							<div className="min-w-0 flex-1">{rendered}</div>
						</div>

						{/* Card output area */}
						{cell.parameters.type !== "markdown" &&
							cell.widget !== "llm" && (
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

				{variableName && (
					<RenameVariableDialog
						open={renameOpen}
						onOpenChange={setRenameOpen}
						currentName={variableName}
					/>
				)}

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
					<DialogContent className="flex max-h-[85vh] w-[80vw] max-w-[80vw] flex-col sm:max-w-[80vw]">
						<DialogHeader>
							<div className="flex items-center justify-between gap-2 pr-8">
								<DialogTitle>
									Logging ({cell.messages.length})
								</DialogTitle>
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
						</DialogHeader>
						<div className="flex-1 overflow-hidden rounded bg-muted/30">
							<div className="h-full overflow-y-auto px-3 py-2">
								<NotebookCellConsole messages={cell.messages} />
							</div>
						</div>
					</DialogContent>
				</Dialog>

				<Dialog
					open={showOutputModal}
					onOpenChange={(o) => !o && setShowOutputModal(false)}
				>
					<DialogContent
						showCloseButton={false}
						className="flex max-h-[85vh] w-[80vw] max-w-[80vw] flex-col sm:max-w-[80vw]"
					>
						<DialogHeader>
							<DialogTitle className="sr-only">
								Output
							</DialogTitle>
							<div className="flex items-center justify-between gap-2">
								<div className="flex min-w-0 items-center gap-2">
									<Braces className="size-4 text-muted-foreground" />
									<span className="font-medium text-foreground text-sm">
										Output
									</span>
									{outputIsJson && (
										<span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
											JSON
										</span>
									)}
								</div>
								<div className="flex items-center gap-1">
									<Button
										title={
											showRaw
												? "Show formatted"
												: "Show raw"
										}
										variant={
											showRaw ? "secondary" : "ghost"
										}
										size="sm"
										className="h-7 px-2 text-xs"
										onClick={() => setShowRaw((v) => !v)}
									>
										{showRaw ? "Formatted" : "Raw"}
									</Button>
									<Button
										title="Copy output"
										variant="ghost"
										size="sm"
										className="h-7 px-2 text-muted-foreground"
										onClick={() =>
											copyTextToClipboard(rawOutput)
										}
									>
										<Copy className="size-3" />
									</Button>
									<DialogClose asChild>
										<Button
											title="Close"
											variant="ghost"
											size="sm"
											className="h-7 px-2 text-muted-foreground"
										>
											<X className="size-3" />
										</Button>
									</DialogClose>
								</div>
							</div>
						</DialogHeader>
						<div className="flex flex-1 flex-col gap-2 overflow-y-auto">
							{(() => {
								const isFrameOp = (o: string) =>
									o === "FRAME_DATA_CHANGE" ||
									o === "FRAME_FILTER_CHANGE";
								const frameOps =
									cell.operation.filter(isFrameOp);
								const nonFrameOps = cell.operation.filter(
									(o) => !isFrameOp(o),
								);
								return (
									<>
										<div className="rounded bg-muted/30 px-3 py-2">
											{showRaw ? (
												<pre className="whitespace-pre-wrap break-all font-mono text-xs">
													{rawOutput}
												</pre>
											) : (
												nonFrameOps.map((o) => (
													<Operation
														key={`cell-operation-modal--${cell.id}--${o}`}
														operation={o}
														output={cell.output}
														expandAll={
															expandAllOutput
														}
														hideJsonToggle
														cellData={{
															cellId: cell.id.toString(),
															queryId:
																queryId.toString(),
														}}
													/>
												))
											)}
										</div>
										{frameOps.length > 0 ? (
											<div className="rounded bg-muted/30 px-3 py-2">
												{frameOps.map((o) => (
													<Operation
														key={`cell-operation-modal-frame--${cell.id}--${o}`}
														operation={o}
														output={cell.output}
														cellData={{
															cellId: cell.id.toString(),
															queryId:
																queryId.toString(),
														}}
													/>
												))}
											</div>
										) : null}
									</>
								);
							})()}
						</div>
						{renderOutputFooter()}
					</DialogContent>
				</Dialog>
			</div>
		);
	},
);
