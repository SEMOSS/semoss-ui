import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { EraserIcon, FileCode2Icon, PlayIcon, PlusIcon } from "lucide-react";
import React, {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import {
	getPixelAsyncResult,
	console as getPixelConsole,
	runPixel,
	runPixelAsync,
	useInsight,
} from "@semoss/sdk/react";
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
	Muted,
} from "@semoss/ui/next";
import type {
	JupyterCell,
	JupyterCellType,
	JupyterNotebook,
	JupyterOutput,
} from "./notebook.types";
import {
	createCell,
	exportAsPythonScript,
	insertCell,
	nextExecutionCount,
	normalizeSource,
	toCellOutputs,
	unwrapPixelOutput,
	validateNotebook,
} from "./notebook.utility";
import type { NotebookCellBaseProps } from "./notebook-cell";
import { NotebookCellSeparator } from "./notebook-cell-separator";
import { NotebookCodeCell } from "./notebook-code-cell";
import { NotebookMarkdownCell } from "./notebook-markdown-cell";
import { NotebookRawCell } from "./notebook-raw-cell";
import { SortableCell } from "./notebook-sortable-cell";

interface NotebookProps {
	/** Raw `.ipynb` JSON that seeds the in-memory editor. */
	content: string;

	/** Fired on every edit with the serialized notebook and its modified flag. */
	onChange?: (content: string, isModified: boolean) => void;

	/** Insight to run cells against; defaults to the ambient insight. */
	insightId?: string;

	/** Fires whenever the notebook's state changes (for an external toolbar). */
	onStateChange?: (state: NotebookState) => void;

	/** When true, lock editing/structure so only running cells is allowed. */
	readOnly?: boolean;
}

/** A snapshot of the notebook's live state, emitted whenever it changes. */
export interface NotebookState {
	/** True while a cell or run-all batch is executing. */
	isRunning: boolean;

	/** Progress of a run-all / above / below batch, else null. */
	runProgress: { current: number; total: number } | null;

	/** True when the notebook has at least one code cell. */
	hasCodeCells: boolean;

	/** True when any code cell currently has outputs. */
	hasOutputs: boolean;
}

/** Imperative API exposed via `ref` for driving the notebook from a parent. */
export interface NotebookHandle {
	/** Run every code cell top-to-bottom. */
	runAll: () => Promise<void>;

	/** Cancel the in-flight execution. */
	interrupt: () => Promise<void>;

	/** Serialize the current in-memory notebook to `.ipynb` JSON. */
	save: () => string;
}

/**
 * Interactive, in-memory `.ipynb` viewer/editor. Seeds from a raw `content`
 * JSON string, parses it into an in-memory notebook, and renders each cell
 * (markdown / raw / code). Code and markdown sources are editable; code cells
 * run server-side (Python via the `Py()` reactor) with their outputs mapped
 * back to nbformat. Edits are surfaced through `onChange`; running and
 * serializing are also available imperatively via `ref` (`NotebookHandle`).
 * File I/O (load / save / download) is owned by the `FileNotebook` wrapper.
 */
export const Notebook = forwardRef<NotebookHandle, NotebookProps>(
	(
		{
			content,
			onChange = () => null,
			insightId,
			onStateChange,
			readOnly = false,
		},
		ref,
	) => {
		const insight = useInsight();

		const [notebook, setNotebook] = useState<JupyterNotebook | null>(null);
		const [parseError, setParseError] = useState<string | null>(null);
		const [runningCellIndex, setRunningCellIndex] = useState<number | null>(
			null,
		);
		const [isRunningAll, setIsRunningAll] = useState(false);
		const [activeCellIndex, setActiveCellIndex] = useState<number | null>(
			null,
		);
		const [runAllProgress, setRunAllProgress] = useState<{
			current: number;
			total: number;
		} | null>(null);
		// Live console output per cell id while running; shown but never persisted.
		const [streamingLogs, setStreamingLogs] = useState<
			Record<string, string[]>
		>({});

		// Per-cell DOM refs for scroll-to-cell.
		const cellRefs = useRef<Record<number, HTMLDivElement | null>>({});
		// Tracks the in-flight async job so the Stop button can cancel it.
		const currentJobIdRef = useRef<string | null>(null);
		const abortRequestedRef = useRef(false);
		// Latest state callback, read through a ref to keep the effect stable.
		const onStateChangeRef = useRef(onStateChange);
		onStateChangeRef.current = onStateChange;

		const execInsightId = insightId ?? insight.insightId;

		// Re-seed the in-memory notebook whenever the raw content changes.
		useEffect(() => {
			if (!content.trim()) {
				setNotebook(null);
				setParseError(null);
				return;
			}

			try {
				const validated = validateNotebook(content);
				setNotebook(validated);
				setParseError(null);
			} catch (e) {
				setNotebook(null);
				setParseError(
					e instanceof Error ? e.message : "Invalid notebook",
				);
			}
		}, [content]);

		// Scroll the running / newly-activated cell into view.
		useEffect(() => {
			const idx = runningCellIndex ?? activeCellIndex;
			if (idx === null) {
				return;
			}
			const el = cellRefs.current[idx];
			el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}, [runningCellIndex, activeCellIndex]);

		const isBusy = isRunningAll || runningCellIndex !== null;

		/**
		 * Persist an edited notebook to state and flag the file as modified.
		 */
		const updateNotebook = (next: JupyterNotebook) => {
			setNotebook(next);
			onChange(JSON.stringify(next, null, 2), true);
		};

		/**
		 * Run a single code cell against `source` (the latest cells; defaults to
		 * current state): build its Pixel, execute it, map the streamed result into
		 * nbformat outputs, and commit them back onto the cell. Returns the updated
		 * notebook so sequential runners can thread the newest cells forward. A
		 * cell-level Python error (or a thrown network error) becomes an nbformat
		 * "error" output rather than propagating.
		 */
		const executeCell = async (
			index: number,
			source?: JupyterNotebook,
		): Promise<JupyterNotebook | null> => {
			const current = source ?? notebook;
			const cell = current?.cells[index];
			if (!current || !cell || cell.cell_type !== "code") {
				return current;
			}

			setRunningCellIndex(index);
			setStreamingLogs((prev) => ({ ...prev, [cell.id]: [] }));
			const executionCount = nextExecutionCount(current);

			let outputs: JupyterOutput[] = [];
			try {
				const cellSource = normalizeSource(cell.source);
				const pixel = cellSource.trim()
					? `Py("<encode>${cellSource}</encode>");`
					: "";

				let logs: string[] = [];
				let value: unknown;
				let isError = false;
				let wasInterrupted = false;

				if (pixel) {
					const { jobId } = await runPixelAsync(pixel, execInsightId);
					currentJobIdRef.current = jobId;

					logs = [];
					let isPolling = true;
					while (isPolling) {
						if (abortRequestedRef.current) {
							wasInterrupted = true;
							isPolling = false;
							break;
						}
						const { message: messages, status } =
							await getPixelConsole(jobId);
						logs.push(...messages);
						setStreamingLogs((prev) => ({
							...prev,
							[cell.id]: [...logs],
						}));

						if (
							status === "ProgressComplete" ||
							status === "Streaming" ||
							status === "Complete"
						) {
							isPolling = false;
						} else {
							await new Promise((resolve) =>
								setTimeout(resolve, 1000),
							);
						}
					}

					if (!wasInterrupted) {
						// Final flush — pull any logs written after the last poll.
						const { message: finalMessages } =
							await getPixelConsole(jobId);

						logs.push(...finalMessages);

						setStreamingLogs((prev) => ({
							...prev,
							[cell.id]: [...logs],
						}));

						const { errors, results } =
							await getPixelAsyncResult<[unknown]>(jobId);

						const last = results[results.length - 1];
						isError =
							errors.length > 0 ||
							(last?.operationType ?? []).includes("ERROR");

						value = isError
							? errors.join("\n") ||
								String(
									unwrapPixelOutput(last) ??
										"Execution error",
								)
							: unwrapPixelOutput(last);
					}
				}

				// Streamed console logs live only in the transient Console block, so
				// persist just the final result/error value here.
				outputs = wasInterrupted
					? toCellOutputs([], "Interrupted", true, executionCount)
					: toCellOutputs([], value, isError, executionCount);
			} catch (e) {
				const message = e instanceof Error ? e.message : String(e);
				outputs = toCellOutputs([], message, true, executionCount);
			} finally {
				currentJobIdRef.current = null;
			}

			const next: JupyterNotebook = {
				...current,
				cells: current.cells.map((c, i) =>
					i === index && c.cell_type === "code"
						? { ...c, outputs, execution_count: executionCount }
						: c,
				),
			};

			updateNotebook(next);
			setRunningCellIndex(null);

			return next;
		};

		const runAllCells = async () => {
			if (!notebook || isBusy) return;

			const codeCellCount = notebook.cells.filter(
				(c) => c.cell_type === "code",
			).length;
			abortRequestedRef.current = false;
			setRunAllProgress({ current: 0, total: codeCellCount });
			setIsRunningAll(true);
			try {
				let working: JupyterNotebook = notebook;
				const count = working.cells.length;
				let ran = 0;
				for (let index = 0; index < count; index += 1) {
					if (abortRequestedRef.current) break;
					if (working.cells[index]?.cell_type === "code") {
						working =
							(await executeCell(index, working)) ?? working;
						ran += 1;
						setRunAllProgress({
							current: ran,
							total: codeCellCount,
						});
					}
				}
			} finally {
				setIsRunningAll(false);
				setRunAllProgress(null);
			}
		};

		/** Run every code cell above `index`, leaving that cell untouched. */
		const runCellsAbove = async (index: number) => {
			if (!notebook || isBusy) {
				return;
			}

			const codeCellCount = notebook.cells
				.slice(0, index)
				.filter((c) => c.cell_type === "code").length;
			abortRequestedRef.current = false;
			setRunAllProgress({ current: 0, total: codeCellCount });
			setIsRunningAll(true);
			try {
				let working: JupyterNotebook = notebook;
				let ran = 0;
				for (let i = 0; i < index; i += 1) {
					if (abortRequestedRef.current) break;
					if (working.cells[i]?.cell_type === "code") {
						clearCellOutputs(i);
						working = (await executeCell(i, working)) ?? working;
						ran += 1;
						setRunAllProgress({
							current: ran,
							total: codeCellCount,
						});
					}
				}
			} finally {
				setIsRunningAll(false);
				setRunAllProgress(null);
			}
		};

		/** Run every code cell below `index`, leaving that cell untouched. */
		const runCellsBelow = async (index: number) => {
			if (!notebook || isBusy) return;

			const codeCellCount = notebook.cells
				.slice(index + 1)
				.filter((c) => c.cell_type === "code").length;
			abortRequestedRef.current = false;
			setRunAllProgress({ current: 0, total: codeCellCount });
			setIsRunningAll(true);
			try {
				let working: JupyterNotebook = notebook;
				const count = working.cells.length;
				let ran = 0;
				for (let i = index + 1; i < count; i += 1) {
					if (abortRequestedRef.current) break;
					if (working.cells[i]?.cell_type === "code") {
						clearCellOutputs(i);
						working = (await executeCell(i, working)) ?? working;
						ran += 1;
						setRunAllProgress({
							current: ran,
							total: codeCellCount,
						});
					}
				}
			} finally {
				setIsRunningAll(false);
				setRunAllProgress(null);
			}
		};

		/** Wrapper for single-cell runs that resets the abort flag first. */
		const runCell = (index: number) => {
			clearCellOutputs(index);
			abortRequestedRef.current = false;
			void executeCell(index);
		};

		/** Run a cell then advance focus; inserts nothing — stays at last cell if already there. */
		const runAndAdvanceCell = async (index: number) => {
			if (!notebook) return;
			clearCellOutputs(index);
			abortRequestedRef.current = false;
			await executeCell(index);
			if (index < notebook.cells.length - 1) {
				setActiveCellIndex(index + 1);
			}
		};

		/** Cancel the in-flight execution via StopPixelExecution. */
		const interruptExecution = async () => {
			abortRequestedRef.current = true;
			const jobId = currentJobIdRef.current;
			if (jobId) {
				try {
					await runPixel(
						`StopPixelExecution(id=["${jobId}"]);`,
						execInsightId,
					);
				} catch {
					// ignore — abort flag already set
				}
			}
		};

		/** Clear outputs for a single code cell (and its live console). */
		const clearCellOutputs = (index: number) => {
			if (!notebook) return;
			const cellId = notebook.cells[index]?.id;
			if (cellId) {
				setStreamingLogs((prev) => {
					if (!(cellId in prev)) return prev;
					const next = { ...prev };
					delete next[cellId];
					return next;
				});
			}
			updateNotebook({
				...notebook,
				cells: notebook.cells.map((cell, i) =>
					i === index && cell.cell_type === "code"
						? { ...cell, outputs: [] }
						: cell,
				),
			});
		};

		/** Clear outputs on every code cell at once (and all live consoles). */
		const clearAllOutputs = () => {
			if (!notebook) return;
			setStreamingLogs({});
			updateNotebook({
				...notebook,
				cells: notebook.cells.map((cell) =>
					cell.cell_type === "code" ? { ...cell, outputs: [] } : cell,
				),
			});
		};

		/** Deep-copy a cell with a new id and insert it immediately below. */
		const duplicateCell = (index: number) => {
			if (!notebook || isBusy) return;
			const cell = notebook.cells[index];
			if (!cell) return;
			const copy: JupyterCell = {
				...cell,
				id: crypto.randomUUID(),
				...(cell.cell_type === "code"
					? { outputs: [], execution_count: null }
					: {}),
			} as JupyterCell;
			updateNotebook(insertCell(notebook, copy, index + 1));
		};

		/** Trigger a browser download of the notebook as a .py script. */
		const exportAsPython = () => {
			if (!notebook) return;
			const script = exportAsPythonScript(notebook);
			const blob = new Blob([script], { type: "text/x-python" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "notebook.py";
			a.click();
			URL.revokeObjectURL(url);
		};

		/** Persist an edited cell source (code or markdown) so it can be saved. */
		const updateCellSource = (index: number, source: string) => {
			if (!notebook || isBusy) {
				return;
			}

			updateNotebook({
				...notebook,
				cells: notebook.cells.map((cell, cellIndex) => {
					if (cellIndex !== index) {
						return cell;
					}
					if (cell.cell_type === "code") {
						return { ...cell, source };
					}
					if (cell.cell_type === "markdown") {
						return { ...cell, source };
					}
					return { ...cell, source };
				}),
			});
		};

		/** Move the cell at `from` to `to`, ignoring out-of-range / no-op moves. */
		const moveCell = (from: number, to: number) => {
			if (!notebook || isBusy) {
				return;
			}
			const { length } = notebook.cells;
			if (
				from === to ||
				from < 0 ||
				to < 0 ||
				from >= length ||
				to >= length
			) {
				return;
			}
			const cells = [...notebook.cells];
			const [moved] = cells.splice(from, 1);
			cells.splice(to, 0, moved);

			updateNotebook({
				...notebook,
				cells,
			});
		};

		/** Delete the cell at `index`. */
		const deleteCell = (index: number) => {
			if (!notebook || isBusy) {
				return;
			}
			updateNotebook({
				...notebook,
				cells: notebook.cells.filter((_, i) => i !== index),
			});
		};

		/** Reorder cells when a drag ends over a different cell. */
		const handleDragEnd = (event: DragEndEvent) => {
			const { active, over } = event;
			if (!over || active.id === over.id) {
				return;
			}
			const from =
				notebook?.cells.findIndex((c) => c.id === active.id) ?? -1;
			const to = notebook?.cells.findIndex((c) => c.id === over.id) ?? -1;
			if (from !== -1 && to !== -1) {
				moveCell(from, to);
			}
		};

		/** Insert a new empty cell of `type` at `at`, appending when omitted. */
		const addCell = (type: JupyterCellType, index?: number) => {
			if (!notebook || isBusy) {
				return;
			}

			const cell = createCell(type);
			const cells = [...notebook.cells];
			const at =
				index === undefined || index < 0 || index > cells.length
					? cells.length
					: index;

			cells.splice(at, 0, cell);

			updateNotebook({
				...notebook,
				cells,
			});
		};

		/** Switch a cell to a different type, preserving its source. */
		const changeType = (index: number, type: JupyterCellType) => {
			if (!notebook || isBusy) {
				return;
			}
			updateNotebook({
				...notebook,
				cells: notebook.cells.map((cell, cellIndex) => {
					if (cellIndex !== index || cell.cell_type === type) {
						return cell;
					}
					const base = {
						id: cell.id,
						metadata: cell.metadata,
						source: cell.source,
					};

					if (type === "markdown") {
						return {
							...base,
							cell_type: "markdown" as const,
						};
					}
					if (type === "raw") {
						return {
							...base,
							cell_type: "raw" as const,
						};
					}
					return {
						...base,
						cell_type: "code" as const,
						execution_count: null,
						outputs: [],
					};
				}),
			});
		};

		/** Persist an edited cell display name; empty clears back to the type default. */
		const renameCell = (index: number, name: string) => {
			if (!notebook || isBusy) {
				return;
			}
			const trimmed = name.trim();
			updateNotebook({
				...notebook,
				cells: notebook.cells.map((cell, cellIndex) => {
					if (cellIndex !== index) {
						return cell;
					}
					if (!trimmed) {
						const { name: _omit, ...restMetadata } = cell.metadata;
						return { ...cell, metadata: restMetadata };
					}
					return {
						...cell,
						metadata: { ...cell.metadata, name: trimmed },
					};
				}),
			});
		};

		// Expose running + serialization so a wrapper (e.g. FileNotebook) can drive
		// the notebook from its own toolbar and persist the current state.
		useImperativeHandle(ref, () => ({
			runAll: runAllCells,
			interrupt: interruptExecution,
			save: () => (notebook ? JSON.stringify(notebook, null, 2) : ""),
		}));

		const hasCodeCells = Boolean(
			notebook?.cells.some((cell) => cell.cell_type === "code"),
		);
		const hasCellOutputs = Boolean(
			notebook?.cells.some(
				(cell) => cell.cell_type === "code" && cell.outputs.length > 0,
			),
		);

		// Emit a snapshot whenever anything a parent toolbar cares about changes.
		useEffect(() => {
			onStateChangeRef.current?.({
				isRunning: isBusy,
				runProgress: runAllProgress,
				hasCodeCells,
				hasOutputs: hasCellOutputs,
			});
		}, [isBusy, runAllProgress, hasCodeCells, hasCellOutputs]);

		return (
			<ContextMenu>
				<ContextMenuTrigger asChild>
					<div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
						{/* Notebook body */}
						<div className="flex-1 overflow-y-auto">
							{parseError && (
								<div className="flex h-full w-full items-center justify-center">
									<Muted className="text-destructive">
										{parseError}
									</Muted>
								</div>
							)}
							{!parseError && notebook && (
								<DndContext
									collisionDetection={closestCenter}
									modifiers={[restrictToParentElement]}
									onDragEnd={handleDragEnd}
								>
									<SortableContext
										items={notebook.cells.map((c) => c.id)}
										strategy={verticalListSortingStrategy}
									>
										<div className="container mx-auto flex w-full flex-col pt-4 pr-12 pb-20 pl-2">
											{notebook.cells.map(
												(cell, index) => {
													const commonCellProps: NotebookCellBaseProps =
														{
															index,
															disabled: isBusy,
															readOnly,
															isActive:
																activeCellIndex ===
																index,
															onActivate:
																setActiveCellIndex,
															onChangeType:
																changeType,
															onRename:
																renameCell,
															onInsertAbove: (
																i,
																type,
															) =>
																addCell(
																	type,
																	i,
																),
															onInsertBelow: (
																i,
																type,
															) =>
																addCell(
																	type,
																	i + 1,
																),
															onDuplicate:
																duplicateCell,
															onDelete:
																deleteCell,
															onMoveUp: (i) =>
																moveCell(
																	i,
																	i - 1,
																),
															onMoveDown: (i) =>
																moveCell(
																	i,
																	i + 1,
																),
															canMoveUp:
																index > 0,
															canMoveDown:
																index <
																notebook.cells
																	.length -
																	1,
														};

													let cellBody: React.ReactElement;
													if (
														cell.cell_type ===
														"code"
													) {
														cellBody = (
															<NotebookCodeCell
																cell={cell}
																{...commonCellProps}
																isRunning={
																	runningCellIndex ===
																	index
																}
																canRunAbove={notebook.cells
																	.slice(
																		0,
																		index,
																	)
																	.some(
																		(
																			above,
																		) =>
																			above.cell_type ===
																			"code",
																	)}
																canRunBelow={notebook.cells
																	.slice(
																		index +
																			1,
																	)
																	.some(
																		(
																			below,
																		) =>
																			below.cell_type ===
																			"code",
																	)}
																onRun={runCell}
																onRunAndAdvance={
																	runAndAdvanceCell
																}
																onInterrupt={
																	interruptExecution
																}
																onRunAbove={
																	runCellsAbove
																}
																onRunBelow={
																	runCellsBelow
																}
																onClearOutput={
																	clearCellOutputs
																}
																onSourceChange={
																	updateCellSource
																}
																streamingLogs={
																	streamingLogs[
																		cell.id
																	]
																}
															/>
														);
													} else if (
														cell.cell_type ===
														"markdown"
													) {
														cellBody = (
															<NotebookMarkdownCell
																cell={cell}
																{...commonCellProps}
																onSourceChange={
																	updateCellSource
																}
															/>
														);
													} else {
														cellBody = (
															<NotebookRawCell
																cell={cell}
																{...commonCellProps}
															/>
														);
													}

													return (
														<React.Fragment
															key={cell.id}
														>
															<SortableCell
																id={cell.id}
																disabled={
																	isBusy ||
																	readOnly
																}
																label={`Moving ${cell.metadata.name || "cell"}`}
																onNodeRef={(
																	node,
																) => {
																	cellRefs.current[
																		index
																	] = node;
																}}
															>
																{cellBody}
															</SortableCell>
															{index <
																notebook.cells
																	.length -
																	1 && (
																<NotebookCellSeparator
																	readOnly={
																		readOnly
																	}
																	disabled={
																		isBusy
																	}
																	onInsert={(
																		type,
																	) =>
																		addCell(
																			type,
																			index +
																				1,
																		)
																	}
																/>
															)}
														</React.Fragment>
													);
												},
											)}

											{/* Add cell */}
											{!readOnly && (
												<div className="mt-2 flex items-center justify-center gap-2 pt-1">
													<Button
														variant="outline"
														size="sm"
														disabled={isBusy}
														onClick={() =>
															addCell("code")
														}
													>
														<PlusIcon className="size-4" />
														Code
													</Button>
													<Button
														variant="outline"
														size="sm"
														disabled={isBusy}
														onClick={() =>
															addCell("markdown")
														}
													>
														<PlusIcon className="size-4" />
														Markdown
													</Button>
												</div>
											)}
										</div>
									</SortableContext>
								</DndContext>
							)}
						</div>
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent>
					{!readOnly && (
						<>
							<ContextMenuItem
								disabled={!notebook || isBusy}
								onClick={() => exportAsPython()}
							>
								<FileCode2Icon className="size-4" />
								Export as .py
							</ContextMenuItem>
							<ContextMenuSeparator />
						</>
					)}
					<ContextMenuItem
						disabled={!hasCodeCells || isBusy}
						onClick={() => runAllCells()}
					>
						<PlayIcon className="size-4" />
						Run All
					</ContextMenuItem>
					{!readOnly && hasCellOutputs && (
						<ContextMenuItem
							disabled={isBusy}
							onClick={() => clearAllOutputs()}
						>
							<EraserIcon className="size-4" />
							Clear All
						</ContextMenuItem>
					)}
				</ContextMenuContent>
			</ContextMenu>
		);
	},
);

Notebook.displayName = "Notebook";
